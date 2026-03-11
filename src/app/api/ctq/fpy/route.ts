/**
 * @file src/app/api/ctq/fpy/route.ts
 * @description 직행율(First Pass Yield) API — 라인별 × 공정별 전일/당일 직행율 조회
 *
 * 초보자 가이드:
 * 1. 7개 RAW 테이블에서 제품(PID/BARCODE)별 최초 검사 결과만 추출
 * 2. 직행율 = 최초검사 PASS 제품수 / 고유 제품수 × 100
 * 3. 당일 기준 90% 미만이면 A급
 * 4. ROW_NUMBER()로 제품별 첫 번째 검사만 필터링 (재검사 제외)
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type { FpyProcessKey, FpyProcessData, FpyProcessDayData, FpyLineData } from "@/app/monitoring/fpy/types";

export const dynamic = "force-dynamic";

interface ProcessConfig {
  table: string;
  dateCol: string;
  pidCol: string;
  resultCol: string;
  dateType: "varchar" | "date";
  passValues: string[];
  extraWhere?: string;
}

const PROCESS_CONFIG: Record<FpyProcessKey, ProcessConfig> = {
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", passValues: ["PASS", "GOOD", "OK", "Y"] },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", passValues: ["PASS", "GOOD", "OK", "Y"] },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", passValues: ["PASS", "GOOD", "OK", "Y"] },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", passValues: ["PASS", "GOOD", "OK", "Y"] },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",     dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", dateType: "varchar", passValues: ["PASS", "GOOD", "OK", "Y"] },
  IMAGE:  { table: "IQ_MACHINE_INSPECT_DATA_PBA_FT",    dateCol: "STARTTIME",    pidCol: "BARCODE", resultCol: "RESULT",         dateType: "date", passValues: ["PASS", "GOOD", "OK", "Y"], extraWhere: "AND t.LAST_FLAG = 'Y'" },
  SET:    { table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET",  dateCol: "INSPECT_TIME", pidCol: "BARCODE", resultCol: "INSPECT_RESULT", dateType: "date", passValues: ["PASS", "GOOD", "OK", "Y"], extraWhere: "AND t.LAST_FLAG = 'Y'" },
};

const PROCESS_KEYS: FpyProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE", "IMAGE", "SET"];

interface FpyRow {
  LINE_CODE: string;
  TOTAL_CNT: number;
  PASS_CNT: number;
}

interface LineNameRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

/** 날짜 범위 WHERE 절 생성 (from 08:00 ~ to 08:00) */
function buildDateRange(col: string, dateType: "varchar" | "date", dayOffset: number): string {
  const startOffset = dayOffset;
  const endOffset = dayOffset + 1;

  if (dateType === "varchar") {
    const start = `TO_CHAR(TRUNC(SYSDATE)${startOffset >= 0 ? "+" : ""}${startOffset}, 'YYYY/MM/DD') || ' 08:00:00'`;
    const end = `TO_CHAR(TRUNC(SYSDATE)${endOffset >= 0 ? "+" : ""}${endOffset}, 'YYYY/MM/DD') || ' 08:00:00'`;
    return `${col} >= ${start} AND ${col} < ${end}`;
  }
  return `${col} >= TRUNC(SYSDATE)${startOffset >= 0 ? "+" : ""}${startOffset} + 8/24 AND ${col} < TRUNC(SYSDATE)${endOffset >= 0 ? "+" : ""}${endOffset} + 8/24`;
}

async function queryProcess(
  key: FpyProcessKey,
  config: ProcessConfig,
  lineFilter: { clause: string; params: Record<string, string> },
  dayOffset: number
): Promise<{ key: FpyProcessKey; rows: FpyRow[] }> {
  const col = `t.${config.dateCol}`;
  const passIn = config.passValues.map(v => `'${v}'`).join(",");

  /*
   * 핵심: ROW_NUMBER() OVER (PARTITION BY PID ORDER BY dateCol)
   * → 제품별 최초 검사만 추출 (RN=1)
   * → 직행율 = 최초검사 PASS 제품수 / 고유 제품수
   */
  const sql = `
    SELECT sub.LINE_CODE,
           COUNT(*) AS TOTAL_CNT,
           SUM(CASE WHEN sub.${config.resultCol} IN (${passIn}) THEN 1 ELSE 0 END) AS PASS_CNT
    FROM (
      SELECT t.LINE_CODE,
             t.${config.resultCol},
             ROW_NUMBER() OVER (PARTITION BY t.${config.pidCol} ORDER BY t.${config.dateCol}) AS RN
      FROM ${config.table} t
      WHERE ${buildDateRange(col, config.dateType, dayOffset)}
        ${config.extraWhere ?? ""}
        AND t.LINE_CODE IS NOT NULL
        ${lineFilter.clause}
    ) sub
    WHERE sub.RN = 1
    GROUP BY sub.LINE_CODE
    HAVING COUNT(*) > 0
  `;

  const rows = await executeQuery<FpyRow>(sql, lineFilter.params);

  return { key, rows };
}

/** LINE_CODE → LINE_NAME 매핑 조회 */
async function fetchLineNames(lineCodes: string[]): Promise<Map<string, string>> {
  if (lineCodes.length === 0) return new Map();
  const placeholders = lineCodes.map((_, i) => `:lc${i}`).join(",");
  const sql = `SELECT LINE_CODE, LINE_NAME FROM IP_PRODUCT_LINE WHERE LINE_CODE IN (${placeholders})`;
  const params: Record<string, string> = {};
  lineCodes.forEach((code, i) => { params[`lc${i}`] = code; });
  const rows = await executeQuery<LineNameRow>(sql, params);
  const map = new Map<string, string>();
  rows.forEach((r) => map.set(r.LINE_CODE, r.LINE_NAME));
  return map;
}

function toProcessData(row: FpyRow): FpyProcessData {
  const yieldRate = row.TOTAL_CNT > 0 ? Math.round((row.PASS_CNT / row.TOTAL_CNT) * 10000) / 100 : 100;
  return { total: row.TOTAL_CNT, pass: row.PASS_CNT, ng: row.TOTAL_CNT - row.PASS_CNT, yield: yieldRate };
}

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");

    /* 전일(-1)과 당일(0) 병렬 조회 */
    const [yesterdayResults, todayResults] = await Promise.all([
      Promise.all(PROCESS_KEYS.map((key) => queryProcess(key, PROCESS_CONFIG[key], lineFilter, -1))),
      Promise.all(PROCESS_KEYS.map((key) => queryProcess(key, PROCESS_CONFIG[key], lineFilter, 0))),
    ]);

    /* 라인코드 수집 */
    const allLineCodes = new Set<string>();
    for (const results of [yesterdayResults, todayResults]) {
      for (const { rows } of results) {
        for (const row of rows) {
          if (row.LINE_CODE) allLineCodes.add(row.LINE_CODE);
        }
      }
    }
    /* 선택된 라인도 포함 (0건이어도 카드 표시) */
    for (const lc of lines) allLineCodes.add(lc);
    const lineNames = await fetchLineNames([...allLineCodes]);

    /* 라인별 merge */
    const lineMap = new Map<string, FpyLineData>();

    function ensureLine(code: string): FpyLineData {
      if (!lineMap.has(code)) {
        lineMap.set(code, {
          lineCode: code,
          lineName: lineNames.get(code) ?? code,
          overallGrade: "OK",
          processes: {},
        });
      }
      return lineMap.get(code)!;
    }

    /* 전일 데이터 병합 */
    for (const { key, rows } of yesterdayResults) {
      for (const row of rows) {
        if (!row.LINE_CODE) continue;
        const line = ensureLine(row.LINE_CODE);
        if (!line.processes[key]) line.processes[key] = {};
        line.processes[key]!.yesterday = toProcessData(row);
      }
    }

    /* 당일 데이터 병합 + 등급 판정 */
    for (const { key, rows } of todayResults) {
      for (const row of rows) {
        if (!row.LINE_CODE) continue;
        const line = ensureLine(row.LINE_CODE);
        if (!line.processes[key]) line.processes[key] = {};
        const pd = toProcessData(row);
        line.processes[key]!.today = pd;
        if (pd.yield < 90) {
          line.overallGrade = "A";
        }
      }
    }

    /* A급 우선, 그다음 라인명 정렬 */
    const sortedLines = [...lineMap.values()].sort((a, b) => {
      if (a.overallGrade !== b.overallGrade) return a.overallGrade === "A" ? -1 : 1;
      return a.lineName.localeCompare(b.lineName);
    });

    return NextResponse.json({
      lines: sortedLines,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("FPY API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 },
    );
  }
}
