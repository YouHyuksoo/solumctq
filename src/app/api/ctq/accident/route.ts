/**
 * @file src/app/api/ctq/accident/route.ts
 * @description CTQ 사고성 모니터링 API
 *
 * 초보자 가이드:
 * 1. **대상 공정**: HIPOT, BURNIN, ATE
 * 2. **판정 기준**:
 *    - HIPOT: 1건 이상 NG → A급 (사고성 높음)
 *    - BURNIN/ATE: 2건+ → A급, 1건 → B급
 * 3. **매일 08:00 ~ 다음날 08:00** 하루치만 대상
 * 4. **QC_CONFIRM_YN='Y' 제외** (이미 확인된 건 제외)
 */

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";
import type {
  AccidentProcessType,
  AccidentProcessStatus,
  AccidentLineCardData,
  AccidentGrade,
} from "@/app/monitoring/accident/types";

export const dynamic = "force-dynamic";

interface ProcessConfig {
  table: string;
  pidCol: string;
  dateCol: string;
  resultCol: string;
  dateType: "varchar";
  aThreshold: number;
  bThreshold: number;
}

const PROCESS_CONFIG: Record<AccidentProcessType, ProcessConfig> = {
  HIPOT: {
    table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",
    pidCol: "PID",
    dateCol: "INSPECT_DATE",
    resultCol: "INSPECT_RESULT",
    dateType: "varchar",
    aThreshold: 1,
    bThreshold: 0,
  },
  BURNIN: {
    table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",
    pidCol: "PID",
    dateCol: "INSPECT_DATE",
    resultCol: "INSPECT_RESULT",
    dateType: "varchar",
    aThreshold: 2,
    bThreshold: 1,
  },
  ATE: {
    table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",
    pidCol: "PID",
    dateCol: "INSPECT_DATE",
    resultCol: "INSPECT_RESULT",
    dateType: "varchar",
    aThreshold: 2,
    bThreshold: 1,
  },
};

const PROCESS_LABELS: Record<AccidentProcessType, string> = {
  HIPOT: "HI-POT",
  BURNIN: "BURN-IN",
  ATE: "ATE",
};

const PROCESS_TYPES: AccidentProcessType[] = ["HIPOT", "BURNIN", "ATE"];

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
  LAST_INSPECT: string;
}

interface LineNameRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

/** LINE별 NG 건수 집계 */
async function getLineSummary(
  config: ProcessConfig,
  timeRange: { startStr: string; endStr: string }
): Promise<LineSummaryRow[]> {
  const col = `t.${config.dateCol}`;
  const condition = `${col} >= :tsStart AND ${col} < :tsEnd`;

  const sql = `
    SELECT t.LINE_CODE,
           COUNT(*) AS NG_COUNT,
           MAX(t.${config.dateCol}) AS LAST_INSPECT
    FROM ${config.table} t
    WHERE ${condition}
      AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
      AND (t.QC_CONFIRM_YN IS NULL OR t.QC_CONFIRM_YN <> 'Y')
      AND t.LINE_CODE IS NOT NULL
    GROUP BY t.LINE_CODE
  `;
  return executeQuery<LineSummaryRow>(sql, {
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

/** NG 건수 → 등급 판정 */
function determineGrade(ngCount: number, config: ProcessConfig): AccidentGrade {
  if (ngCount >= config.aThreshold) return "A";
  if (config.bThreshold > 0 && ngCount >= config.bThreshold) return "B";
  return "OK";
}

export async function GET() {
  try {
    const timeRange = getTimeRange();

    /* 1. 3공정 병렬 쿼리 */
    const summaries = await Promise.all(
      PROCESS_TYPES.map((pt) => getLineSummary(PROCESS_CONFIG[pt], timeRange))
    );

    /* 2. Map 변환 */
    const summaryByProcess = new Map<AccidentProcessType, Map<string, LineSummaryRow>>();
    const allLineCodes = new Set<string>();

    PROCESS_TYPES.forEach((pt, i) => {
      const sMap = new Map<string, LineSummaryRow>();
      for (const row of summaries[i]) {
        sMap.set(row.LINE_CODE, row);
        allLineCodes.add(row.LINE_CODE);
      }
      summaryByProcess.set(pt, sMap);
    });

    /* 3. 라인이름 조회 */
    const sortedLineCodes = [...allLineCodes].sort();
    const lineNameMap = await getLineNames(sortedLineCodes);

    /* 4. 라인별 카드 데이터 생성 */
    const lineCards: AccidentLineCardData[] = [];

    for (const lineCode of sortedLineCodes) {
      const processes: AccidentProcessStatus[] = [];
      let overallGrade: AccidentGrade = "OK";

      for (const pt of PROCESS_TYPES) {
        const summary = summaryByProcess.get(pt)?.get(lineCode);
        const ngCount = summary?.NG_COUNT ?? 0;
        const grade = determineGrade(ngCount, PROCESS_CONFIG[pt]);

        let detail: string | null = null;
        if (grade === "A") {
          detail = `NG ${ngCount}건 (A급)`;
        } else if (grade === "B") {
          detail = `NG ${ngCount}건 (B급)`;
        }

        processes.push({
          process: pt,
          processLabel: PROCESS_LABELS[pt],
          grade,
          ngCount,
          detail,
          lastInspectDate: summary?.LAST_INSPECT ?? null,
        });

        if (grade === "A" && overallGrade !== "A") overallGrade = "A";
        if (grade === "B" && overallGrade === "OK") overallGrade = "B";
      }

      lineCards.push({
        lineCode,
        lineName: lineNameMap.get(lineCode) || lineCode,
        processes,
        overallGrade,
      });
    }

    /* 등급순 정렬: A → B → OK */
    lineCards.sort((a, b) => {
      const order: Record<AccidentGrade, number> = { A: 0, B: 1, OK: 2 };
      return order[a.overallGrade] - order[b.overallGrade];
    });

    return NextResponse.json({
      lines: lineCards,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Accident API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
