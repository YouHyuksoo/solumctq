/**
 * @file src/app/api/ctq/indicator/route.ts
 * @description CTQ 지표 API — 모델(ITEM_CODE)별 × 공정별 주간/월간 불량 PPM 비교
 *
 * 초보자 가이드:
 * 1. 7개 RAW 테이블에서 NG 건수 및 전체 검사 건수를 병렬 조회 → PPM 변환
 * 2. RAW.PID → IP_PRODUCT_2D_BARCODE JOIN으로 ITEM_CODE(모델) 취득
 * 3. 전전주/전주/금주 또는 전전월/전월/당월 3기간 CASE WHEN 분류 집계
 * 4. period=weekly: 월요일 시작 주간, period=monthly: 매월 1일~말일
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type { IndicatorProcessKey, IndicatorModelData, PeriodType } from "@/app/monitoring/indicator/types";

export const dynamic = "force-dynamic";

/* ── 공정 테이블 매핑 ── */

interface ProcessConfig {
  table: string;
  dateCol: string;
  pidCol: string;
  resultCol: string;
  dateType: "varchar" | "date";
  /** 추가 WHERE 조건 (예: LAST_FLAG = 'Y') */
  extraWhere?: string;
}

const PROCESS_CONFIG: Record<IndicatorProcessKey, ProcessConfig> = {
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",     dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar" },
  IMAGE:  { table: "IQ_MACHINE_INSPECT_DATA_PBA_FT",    dateCol: "STARTTIME",    pidCol: "BARCODE", resultCol: "RESULT",         dateType: "date", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  SET:    { table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET",  dateCol: "INSPECT_TIME", pidCol: "BARCODE", resultCol: "INSPECT_RESULT", dateType: "date", extraWhere: "AND t.LAST_FLAG = 'Y'" },
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

/* ── 월간 범위 계산 (매월 1일~말일) ── */

function getMonthRanges() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  // 당월 1일
  const thisMonthStart = new Date(y, m, 1);
  // 전월 1일
  const lastMonthStart = new Date(y, m - 1, 1);
  // 전전월 1일
  const monthBeforeStart = new Date(y, m - 2, 1);
  // 익월 1일 (당월 종료 경계)
  const nextMonthStart = new Date(y, m + 1, 1);

  // 당월 경과 일수
  const thisMonthDays = now.getDate();

  return {
    weekBefore: {
      start: formatOracleDate(monthBeforeStart),
      end: formatOracleDate(lastMonthStart),
      displayStart: formatDisplayDate(monthBeforeStart),
      displayEnd: formatDisplayDate(new Date(lastMonthStart.getTime() - 86400000)),
    },
    lastWeek: {
      start: formatOracleDate(lastMonthStart),
      end: formatOracleDate(thisMonthStart),
      displayStart: formatDisplayDate(lastMonthStart),
      displayEnd: formatDisplayDate(new Date(thisMonthStart.getTime() - 86400000)),
    },
    thisWeek: {
      start: formatOracleDate(thisMonthStart),
      end: formatOracleDate(nextMonthStart),
      displayStart: formatDisplayDate(thisMonthStart),
      displayEnd: formatDisplayDate(now),
    },
    thisWeekDays: thisMonthDays,
  };
}

/* ── 공정별 NG 집계 쿼리 ── */

interface WeeklyRow {
  ITEM_CODE: string;
  WB_NG: number;
  WB_TOTAL: number;
  LW_NG: number;
  LW_TOTAL: number;
  TW_NG: number;
  TW_TOTAL: number;
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

/** NG 건수만 집계 (기존 쿼리 — NG 필터로 빠름) */
async function queryNgCount(
  config: ProcessConfig,
  ranges: ReturnType<typeof getWeekRanges>,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<WeeklyRow[]> {
  const col = `t.${config.dateCol}`;
  const dt = config.dateType;

  const sql = `
    SELECT b.ITEM_CODE,
           SUM(${buildCaseWhen(col, ":wbStart", ":wbEnd", dt)}) AS WB_NG,
           SUM(${buildCaseWhen(col, ":lwStart", ":lwEnd", dt)}) AS LW_NG,
           SUM(${buildCaseWhen(col, ":twStart", ":twEnd", dt)}) AS TW_NG
    FROM ${config.table} t
    JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.${config.pidCol}
    WHERE ${buildWhereDate(col, ":wbStart", ":twEnd", dt)}
      AND t.${config.resultCol} NOT IN ('PASS', 'GOOD', 'OK', 'Y')
      AND t.LINE_CODE IS NOT NULL
      AND b.ITEM_CODE IS NOT NULL AND b.ITEM_CODE <> '*'
      ${config.extraWhere ?? ""}
      ${lineFilter.clause}
    GROUP BY b.ITEM_CODE
  `;

  const rows = await executeQuery<{ ITEM_CODE: string; WB_NG: number; LW_NG: number; TW_NG: number }>(sql, {
    wbStart: ranges.weekBefore.start,
    wbEnd: ranges.weekBefore.end,
    lwStart: ranges.lastWeek.start,
    lwEnd: ranges.lastWeek.end,
    twStart: ranges.thisWeek.start,
    twEnd: ranges.thisWeek.end,
    ...lineFilter.params,
  });

  return rows.map((r) => ({
    ITEM_CODE: r.ITEM_CODE,
    WB_NG: r.WB_NG, WB_TOTAL: 0,
    LW_NG: r.LW_NG, LW_TOTAL: 0,
    TW_NG: r.TW_NG, TW_TOTAL: 0,
  }));
}

/** 전체 검사 건수 집계 (ITEM_CODE별 기간별, NG 필터 없음) */
async function queryTotalCount(
  config: ProcessConfig,
  ranges: ReturnType<typeof getWeekRanges>,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<Map<string, { wb: number; lw: number; tw: number }>> {
  const col = `t.${config.dateCol}`;
  const dt = config.dateType;

  const sql = `
    SELECT b.ITEM_CODE,
           SUM(${buildCaseWhen(col, ":wbStart", ":wbEnd", dt)}) AS WB_TOTAL,
           SUM(${buildCaseWhen(col, ":lwStart", ":lwEnd", dt)}) AS LW_TOTAL,
           SUM(${buildCaseWhen(col, ":twStart", ":twEnd", dt)}) AS TW_TOTAL
    FROM ${config.table} t
    JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.${config.pidCol}
    WHERE ${buildWhereDate(col, ":wbStart", ":twEnd", dt)}
      AND t.LINE_CODE IS NOT NULL
      AND b.ITEM_CODE IS NOT NULL AND b.ITEM_CODE <> '*'
      ${config.extraWhere ?? ""}
      ${lineFilter.clause}
    GROUP BY b.ITEM_CODE
  `;

  const rows = await executeQuery<{ ITEM_CODE: string; WB_TOTAL: number; LW_TOTAL: number; TW_TOTAL: number }>(sql, {
    wbStart: ranges.weekBefore.start,
    wbEnd: ranges.weekBefore.end,
    lwStart: ranges.lastWeek.start,
    lwEnd: ranges.lastWeek.end,
    twStart: ranges.thisWeek.start,
    twEnd: ranges.thisWeek.end,
    ...lineFilter.params,
  });

  const map = new Map<string, { wb: number; lw: number; tw: number }>();
  for (const r of rows) {
    map.set(r.ITEM_CODE, { wb: r.WB_TOTAL, lw: r.LW_TOTAL, tw: r.TW_TOTAL });
  }
  return map;
}

/* ── GET 핸들러 ── */

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const periodParam = request.nextUrl.searchParams.get("period");
    const period: PeriodType = periodParam === "monthly" ? "monthly" : "weekly";
    const ranges = period === "monthly" ? getMonthRanges() : getWeekRanges();

    /* 7개 공정 × 2(NG+Total) = 14쿼리 병렬 조회 */
    const [ngResults, totalResults] = await Promise.all([
      Promise.all(PROCESS_KEYS.map((key) => queryNgCount(PROCESS_CONFIG[key], ranges, lineFilter))),
      Promise.all(PROCESS_KEYS.map((key) => queryTotalCount(PROCESS_CONFIG[key], ranges, lineFilter))),
    ]);

    /* ITEM_CODE별 merge — PPM 계산 */
    const modelMap = new Map<string, IndicatorModelData>();

    /** NG/TOTAL → PPM 변환 (TOTAL=0이면 0) */
    const toPpm = (ng: number, total: number): number =>
      total > 0 ? Math.round((ng / total) * 1_000_000) : 0;

    PROCESS_KEYS.forEach((key, i) => {
      const totalMap = totalResults[i];
      for (const row of ngResults[i]) {
        if (!modelMap.has(row.ITEM_CODE)) {
          modelMap.set(row.ITEM_CODE, { itemCode: row.ITEM_CODE, processes: {} });
        }
        const model = modelMap.get(row.ITEM_CODE)!;
        const totals = totalMap.get(row.ITEM_CODE) ?? { wb: 0, lw: 0, tw: 0 };
        model.processes[key] = {
          weekBefore: toPpm(row.WB_NG, totals.wb),
          lastWeek: toPpm(row.LW_NG, totals.lw),
          thisWeek: toPpm(row.TW_NG, totals.tw),
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
      period,
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
