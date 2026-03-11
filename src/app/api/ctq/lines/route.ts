/**
 * @file src/app/api/ctq/lines/route.ts
 * @description 라인 목록 API - IP_PRODUCT_LINE에서 모니터링 대상 라인 조회
 *
 * 초보자 가이드:
 * 1. **용도**: 라인 선택 모달에서 사용할 라인 목록 제공
 * 2. **그룹핑**: LINE_PRODUCT_DIVISION별 (SMPS, PBA, AVI, HYBRID, 3IN1 등)
 * 3. **제외**: 특수코드(*, 00), AI 라인은 모니터링 대상 아님
 */

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";

export const dynamic = "force-dynamic";

interface LineRow {
  LINE_CODE: string;
  LINE_NAME: string;
  LINE_PRODUCT_DIVISION: string;
}

export interface LineGroup {
  division: string;
  lines: { lineCode: string; lineName: string }[];
}

export async function GET() {
  try {
    const sql = `
      SELECT LINE_CODE, LINE_NAME, LINE_PRODUCT_DIVISION
      FROM IP_PRODUCT_LINE
      WHERE LINE_CODE NOT IN ('*', '00')
        AND LINE_PRODUCT_DIVISION NOT IN ('AI', 'COMMON')
      ORDER BY LINE_PRODUCT_DIVISION, LINE_CODE
    `;
    const rows = await executeQuery<LineRow>(sql);

    const groupMap = new Map<string, { lineCode: string; lineName: string }[]>();
    for (const row of rows) {
      const div = row.LINE_PRODUCT_DIVISION;
      if (!groupMap.has(div)) groupMap.set(div, []);
      groupMap.get(div)!.push({
        lineCode: row.LINE_CODE,
        lineName: row.LINE_NAME,
      });
    }

    const groups: LineGroup[] = [];
    for (const [division, lines] of groupMap) {
      groups.push({ division, lines });
    }

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Lines API error:", error);
    return NextResponse.json(
      { error: "라인 목록 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
