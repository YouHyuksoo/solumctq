/**
 * @file src/app/api/ctq/open-short/route.ts
 * @description 공용부품 Open/Short API (ICT 공정)
 *
 * 초보자 가이드:
 * 1. **테이블**: IP_PRODUCT_WORK_QC
 * 2. **대상 공정**: ICT (W090, W430)
 * 3. **불량코드**: B2020(OPEN), B2030(SHORT)
 * 4. **판정 기준**: 동일 BAD_REASON_CODE 1일 누적 2건+ → B급 출하중지
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type {
  OpenShortDefectType,
  OpenShortDefectItem,
  OpenShortLineCardData,
  OpenShortGrade,
} from "@/app/monitoring/open-short/types";

export const dynamic = "force-dynamic";

const BAD_REASON_MAP: Record<string, OpenShortDefectType> = {
  B2020: "OPEN",
  B2030: "SHORT",
};

/** 시간 범위: 당일 08:00~ */
function getDayRange() {
  const now = new Date();
  if (now.getHours() < 8) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return {
    dayStart: `${y}/${m}/${d} 08:00:00`,
    dayEnd: `${y}/${m}/${String(now.getDate() + 1).padStart(2, "0")} 08:00:00`,
  };
}

interface DefectRow {
  LINE_CODE: string;
  BAD_REASON_CODE: string;
  CNT: number;
}

interface LineNameRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

async function getLineNames(lineCodes: string[]): Promise<Map<string, string>> {
  if (lineCodes.length === 0) return new Map();
  const placeholders = lineCodes.map((_, i) => `:lc${i}`).join(",");
  const sql = `
    SELECT LINE_CODE, LINE_NAME
    FROM IP_PRODUCT_LINE
    WHERE LINE_CODE IN (${placeholders})
  `;
  const params: Record<string, string> = {};
  lineCodes.forEach((code, i) => { params[`lc${i}`] = code; });
  const rows = await executeQuery<LineNameRow>(sql, params);
  const map = new Map<string, string>();
  rows.forEach((r) => map.set(r.LINE_CODE, r.LINE_NAME));
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "t", "ln");
    const { dayStart } = getDayRange();

    const sql = `
      SELECT t.LINE_CODE,
             t.BAD_REASON_CODE,
             COUNT(*) AS CNT
      FROM IP_PRODUCT_WORK_QC t
      WHERE t.QC_DATE >= TO_DATE(:dayStart, 'YYYY/MM/DD HH24:MI:SS')
        AND t.BAD_REASON_CODE IN ('B2020', 'B2030')
        AND t.LINE_CODE IS NOT NULL
        ${lineFilter.clause}
      GROUP BY t.LINE_CODE, t.BAD_REASON_CODE
    `;

    const rows = await executeQuery<DefectRow>(sql, { dayStart, ...lineFilter.params });

    const allLineCodes = new Set<string>();
    const lineDataMap = new Map<string, DefectRow[]>();

    for (const row of rows) {
      allLineCodes.add(row.LINE_CODE);
      if (!lineDataMap.has(row.LINE_CODE)) {
        lineDataMap.set(row.LINE_CODE, []);
      }
      lineDataMap.get(row.LINE_CODE)!.push(row);
    }

    const sortedLineCodes = [...allLineCodes].sort();
    const lineNameMap = await getLineNames(sortedLineCodes);

    const lineCards: OpenShortLineCardData[] = [];

    for (const lineCode of sortedLineCodes) {
      const rowsForLine = lineDataMap.get(lineCode) ?? [];
      const defects: OpenShortDefectItem[] = [];
      let overallGrade: OpenShortGrade = "OK";

      for (const row of rowsForLine) {
        const defectType = BAD_REASON_MAP[row.BAD_REASON_CODE] ?? "SHORT";
        defects.push({
          defectItem: defectType,
          defectType,
          badReasonCode: row.BAD_REASON_CODE,
          count: row.CNT,
        });
        if (row.CNT >= 2) {
          overallGrade = "B";
        }
      }

      defects.sort((a, b) => b.count - a.count);

      lineCards.push({
        lineCode,
        lineName: lineNameMap.get(lineCode) || lineCode,
        defects,
        overallGrade,
      });
    }

    lineCards.sort((a, b) => {
      const order: Record<OpenShortGrade, number> = { B: 0, OK: 1 };
      return order[a.overallGrade] - order[b.overallGrade];
    });

    return NextResponse.json({
      lines: lineCards,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Open/Short API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
