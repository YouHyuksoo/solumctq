/**
 * @file src/app/api/ctq/repeatability/route.ts
 * @description 반복성 모니터링 API - 동일불량 연속발생 동일 Location
 *
 * 초보자 가이드:
 * 1. **대상 공정**: FT, ATE, IMAGE, SETTV
 * 2. **판정 기준**: 수리등록된 NG 중 시간순 연속 2건이 동일 Location → A급, 아니면 OK
 * 3. **테이블/컬럼 차이**:
 *    - FT/ATE: PID + INSPECT_DATE(VARCHAR, 시간포함)
 *    - IMAGE: BARCODE + STARTTIME(DATE, 시간포함, 인덱스)
 *    - SETTV: BARCODE + INSPECT_TIME(DATE, 시간포함, PK)
 * 4. **매일 08:00 ~ 다음날 08:00** 하루치만 대상, QC_CONFIRM_YN='Y' 제외
 *
 * 성능 최적화:
 * - Connection Pool 사용 (oracle.ts)
 * - SQL 집계로 요약 데이터만 전송 (수만건 → 수십건)
 * - 반복 Location 감지도 SQL에서 처리
 * - 날짜 상하한 조건으로 인덱스 레인지 스캔 최적화
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type {
  RepeatProcessType,
  RepeatProcessStatus,
  RepeatLineCardData,
  RepeatGrade,
} from "@/app/monitoring/repeatability/types";

export const dynamic = "force-dynamic";

interface ProcessConfig {
  table: string;
  pidCol: string;
  dateCol: string;
  resultCol: string;
  dateType: "varchar" | "date";
}

const PROCESS_CONFIG: Record<RepeatProcessType, ProcessConfig> = {
  FT: {
    table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",
    pidCol: "PID",
    dateCol: "INSPECT_DATE",
    resultCol: "INSPECT_RESULT",
    dateType: "varchar",
  },
  ATE: {
    table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",
    pidCol: "PID",
    dateCol: "INSPECT_DATE",
    resultCol: "INSPECT_RESULT",
    dateType: "varchar",
  },
  IMAGE: {
    table: "IQ_MACHINE_INSPECT_DATA_PBA_FT",
    pidCol: "BARCODE",
    dateCol: "STARTTIME",
    resultCol: "RESULT",
    dateType: "date",
  },
  SETTV: {
    table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET",
    pidCol: "BARCODE",
    dateCol: "INSPECT_TIME",
    resultCol: "INSPECT_RESULT",
    dateType: "date",
  },
};

const PROCESS_LABELS: Record<RepeatProcessType, string> = {
  FT: "FT#1",
  ATE: "ATE",
  IMAGE: "IMAGE",
  SETTV: "SET검사",
};

const PROCESS_TYPES: RepeatProcessType[] = ["FT", "ATE", "IMAGE", "SETTV"];

/** 오늘 08:00 기준 시작/종료 시간 (하루치) */
function getTimeRange(): { startStr: string; endStr: string } {
  const now = new Date();
  if (now.getHours() < 8) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  const next = new Date(y, now.getMonth(), now.getDate() + 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, "0");
  const nd = String(next.getDate()).padStart(2, "0");

  return {
    startStr: `${y}/${m}/${d} 08:00:00`,
    endStr: `${ny}/${nm}/${nd} 08:00:00`,
  };
}

/** LINE별 NG 요약 (SQL 집계) */
interface LineSummaryRow {
  LINE_CODE: string;
  NG_COUNT: number;
  PENDING_COUNT: number;
  LAST_INSPECT: string;
}

/** 반복 Location 감지 결과 (SQL 집계) */
interface RepeatLocationRow {
  LINE_CODE: string;
  LOCATION_CODE: string;
  LOC_COUNT: number;
}

interface LineNameRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

/** 날짜 조건 생성 (VARCHAR/DATE 대응, 상하한 포함) */
function buildDateCondition(config: ProcessConfig, alias: string): {
  condition: string;
  params: Record<string, string>;
} {
  const col = `${alias}.${config.dateCol}`;
  if (config.dateType === "varchar") {
    return {
      condition: `${col} >= :tsStart AND ${col} < :tsEnd`,
      params: {},
    };
  }
  return {
    condition: `${col} >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS') AND ${col} < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')`,
    params: {},
  };
}

/** 공정별 LINE 요약 집계 (JOIN 없이 단순 GROUP BY → 고속) */
async function getLineSummary(
  config: ProcessConfig,
  timeRange: { startStr: string; endStr: string },
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<LineSummaryRow[]> {
  const { condition } = buildDateCondition(config, "t");
  const lastInspectExpr =
    config.dateType === "date"
      ? `TO_CHAR(MAX(t.${config.dateCol}), 'YYYY/MM/DD HH24:MI:SS')`
      : `MAX(t.${config.dateCol})`;

  const sql = `
    SELECT t.LINE_CODE,
           COUNT(*) AS NG_COUNT,
           0 AS PENDING_COUNT,
           ${lastInspectExpr} AS LAST_INSPECT
    FROM ${config.table} t
    WHERE ${condition}
      AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
      AND (t.QC_CONFIRM_YN IS NULL OR t.QC_CONFIRM_YN != 'Y')
      AND t.LINE_CODE IS NOT NULL
      ${lineFilter.clause}
    GROUP BY t.LINE_CODE
  `;
  return executeQuery<LineSummaryRow>(sql, {
    tsStart: timeRange.startStr,
    tsEnd: timeRange.endStr,
    ...lineFilter.params,
  });
}

/**
 * 공정별 동일 Location 연속불량 감지 (LAG 윈도우 함수)
 *
 * 시간순으로 정렬된 NG 레코드에서 연속 2건이 동일 Location이면 A급.
 * LOC_COUNT: 해당 라인에서 연속 동일위치 발생 횟수.
 */
async function getRepeatLocations(
  config: ProcessConfig,
  timeRange: { startStr: string; endStr: string },
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<RepeatLocationRow[]> {
  const { condition } = buildDateCondition(config, "t");

  const sql = `
    SELECT LINE_CODE, LOCATION_CODE, COUNT(*) AS LOC_COUNT
    FROM (
      SELECT LINE_CODE, LOCATION_CODE
      FROM (
        SELECT t.LINE_CODE,
               r.LOCATION_CODE,
               LAG(r.LOCATION_CODE) OVER (
                 PARTITION BY t.LINE_CODE ORDER BY t.${config.dateCol}
               ) AS PREV_LOC
        FROM ${config.table} t
        JOIN IP_PRODUCT_WORK_QC r
          ON r.SERIAL_NO = t.${config.pidCol}
          AND r.RECEIPT_DEFICIT = '2'
          AND r.LOCATION_CODE IS NOT NULL
        WHERE ${condition}
          AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
          AND (t.QC_CONFIRM_YN IS NULL OR t.QC_CONFIRM_YN != 'Y')
          AND t.LINE_CODE IS NOT NULL
          ${lineFilter.clause}
      )
      WHERE LOCATION_CODE = PREV_LOC
    )
    GROUP BY LINE_CODE, LOCATION_CODE
  `;
  return executeQuery<RepeatLocationRow>(sql, {
    tsStart: timeRange.startStr,
    tsEnd: timeRange.endStr,
    ...lineFilter.params,
  });
}

/** LINE_CODE 이름 조회 */
async function getLineNames(lineCodes: string[]): Promise<Map<string, string>> {
  if (lineCodes.length === 0) return new Map();
  const placeholders = lineCodes.map((_, i) => `:lc${i}`).join(",");
  const sql = `
    SELECT LINE_CODE, LINE_NAME
    FROM IP_PRODUCT_LINE
    WHERE LINE_CODE IN (${placeholders})
  `;
  const params: Record<string, string> = {};
  lineCodes.forEach((code, i) => {
    params[`lc${i}`] = code;
  });
  const rows = await executeQuery<LineNameRow>(sql, params);
  const map = new Map<string, string>();
  rows.forEach((r) => map.set(r.LINE_CODE, r.LINE_NAME));
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const timeRange = getTimeRange();

    /* 1. 4공정 × 2쿼리 = 8개 쿼리 병렬 실행 (요약 + 반복Location) */
    const [summaries, repeatLocs] = await Promise.all([
      Promise.all(PROCESS_TYPES.map((pt) => getLineSummary(PROCESS_CONFIG[pt], timeRange, lineFilter))),
      Promise.all(PROCESS_TYPES.map((pt) => getRepeatLocations(PROCESS_CONFIG[pt], timeRange, lineFilter))),
    ]);

    /* 2. 공정별 요약 및 반복Location → Map 변환 */
    const summaryByProcess = new Map<RepeatProcessType, Map<string, LineSummaryRow>>();
    const repeatByProcess = new Map<RepeatProcessType, Map<string, RepeatLocationRow>>();
    const allLineCodes = new Set<string>();

    PROCESS_TYPES.forEach((pt, i) => {
      const sMap = new Map<string, LineSummaryRow>();
      for (const row of summaries[i]) {
        sMap.set(row.LINE_CODE, row);
        allLineCodes.add(row.LINE_CODE);
      }
      summaryByProcess.set(pt, sMap);

      const rMap = new Map<string, RepeatLocationRow>();
      for (const row of repeatLocs[i]) {
        const existing = rMap.get(row.LINE_CODE);
        if (!existing || row.LOC_COUNT > existing.LOC_COUNT) {
          rMap.set(row.LINE_CODE, row);
        }
      }
      repeatByProcess.set(pt, rMap);
    });

    /* 3. 라인이름 조회 */
    const sortedLineCodes = [...allLineCodes].sort();
    const lineNameMap = await getLineNames(sortedLineCodes);

    /* 4. 라인별 카드 데이터 생성 */
    const lineCards: RepeatLineCardData[] = [];

    for (const lineCode of sortedLineCodes) {
      const processes: RepeatProcessStatus[] = [];
      let overallGrade: RepeatGrade = "OK";

      for (const pt of PROCESS_TYPES) {
        const summary = summaryByProcess.get(pt)?.get(lineCode);
        const repeat = repeatByProcess.get(pt)?.get(lineCode);
        const grade: RepeatGrade = repeat ? "A" : "OK";

        processes.push({
          process: pt,
          processLabel: PROCESS_LABELS[pt],
          grade,
          ngCount: summary?.NG_COUNT ?? 0,
          locationCode: repeat?.LOCATION_CODE ?? null,
          detail: repeat ? `연속불량:${repeat.LOC_COUNT}회(${repeat.LOCATION_CODE})` : null,
          lastInspectDate: summary?.LAST_INSPECT ?? null,
          pendingCount: summary?.PENDING_COUNT ?? 0,
        });

        if (grade === "A") overallGrade = "A";
      }

      lineCards.push({
        lineCode,
        lineName: lineNameMap.get(lineCode) || lineCode,
        processes,
        overallGrade,
      });
    }

    /* NG 라인 상단 정렬 */
    lineCards.sort((a, b) => {
      const order: Record<RepeatGrade, number> = { A: 0, B: 1, OK: 2 };
      return order[a.overallGrade] - order[b.overallGrade];
    });

    return NextResponse.json({
      lines: lineCards,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Repeatability API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
