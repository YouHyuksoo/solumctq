/**
 * @file src/app/api/ctq/quality-dashboard/route.ts
 * @description 품질 분석 대시보드 API — IP_PRODUCT_WORK_QC 다차원 집계
 *
 * 초보자 가이드:
 * 1. 공정별/불량코드별/라인별/모델별/시간대별 불량 건수 집계
 * 2. 수리완료율 산출 (REPAIR_RESULT_CODE 기준)
 * 3. 기간: 당일 08:00 ~ 익일 08:00
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause, getVietnamTimeRange } from "@/lib/line-filter";

export const dynamic = "force-dynamic";

interface CountRow { NAME: string; CNT: number; }
interface RepairRow { TOTAL_CNT: number; REPAIRED_CNT: number; }
interface HourRow { HR: string; CNT: number; }

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const tr = getVietnamTimeRange();
    const baseWhere = `
      t.QC_DATE >= TO_DATE(:tsStart, 'YYYY/MM/DD HH24:MI:SS')
      AND t.QC_DATE < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')
      AND (t.SERIAL_NO LIKE 'VN07%' OR t.SERIAL_NO LIKE 'VNL1%' OR t.SERIAL_NO LIKE 'VNA2%')
      AND t.LINE_CODE IS NOT NULL AND t.LINE_CODE <> '*'
      ${lineFilter.clause}
    `;
    const baseParams = { tsStart: tr.startStr, tsEnd: tr.endStr, ...lineFilter.params };

    const [processRows, badCodeRows, lineRows, modelRows, hourRows, repairRows] = await Promise.all([
      executeQuery<CountRow>(`
        SELECT NVL(F_GET_WORKSTAGE_NAME(t.WORKSTAGE_CODE), t.WORKSTAGE_CODE) AS NAME, COUNT(*) AS CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere}
        GROUP BY t.WORKSTAGE_CODE, F_GET_WORKSTAGE_NAME(t.WORKSTAGE_CODE)
        ORDER BY CNT DESC
      `, baseParams),
      executeQuery<CountRow>(`
        SELECT t.BAD_REASON_CODE || ' ' || NVL(F_GET_CODE_MASTER('WQC BAD REASON CODE', t.BAD_REASON_CODE, 'C', 1), '') AS NAME, COUNT(*) AS CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere} AND t.BAD_REASON_CODE IS NOT NULL
        GROUP BY t.BAD_REASON_CODE, F_GET_CODE_MASTER('WQC BAD REASON CODE', t.BAD_REASON_CODE, 'C', 1)
        ORDER BY CNT DESC FETCH FIRST 10 ROWS ONLY
      `, baseParams),
      executeQuery<CountRow>(`
        SELECT F_GET_LINE_NAME(t.LINE_CODE, 1) AS NAME, COUNT(*) AS CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere}
        GROUP BY t.LINE_CODE, F_GET_LINE_NAME(t.LINE_CODE, 1)
        ORDER BY CNT DESC
      `, baseParams),
      executeQuery<CountRow>(`
        SELECT NVL(t.MODEL_NAME, '-') AS NAME, COUNT(*) AS CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere}
        GROUP BY t.MODEL_NAME ORDER BY CNT DESC FETCH FIRST 10 ROWS ONLY
      `, baseParams),
      executeQuery<HourRow>(`
        SELECT TO_CHAR(t.QC_DATE, 'HH24') AS HR, COUNT(*) AS CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere}
        GROUP BY TO_CHAR(t.QC_DATE, 'HH24') ORDER BY HR
      `, baseParams),
      executeQuery<RepairRow>(`
        SELECT COUNT(*) AS TOTAL_CNT,
               SUM(CASE WHEN t.REPAIR_RESULT_CODE IS NOT NULL AND t.REPAIR_RESULT_CODE <> '-' THEN 1 ELSE 0 END) AS REPAIRED_CNT
        FROM IP_PRODUCT_WORK_QC t WHERE ${baseWhere}
      `, baseParams),
    ]);

    const toChart = (rows: CountRow[]) => rows.map(r => ({ name: r.NAME || "-", count: r.CNT }));
    const total = repairRows[0]?.TOTAL_CNT ?? 0;
    const repaired = repairRows[0]?.REPAIRED_CNT ?? 0;
    const processData = toChart(processRows);
    const badCodeData = toChart(badCodeRows);

    return NextResponse.json({
      process: processData,
      badCode: badCodeData,
      line: toChart(lineRows),
      model: toChart(modelRows),
      hourly: Array.from({ length: 24 }, (_, i) => {
        const h = String((i + 8) % 24).padStart(2, "0");
        const found = hourRows.find(r => r.HR === h);
        return { name: `${h}:00`, count: found?.CNT ?? 0 };
      }),
      repair: { total, repaired, pending: total - repaired },
      summary: {
        totalDefects: total,
        repairRate: total > 0 ? Math.round((repaired / total) * 100) : 0,
        topProcess: processData[0]?.name ?? "-",
        topBadCode: badCodeData[0]?.name?.split(" ")[0] ?? "-",
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Quality Dashboard API error:", error);
    return NextResponse.json({ error: "데이터 조회 실패", detail: String(error) }, { status: 500 });
  }
}
