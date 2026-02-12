/**
 * @file src/app/api/ctq/material/route.ts
 * @description CTQ 원자재 동일부품 API
 *
 * 초보자 가이드:
 * 1. **테이블**: IP_PRODUCT_WORK_QC
 * 2. **기준**: 동일 부품(DEFECT_ITEM_CODE)
 * 3. **판정**:
 *    - A급: 동일 부품 일 3건+ NG
 *    - C급: 동일 부품 90일 누적 3건+ NG → 불량개선
 * 4. **성능**: 서버 캐싱 60초 + 단일 테이블 쿼리
 */

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";
import type {
  MaterialDefectItem,
  MaterialLineCardData,
  MaterialGrade,
} from "@/app/monitoring/material/types";

export const dynamic = "force-dynamic";

/* ──────────────── 캐시 ──────────────── */
interface CachedResult {
  lines: MaterialLineCardData[];
  lastUpdated: string;
}

let cache: CachedResult | null = null;
let isFetching = false;
const CACHE_TTL_MS = 60_000;

/** 시간 범위: 당일 08:00~, 90일 시작 */
function getTimeRanges() {
  const now = new Date();
  if (now.getHours() < 8) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const fmt = (dt: Date) => {
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}/${mm}/${dd} 08:00:00`;
  };

  return {
    dayStart: fmt(new Date(y, m, d)),
    dayEnd: fmt(new Date(y, m, d + 1)),
    start90: fmt(new Date(y, m, d - 90)),
  };
}

interface DefectRow {
  LINE_CODE: string;
  DEFECT_ITEM: string;
  NG_DAILY: number;
  NG_90D: number;
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

async function fetchFromDB(): Promise<CachedResult> {
  const times = getTimeRanges();

  const sql = `
    SELECT t.LINE_CODE,
           t.DEFECT_ITEM_CODE AS DEFECT_ITEM,
           SUM(CASE WHEN t.QC_DATE >= TO_DATE(:dayStart, 'YYYY/MM/DD HH24:MI:SS') THEN 1 ELSE 0 END) AS NG_DAILY,
           COUNT(*) AS NG_90D
    FROM IP_PRODUCT_WORK_QC t
    WHERE t.QC_DATE >= TO_DATE(:ts90, 'YYYY/MM/DD HH24:MI:SS')
      AND t.QC_DATE < TO_DATE(:tsEnd, 'YYYY/MM/DD HH24:MI:SS')
      AND t.LINE_CODE IS NOT NULL
      AND t.LINE_CODE <> '*'
      AND t.DEFECT_ITEM_CODE IS NOT NULL
    GROUP BY t.LINE_CODE, t.DEFECT_ITEM_CODE
  `;

  const rows = await executeQuery<DefectRow>(sql, {
    ts90: times.start90,
    tsEnd: times.dayEnd,
    dayStart: times.dayStart,
  });

  /* 라인별 그룹핑 */
  const lineDataMap = new Map<string, DefectRow[]>();
  const allLineCodes = new Set<string>();

  for (const row of rows) {
    if (!row.DEFECT_ITEM) continue;
    allLineCodes.add(row.LINE_CODE);
    if (!lineDataMap.has(row.LINE_CODE)) {
      lineDataMap.set(row.LINE_CODE, []);
    }
    lineDataMap.get(row.LINE_CODE)!.push(row);
  }

  const sortedLineCodes = [...allLineCodes].sort();
  const lineNameMap = await getLineNames(sortedLineCodes);

  const lineCards: MaterialLineCardData[] = [];

  for (const lineCode of sortedLineCodes) {
    const rowsForLine = lineDataMap.get(lineCode) ?? [];
    const defects: MaterialDefectItem[] = [];
    let totalDailyNg = 0;
    let totalCumulativeNg = 0;
    let hasAGrade = false;
    let hasCGrade = false;

    for (const row of rowsForLine) {
      defects.push({
        defectItem: row.DEFECT_ITEM,
        dailyCount: row.NG_DAILY,
        cumulativeCount: row.NG_90D,
      });
      totalDailyNg += row.NG_DAILY;
      totalCumulativeNg += row.NG_90D;

      if (row.NG_DAILY >= 3) hasAGrade = true;
      if (row.NG_90D >= 3) hasCGrade = true;
    }

    defects.sort((a, b) => b.cumulativeCount - a.cumulativeCount);

    let overallGrade: MaterialGrade = "OK";
    if (hasAGrade) {
      overallGrade = "A";
    } else if (hasCGrade) {
      overallGrade = "C";
    }

    lineCards.push({
      lineCode,
      lineName: lineNameMap.get(lineCode) || lineCode,
      defects,
      totalDailyNg,
      totalCumulativeNg,
      overallGrade,
    });
  }

  lineCards.sort((a, b) => {
    const order: Record<MaterialGrade, number> = { A: 0, C: 1, OK: 2 };
    return order[a.overallGrade] - order[b.overallGrade];
  });

  return { lines: lineCards, lastUpdated: new Date().toISOString() };
}

function refreshCacheInBackground() {
  if (isFetching) return;
  isFetching = true;
  fetchFromDB()
    .then((result) => { cache = result; })
    .catch((err) => { console.error("Material cache refresh error:", err); })
    .finally(() => { isFetching = false; });
}

export async function GET() {
  try {
    if (cache) {
      const age = Date.now() - new Date(cache.lastUpdated).getTime();
      if (age > CACHE_TTL_MS) {
        refreshCacheInBackground();
      }
      return NextResponse.json(cache);
    }

    const result = await fetchFromDB();
    cache = result;
    return NextResponse.json(result);
  } catch (error) {
    console.error("Material API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
