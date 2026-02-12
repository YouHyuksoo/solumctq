/**
 * @file src/app/api/ctq/non-consecutive/route.ts
 * @description B급 모니터링 API - 동일위치 비연속불량
 *
 * 초보자 가이드:
 * 1. **대상 공정**: FT, ATE, IMAGE, SETTV
 * 2. **판정 기준**: 동일 Location 2건 이상이지만 연속은 아닌 경우 → B급
 * 3. **A급 제외**: 연속불량(A급)에 해당하는 Location은 B급에서 제외
 * 4. **매일 08:00 ~ 다음날 08:00** 하루치만 대상
 */

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";
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

/** 오늘 08:00 기준 시작/종료 시간 */
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

interface LineSummaryRow {
  LINE_CODE: string;
  NG_COUNT: number;
  PENDING_COUNT: number;
  LAST_INSPECT: string;
}

interface RepeatLocationRow {
  LINE_CODE: string;
  LOCATION_CODE: string;
  LOC_COUNT: number;
}

interface LineNameRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

function buildDateCondition(config: ProcessConfig, alias: string): string {
  const col = `${alias}.${config.dateCol}`;
  if (config.dateType === "varchar") {
    return `${col} >= :tsStart AND ${col} < :tsEnd`;
  }
  return `${col} >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS') AND ${col} < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')`;
}

/** LINE별 NG 요약 집계 */
async function getLineSummary(
  config: ProcessConfig,
  timeRange: { startStr: string; endStr: string }
): Promise<LineSummaryRow[]> {
  const condition = buildDateCondition(config, "t");
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
    GROUP BY t.LINE_CODE
  `;
  return executeQuery<LineSummaryRow>(sql, {
    tsStart: timeRange.startStr,
    tsEnd: timeRange.endStr,
  });
}

/**
 * B급 감지: 동일 Location 2건+ 이지만 연속은 아닌 경우
 *
 * 전체 동일Location(2건+)에서 연속불량(A급) Location을 제외
 */
async function getNonConsecutiveLocations(
  config: ProcessConfig,
  timeRange: { startStr: string; endStr: string }
): Promise<RepeatLocationRow[]> {
  const condition = buildDateCondition(config, "t");
  const conditionSub = buildDateCondition(config, "t2");

  const sql = `
    SELECT LINE_CODE, LOCATION_CODE, LOC_COUNT
    FROM (
      SELECT t.LINE_CODE,
             r.LOCATION_CODE,
             COUNT(*) AS LOC_COUNT
      FROM ${config.table} t
      JOIN IP_PRODUCT_WORK_QC r
        ON r.SERIAL_NO = t.${config.pidCol}
        AND r.RECEIPT_DEFICIT = '2'
        AND r.LOCATION_CODE IS NOT NULL
      WHERE ${condition}
        AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
        AND (t.QC_CONFIRM_YN IS NULL OR t.QC_CONFIRM_YN != 'Y')
        AND t.LINE_CODE IS NOT NULL
      GROUP BY t.LINE_CODE, r.LOCATION_CODE
      HAVING COUNT(*) >= 2
    ) total_loc
    WHERE (LINE_CODE, LOCATION_CODE) NOT IN (
      SELECT LINE_CODE, LOCATION_CODE
      FROM (
        SELECT t2.LINE_CODE,
               r2.LOCATION_CODE,
               LAG(r2.LOCATION_CODE) OVER (
                 PARTITION BY t2.LINE_CODE ORDER BY t2.${config.dateCol}
               ) AS PREV_LOC
        FROM ${config.table} t2
        JOIN IP_PRODUCT_WORK_QC r2
          ON r2.SERIAL_NO = t2.${config.pidCol}
          AND r2.RECEIPT_DEFICIT = '2'
          AND r2.LOCATION_CODE IS NOT NULL
        WHERE ${conditionSub}
          AND t2.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
          AND (t2.QC_CONFIRM_YN IS NULL OR t2.QC_CONFIRM_YN != 'Y')
          AND t2.LINE_CODE IS NOT NULL
      )
      WHERE LOCATION_CODE = PREV_LOC
    )
  `;
  return executeQuery<RepeatLocationRow>(sql, {
    tsStart: timeRange.startStr,
    tsEnd: timeRange.endStr,
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

export async function GET() {
  try {
    const timeRange = getTimeRange();

    /* 1. 4공정 × 2쿼리 병렬 실행 */
    const [summaries, bLocations] = await Promise.all([
      Promise.all(PROCESS_TYPES.map((pt) => getLineSummary(PROCESS_CONFIG[pt], timeRange))),
      Promise.all(PROCESS_TYPES.map((pt) => getNonConsecutiveLocations(PROCESS_CONFIG[pt], timeRange))),
    ]);

    /* 2. Map 변환 */
    const summaryByProcess = new Map<RepeatProcessType, Map<string, LineSummaryRow>>();
    const bLocByProcess = new Map<RepeatProcessType, Map<string, RepeatLocationRow>>();
    const allLineCodes = new Set<string>();

    PROCESS_TYPES.forEach((pt, i) => {
      const sMap = new Map<string, LineSummaryRow>();
      for (const row of summaries[i]) {
        sMap.set(row.LINE_CODE, row);
        allLineCodes.add(row.LINE_CODE);
      }
      summaryByProcess.set(pt, sMap);

      const bMap = new Map<string, RepeatLocationRow>();
      for (const row of bLocations[i]) {
        const existing = bMap.get(row.LINE_CODE);
        if (!existing || row.LOC_COUNT > existing.LOC_COUNT) {
          bMap.set(row.LINE_CODE, row);
        }
      }
      bLocByProcess.set(pt, bMap);
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
        const bLoc = bLocByProcess.get(pt)?.get(lineCode);
        const grade: RepeatGrade = bLoc ? "B" : "OK";

        processes.push({
          process: pt,
          processLabel: PROCESS_LABELS[pt],
          grade,
          ngCount: summary?.NG_COUNT ?? 0,
          locationCode: bLoc?.LOCATION_CODE ?? null,
          detail: bLoc ? `동일위치:${bLoc.LOC_COUNT}건(${bLoc.LOCATION_CODE})` : null,
          lastInspectDate: summary?.LAST_INSPECT ?? null,
          pendingCount: 0,
        });

        if (grade === "B" && overallGrade === "OK") overallGrade = "B";
      }

      lineCards.push({
        lineCode,
        lineName: lineNameMap.get(lineCode) || lineCode,
        processes,
        overallGrade,
      });
    }

    /* B급 라인 상단 정렬 */
    lineCards.sort((a, b) => {
      const order: Record<RepeatGrade, number> = { A: 0, B: 1, OK: 2 };
      return order[a.overallGrade] - order[b.overallGrade];
    });

    return NextResponse.json({
      lines: lineCards,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Non-consecutive API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
