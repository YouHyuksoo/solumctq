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
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",     dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", extraWhere: "AND t.LAST_FLAG = 'Y'" },
};

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

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

/**
 * 공정별 NG + 전체 건수 동시 집계 (CASE문 한 쿼리)
 * - WHERE: 날짜 범위 + LINE_CODE → IDX(INSPECT_DATE, LINE_CODE) 레인지 스캔
 * - CASE: NG 여부를 SELECT에서 분기하여 전체/NG를 한 번의 스캔으로 집계
 */
async function queryProcess(
  config: ProcessConfig,
  ranges: ReturnType<typeof getWeekRanges>,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<WeeklyRow[]> {
  const col = `t.${config.dateCol}`;
  const dt = config.dateType;
  const isNg = `CASE WHEN t.${config.resultCol} NOT IN ('PASS','GOOD','OK','Y') THEN 1 ELSE 0 END`;

  const sql = `
    SELECT b.ITEM_CODE,
           SUM(CASE WHEN ${col} >= ${dt === "varchar" ? ":wbStart" : "TO_DATE(:wbStart, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${col} <  ${dt === "varchar" ? ":wbEnd"   : "TO_DATE(:wbEnd, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${isNg} = 1 THEN 1 ELSE 0 END) AS WB_NG,
           SUM(CASE WHEN ${col} >= ${dt === "varchar" ? ":wbStart" : "TO_DATE(:wbStart, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${col} <  ${dt === "varchar" ? ":wbEnd"   : "TO_DATE(:wbEnd, 'YYYY/MM/DD HH24:MI:SS')"}
                    THEN 1 ELSE 0 END) AS WB_TOTAL,
           SUM(CASE WHEN ${col} >= ${dt === "varchar" ? ":lwStart" : "TO_DATE(:lwStart, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${col} <  ${dt === "varchar" ? ":lwEnd"   : "TO_DATE(:lwEnd, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${isNg} = 1 THEN 1 ELSE 0 END) AS LW_NG,
           SUM(CASE WHEN ${col} >= ${dt === "varchar" ? ":lwStart" : "TO_DATE(:lwStart, 'YYYY/MM/DD HH24:MI:SS')"}
                     AND ${col} <  ${dt === "varchar" ? ":lwEnd"   : "TO_DATE(:lwEnd, 'YYYY/MM/DD HH24:MI:SS')"}
                    THEN 1 ELSE 0 END) AS LW_TOTAL,
           0 AS TW_NG,
           0 AS TW_TOTAL
    FROM ${config.table} t
    JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.${config.pidCol}
    WHERE ${buildWhereDate(col, ":wbStart", ":lwEnd", dt)}
      AND (t.${config.pidCol} LIKE 'VN07%' OR t.${config.pidCol} LIKE 'VNL1%' OR t.${config.pidCol} LIKE 'VNA2%')
      AND t.LINE_CODE IS NOT NULL
      AND b.ITEM_CODE IS NOT NULL AND b.ITEM_CODE <> '*'
      ${config.extraWhere ?? ""}
      ${lineFilter.clause}
    GROUP BY b.ITEM_CODE
  `;

  return executeQuery<WeeklyRow>(sql, {
    wbStart: ranges.weekBefore.start,
    wbEnd: ranges.weekBefore.end,
    lwStart: ranges.lastWeek.start,
    lwEnd: ranges.lastWeek.end,
    ...lineFilter.params,
  });
}

/* ── GET 핸들러 ── */

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const periodParam = request.nextUrl.searchParams.get("period");
    const period: PeriodType = periodParam === "monthly" ? "monthly" : "weekly";
    const ranges = period === "monthly" ? getMonthRanges() : getWeekRanges();

    /* 7개 공정 병렬 조회 (CASE문으로 NG+전체 한 쿼리) */
    const results = await Promise.all(
      PROCESS_KEYS.map((key) => queryProcess(PROCESS_CONFIG[key], ranges, lineFilter))
    );

    /* ITEM_CODE별 merge — PPM 계산 */
    const modelMap = new Map<string, IndicatorModelData>();

    /** NG/TOTAL → PPM 변환 (TOTAL=0이면 0) */
    const toPpm = (ng: number, total: number): number =>
      total > 0 ? Math.round((ng / total) * 1_000_000) : 0;

    PROCESS_KEYS.forEach((key, i) => {
      for (const row of results[i]) {
        if (!modelMap.has(row.ITEM_CODE)) {
          modelMap.set(row.ITEM_CODE, { itemCode: row.ITEM_CODE, processes: {} });
        }
        const model = modelMap.get(row.ITEM_CODE)!;
        model.processes[key] = {
          weekBefore: toPpm(row.WB_NG, row.WB_TOTAL),
          lastWeek: toPpm(row.LW_NG, row.LW_TOTAL),
          thisWeek: toPpm(row.TW_NG, row.TW_TOTAL),
          weekBeforeTotal: row.WB_TOTAL,
          lastWeekTotal: row.LW_TOTAL,
          thisWeekTotal: row.TW_TOTAL,
        };
      }
    });

    /* ── 모델 필터링 ── */
    /** 소량 모수 기준 (전전기/전기 검사 수량이 이 값 미만이면 제외) */
    const MIN_VOLUME = 200;

    const filtered = [...modelMap.values()].filter((model) => {
      const procs = Object.values(model.processes);

      /* 전전기/전기 PPM 합계 */
      const wbPpmSum = procs.reduce((s, p) => s + (p?.weekBefore ?? 0), 0);
      const lwPpmSum = procs.reduce((s, p) => s + (p?.lastWeek ?? 0), 0);

      /* 전전기/전기 검사 총량 */
      const wbTotal = procs.reduce((s, p) => s + (p?.weekBeforeTotal ?? 0), 0);
      const lwTotal = procs.reduce((s, p) => s + (p?.lastWeekTotal ?? 0), 0);

      /* 1. 전전기 & 전기 PPM 모두 0 → 제외 (불량 없는 모델) */
      if (wbPpmSum === 0 && lwPpmSum === 0) return false;

      /* 2. 전전기 or 전기 검사 수량 MIN_VOLUME 미만 → 제외 (소량 모수) */
      if (wbTotal < MIN_VOLUME || lwTotal < MIN_VOLUME) return false;

      return true;
    });

    /* 총 불량 건수 내림차순 정렬 */
    const models = filtered.sort((a, b) => {
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
