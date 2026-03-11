/**
 * @file src/app/api/ctq/indicator/route.ts
 * @description CTQ 지표 API — 모델(ITEM_CODE)별 × 공정별 주간 불량 건수 비교
 *
 * 초보자 가이드:
 * 1. 7개 RAW 테이블에서 NG 건수를 병렬 조회
 * 2. RAW.PID → IP_PRODUCT_2D_BARCODE.SERIAL_NO JOIN으로 ITEM_CODE 취득
 * 3. 전전주/전주/금주 3주치 CASE WHEN으로 분류 집계
 * 4. 월요일을 주의 시작으로 계산
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type { IndicatorProcessKey, IndicatorModelData } from "@/app/monitoring/indicator/types";

export const dynamic = "force-dynamic";

/* ── 공정 테이블 매핑 ── */

interface ProcessConfig {
  table: string;
  dateCol: string;
  pidCol: string;
  resultCol: string;
  dateType: "varchar" | "date";
}

const PROCESS_CONFIG: Record<IndicatorProcessKey, ProcessConfig> = {
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",     dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  IMAGE:  { table: "IQ_MACHINE_INSPECT_DATA_PBA_FT",    dateCol: "STARTTIME",    pidCol: "BARCODE", resultCol: "RESULT",         dateType: "date" },
  SET:    { table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET",  dateCol: "INSPECT_TIME", pidCol: "BARCODE", resultCol: "INSPECT_RESULT", dateType: "date" },
};

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE", "IMAGE", "SET"];

/* ── 주간 범위 계산 (월요일 시작) ── */

function formatOracleDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${dd} 00:00:00`;
}

function formatDisplayDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${m}/${dd}`;
}

function getWeekRanges() {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ..., 6=토
  const diffToMonday = day === 0 ? 6 : day - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const weekBeforeMonday = new Date(thisMonday);
  weekBeforeMonday.setDate(thisMonday.getDate() - 14);

  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  // 금주 종료 = 현재 시각 (아직 안 끝난 주)
  const thisWeekEnd = new Date(now);
  thisWeekEnd.setHours(23, 59, 59, 999);

  const thisWeekDays = diffToMonday + 1; // 월=1, 화=2, ..., 일=7

  return {
    weekBefore: {
      start: formatOracleDate(weekBeforeMonday),
      end: formatOracleDate(lastMonday),
      displayStart: formatDisplayDate(weekBeforeMonday),
      displayEnd: formatDisplayDate(new Date(lastMonday.getTime() - 86400000)),
    },
    lastWeek: {
      start: formatOracleDate(lastMonday),
      end: formatOracleDate(thisMonday),
      displayStart: formatDisplayDate(lastMonday),
      displayEnd: formatDisplayDate(new Date(thisMonday.getTime() - 86400000)),
    },
    thisWeek: {
      start: formatOracleDate(thisMonday),
      end: formatOracleDate(nextMonday),
      displayStart: formatDisplayDate(thisMonday),
      displayEnd: formatDisplayDate(now),
    },
    thisWeekDays,
  };
}

/* ── 공정별 NG 집계 쿼리 ── */

interface WeeklyRow {
  ITEM_CODE: string;
  WEEK_BEFORE: number;
  LAST_WEEK: number;
  THIS_WEEK: number;
}

/** dateType에 따라 CASE WHEN 비교식 생성 */
function buildCaseWhen(col: string, startParam: string, endParam: string, dateType: "varchar" | "date"): string {
  if (dateType === "varchar") {
    return `CASE WHEN ${col} >= ${startParam} AND ${col} < ${endParam} THEN 1 ELSE 0 END`;
  }
  return `CASE WHEN ${col} >= TO_DATE(${startParam}, 'YYYY/MM/DD HH24:MI:SS') AND ${col} < TO_DATE(${endParam}, 'YYYY/MM/DD HH24:MI:SS') THEN 1 ELSE 0 END`;
}

function buildWhereDate(col: string, startParam: string, endParam: string, dateType: "varchar" | "date"): string {
  if (dateType === "varchar") {
    return `${col} >= ${startParam} AND ${col} < ${endParam}`;
  }
  return `${col} >= TO_DATE(${startParam}, 'YYYY/MM/DD HH24:MI:SS') AND ${col} < TO_DATE(${endParam}, 'YYYY/MM/DD HH24:MI:SS')`;
}

async function queryProcess(
  config: ProcessConfig,
  ranges: ReturnType<typeof getWeekRanges>,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<WeeklyRow[]> {
  const col = `t.${config.dateCol}`;
  const dt = config.dateType;

  const sql = `
    SELECT b.ITEM_CODE,
           SUM(${buildCaseWhen(col, ":wbStart", ":wbEnd", dt)}) AS WEEK_BEFORE,
           SUM(${buildCaseWhen(col, ":lwStart", ":lwEnd", dt)}) AS LAST_WEEK,
           SUM(${buildCaseWhen(col, ":twStart", ":twEnd", dt)}) AS THIS_WEEK
    FROM ${config.table} t
    JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.${config.pidCol}
    WHERE ${buildWhereDate(col, ":wbStart", ":twEnd", dt)}
      AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK')
      AND t.LINE_CODE IS NOT NULL
      AND b.ITEM_CODE IS NOT NULL
      ${lineFilter.clause}
    GROUP BY b.ITEM_CODE
    HAVING SUM(1) > 0
  `;

  return executeQuery<WeeklyRow>(sql, {
    wbStart: ranges.weekBefore.start,
    wbEnd: ranges.weekBefore.end,
    lwStart: ranges.lastWeek.start,
    lwEnd: ranges.lastWeek.end,
    twStart: ranges.thisWeek.start,
    twEnd: ranges.thisWeek.end,
    ...lineFilter.params,
  });
}

/* ── GET 핸들러 ── */

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const ranges = getWeekRanges();

    /* 7개 공정 병렬 조회 */
    const results = await Promise.all(
      PROCESS_KEYS.map((key) => queryProcess(PROCESS_CONFIG[key], ranges, lineFilter))
    );

    /* ITEM_CODE별 merge */
    const modelMap = new Map<string, IndicatorModelData>();

    PROCESS_KEYS.forEach((key, i) => {
      for (const row of results[i]) {
        if (!modelMap.has(row.ITEM_CODE)) {
          modelMap.set(row.ITEM_CODE, { itemCode: row.ITEM_CODE, processes: {} });
        }
        const model = modelMap.get(row.ITEM_CODE)!;
        model.processes[key] = {
          weekBefore: row.WEEK_BEFORE,
          lastWeek: row.LAST_WEEK,
          thisWeek: row.THIS_WEEK,
        };
      }
    });

    /* 총 불량 건수 내림차순 정렬 */
    const models = [...modelMap.values()].sort((a, b) => {
      const sumA = Object.values(a.processes).reduce(
        (s, p) => s + (p?.weekBefore ?? 0) + (p?.lastWeek ?? 0) + (p?.thisWeek ?? 0), 0
      );
      const sumB = Object.values(b.processes).reduce(
        (s, p) => s + (p?.weekBefore ?? 0) + (p?.lastWeek ?? 0) + (p?.thisWeek ?? 0), 0
      );
      return sumB - sumA;
    });

    return NextResponse.json({
      models,
      weekRanges: {
        weekBefore: { start: ranges.weekBefore.displayStart, end: ranges.weekBefore.displayEnd },
        lastWeek: { start: ranges.lastWeek.displayStart, end: ranges.lastWeek.displayEnd },
        thisWeek: { start: ranges.thisWeek.displayStart, end: ranges.thisWeek.displayEnd },
      },
      thisWeekDays: ranges.thisWeekDays,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Indicator API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
