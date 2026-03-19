/**
 * @file src/app/api/cqt/monitoring/route.ts
 * @description CQT 모니터링 API - 반복성 + 사고성 감지
 *
 * 초보자 가이드:
 * 1. **반복성**: 동일 LINE_CODE + 동일 LOCATION_CODE에서 NG 연속/누적 감지
 * 2. **사고성**: HIPOT 1건 NG → Line Stop, BURN-IN/ATE 등 건수 기준 감지
 * 3. **공통**: 매일 08:00 기준, QC_CONFIRM_YN='Y' 제외, 10초 갱신
 * 4. **성능**: 공정별 벌크 쿼리 1회 → 메모리에서 LINE_CODE별 그룹핑
 * 5. **주의**: INSPECT_DATE는 인덱스 컬럼이므로 절대 변형하지 않음 (문자열 비교)
 */

import { type NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/oracle";
import { parseLines, buildLineInClause } from "@/lib/line-filter";
import type {
  ProcessType,
  ProcessStatus,
  LineCardData,
  AlertGrade,
  CategoryType,
} from "@/app/monitoring/types";

export const dynamic = "force-dynamic";

const PROCESS_TABLE_MAP: Record<ProcessType, string> = {
  ICT: "IQ_MACHINE_ICT_SERVER_DATA_RAW",
  HIPOT: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",
  FT1: "IQ_MACHINE_FT1_SMPS_DATA_RAW",
  BURNIN: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",
  ATE: "IQ_MACHINE_ATE_SERVER_DATA_RAW",
};

const PROCESS_LABELS: Record<ProcessType, string> = {
  ICT: "ICT",
  HIPOT: "HIPOT",
  FT1: "FT#1",
  BURNIN: "BURN-IN",
  ATE: "ATE",
};

const PROCESS_TYPES: ProcessType[] = ["ICT", "HIPOT", "FT1", "BURNIN", "ATE"];

/** 오늘 08:00 기준 시작 시간 (YYYY/MM/DD HH:MM:SS 포맷 - 인덱스 활용) */
function getTodayStart(): string {
  const now = new Date();
  if (now.getHours() < 8) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}/${m}/${d} 08:00:00`;
}

interface NgRecord {
  PID: string;
  INSPECT_DATE: string;
  LINE_CODE: string;
}

interface LineRow {
  LINE_CODE: string;
  LINE_NAME: string;
}

interface LocationRow {
  SERIAL_NO: string;
  LOCATION_CODE: string;
}

/** 당일 데이터가 있는 SMPS/3IN1 라인만 조회 (INSPECT_DATE 인덱스 활용) */
async function getActiveLines(
  todayStart: string,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<LineRow[]> {
  const lineClause = lineFilter.clause.replace(/AND t\./g, "AND ");

  const sql = lineFilter.clause
    ? `
    SELECT d.LINE_CODE, NVL(l.LINE_NAME, d.LINE_CODE) AS LINE_NAME
    FROM (
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_ICT_SERVER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL ${lineClause}
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_HIPOT_POWER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL ${lineClause}
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_FT1_SMPS_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL ${lineClause}
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_BURNIN_SMPS_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL ${lineClause}
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_ATE_SERVER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL ${lineClause}
    ) d
    LEFT JOIN IP_PRODUCT_LINE l ON d.LINE_CODE = l.LINE_CODE
    ORDER BY d.LINE_CODE
  `
    : `
    SELECT d.LINE_CODE, NVL(l.LINE_NAME, d.LINE_CODE) AS LINE_NAME
    FROM (
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_ICT_SERVER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_HIPOT_POWER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_FT1_SMPS_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_BURNIN_SMPS_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL
      UNION
      SELECT DISTINCT LINE_CODE FROM IQ_MACHINE_ATE_SERVER_DATA_RAW WHERE INSPECT_DATE >= :ts AND LINE_CODE IS NOT NULL
    ) d
    INNER JOIN IP_PRODUCT_LINE l ON d.LINE_CODE = l.LINE_CODE
      AND l.LINE_PRODUCT_DIVISION IN ('SMPS', '3IN1')
    ORDER BY d.LINE_CODE
  `;
  return executeQuery<LineRow>(sql, { ts: todayStart, ...lineFilter.params });
}

/** 공정별 당일 NG 전체 벌크 조회 (인덱스 컬럼 INSPECT_DATE 변형 없음) */
async function getBulkNgRecords(
  tableName: string,
  todayStart: string,
  lineFilter: { clause: string; params: Record<string, string> }
): Promise<NgRecord[]> {
  const sql = `
    SELECT PID, INSPECT_DATE, LINE_CODE
    FROM ${tableName}
    WHERE INSPECT_DATE >= :todayStart
      AND LAST_FLAG = 'Y'
      AND (PID LIKE 'VN07%' OR PID LIKE 'VNL1%' OR PID LIKE 'VNA2%')
      AND INSPECT_RESULT NOT IN ('PASS', 'GOOD', 'OK', 'Y')
      AND (QC_CONFIRM_YN IS NULL OR QC_CONFIRM_YN != 'Y')
      ${lineFilter.clause.replace(/t\./g, "")}
    ORDER BY LINE_CODE, INSPECT_DATE DESC
  `;
  return executeQuery<NgRecord>(sql, { todayStart, ...lineFilter.params });
}

/** REPAIR 테이블에서 Location 벌크 조회 */
async function getBulkLocationInfo(
  pids: string[]
): Promise<Map<string, string>> {
  if (pids.length === 0) return new Map();

  const BATCH_SIZE = 500;
  const map = new Map<string, string>();

  for (let i = 0; i < pids.length; i += BATCH_SIZE) {
    const batch = pids.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map((_, j) => `:p${j}`).join(",");
    const sql = `
      SELECT SERIAL_NO, LOCATION_CODE
      FROM IP_PRODUCT_WORK_QC
      WHERE SERIAL_NO IN (${placeholders})
        AND RECEIPT_DEFICIT = '2'
        AND LOCATION_CODE IS NOT NULL
    `;
    const params: Record<string, string> = {};
    batch.forEach((pid, j) => {
      params[`p${j}`] = pid;
    });

    const rows = await executeQuery<LocationRow>(sql, params);
    rows.forEach((r) => map.set(r.SERIAL_NO, r.LOCATION_CODE));
  }
  return map;
}

/** LINE_CODE별로 NG 레코드 그룹핑 */
function groupByLine(records: NgRecord[]): Map<string, NgRecord[]> {
  const map = new Map<string, NgRecord[]>();
  for (const rec of records) {
    const list = map.get(rec.LINE_CODE) || [];
    list.push(rec);
    map.set(rec.LINE_CODE, list);
  }
  return map;
}

/** 반복성 감지: 수리등록(LOCATION_CODE 있는)건만 판정, 미등록건은 판정대기 */
function detectRepeatability(
  ngRecords: NgRecord[],
  locationMap: Map<string, string>
): {
  grade: AlertGrade;
  locationCode: string | null;
  detail: string | null;
  pendingCount: number;
} {
  if (ngRecords.length === 0) {
    return { grade: "OK", locationCode: null, detail: null, pendingCount: 0 };
  }

  /* 수리등록 여부 분리 */
  let pendingCount = 0;
  const registeredRecords: NgRecord[] = [];

  for (const rec of ngRecords) {
    if (locationMap.has(rec.PID)) {
      registeredRecords.push(rec);
    } else {
      pendingCount++;
    }
  }

  /* 수리등록된 건이 없으면 전부 판정대기 */
  if (registeredRecords.length === 0) {
    return { grade: "OK", locationCode: null, detail: null, pendingCount };
  }

  /* 수리등록된 건만으로 반복성 판정 */
  const locationCounts: Record<string, number> = {};
  let consecutiveLocation: string | null = null;
  let lastLocation: string | null = null;
  let consecutiveCount = 0;

  for (const rec of registeredRecords) {
    const loc = locationMap.get(rec.PID)!;
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;

    if (loc === lastLocation) {
      consecutiveCount++;
      if (consecutiveCount >= 2) {
        consecutiveLocation = loc;
      }
    } else {
      consecutiveCount = 1;
      lastLocation = loc;
    }
  }

  if (consecutiveLocation) {
    return {
      grade: "A",
      locationCode: consecutiveLocation,
      detail: `consecutive(${consecutiveLocation})`,
      pendingCount,
    };
  }

  const repeatedLoc = Object.entries(locationCounts).find(
    ([, count]) => count >= 2
  );
  if (repeatedLoc) {
    return {
      grade: "B",
      locationCode: repeatedLoc[0],
      detail: `sameLoc:${repeatedLoc[1]}(${repeatedLoc[0]})`,
      pendingCount,
    };
  }

  return { grade: "OK", locationCode: null, detail: null, pendingCount };
}

/** 사고성 감지 */
function detectAccident(
  processType: ProcessType,
  ngCount: number
): { grade: AlertGrade; detail: string | null } {
  if (processType === "HIPOT" && ngCount >= 1) {
    return { grade: "A", detail: `NG:${ngCount}` };
  }
  if (processType === "BURNIN" || processType === "ATE") {
    if (ngCount >= 2) return { grade: "A", detail: `NG:${ngCount}` };
    if (ngCount >= 1) return { grade: "B", detail: `NG:${ngCount}` };
  }
  return { grade: "OK", detail: null };
}

function worseGrade(a: AlertGrade, b: AlertGrade): AlertGrade {
  const order: Record<AlertGrade, number> = { A: 0, B: 1, C: 2, OK: 3 };
  return order[a] <= order[b] ? a : b;
}

export async function GET(request: NextRequest) {
  try {
    const todayStart = getTodayStart();
    const lines = parseLines(request);
    const lineFilter = buildLineInClause(lines, "", "ln");

    /* 1. 5개 공정 NG 벌크 조회 + 당일 활성 라인 (병렬) */
    const [lines2, ...bulkNgResults] = await Promise.all([
      getActiveLines(todayStart, lineFilter),
      ...PROCESS_TYPES.map((pt) =>
        getBulkNgRecords(PROCESS_TABLE_MAP[pt], todayStart, lineFilter)
      ),
    ]);

    /* 2. 공정별 LINE_CODE 그룹핑 */
    const ngByProcess = new Map<ProcessType, Map<string, NgRecord[]>>();
    PROCESS_TYPES.forEach((pt, i) => {
      ngByProcess.set(pt, groupByLine(bulkNgResults[i]));
    });

    /* 3. 전체 NG PID 수집 → Location 벌크 조회 */
    const allPids: string[] = [];
    for (const records of bulkNgResults) {
      for (const rec of records) {
        allPids.push(rec.PID);
      }
    }
    const uniquePids = [...new Set(allPids)];
    const locationMap = await getBulkLocationInfo(uniquePids);

    /* 4. 라인별 카드 데이터 생성 (당일 데이터 있는 라인만) */
    const lineCards: LineCardData[] = [];

    for (const { LINE_CODE: lineCode, LINE_NAME: lineName } of lines2) {
      const processes: ProcessStatus[] = [];
      let overallGrade: AlertGrade = "OK";

      for (const pt of PROCESS_TYPES) {
        const ngRecords = ngByProcess.get(pt)?.get(lineCode) || [];
        let grade: AlertGrade = "OK";
        let category: CategoryType | null = null;
        let locationCode: string | null = null;
        let detail: string | null = null;

        /* 사고성 감지 */
        const accident = detectAccident(pt, ngRecords.length);
        if (accident.grade !== "OK") {
          grade = accident.grade;
          category = "사고성";
          detail = accident.detail;
        }

        /* 반복성 감지 (HIPOT 제외 - HIPOT은 사고성만 적용) */
        let pendingCount = 0;
        if (ngRecords.length > 0 && pt !== "HIPOT") {
          const repeat = detectRepeatability(ngRecords, locationMap);
          if (repeat.grade !== "OK") {
            grade = worseGrade(grade, repeat.grade);
            category = category ? "사고성+반복성" : "반복성";
            locationCode = repeat.locationCode;
            detail = detail ? `${detail} / ${repeat.detail}` : repeat.detail;
            pendingCount = repeat.pendingCount;
          } else if (!category) {
            pendingCount = repeat.pendingCount;
          }
        }

        processes.push({
          process: pt,
          processLabel: PROCESS_LABELS[pt],
          grade,
          category,
          lastInspectDate: ngRecords.length > 0 ? ngRecords[0].INSPECT_DATE : null,
          ngCount: ngRecords.length,
          locationCode,
          detail,
          pendingCount,
        });

        overallGrade = worseGrade(overallGrade, grade);
      }

      lineCards.push({
        lineCode,
        lineName,
        processes,
        overallGrade,
      });
    }

    /* NG 라인 상단 정렬 */
    lineCards.sort((a, b) => {
      const order: Record<AlertGrade, number> = { A: 0, B: 1, C: 2, OK: 3 };
      return order[a.overallGrade] - order[b.overallGrade];
    });

    return NextResponse.json({
      lines: lineCards,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Monitoring API error:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
