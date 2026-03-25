# 지표 월간 캐싱 테이블 + 대책서 관리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지표 페이지를 월간 전용으로 전환하고, 계산 결과를 Oracle 테이블에 캐싱하여 조회 성능 개선 + 200% 초과 시 대책서번호 등록 기능 추가

**Architecture:** Oracle 테이블 `IQ_INDICATOR_MONTHLY`에 월+모델+공정 단위로 NG/TOTAL/PPM을 저장. API에서 해당 월 데이터 유무를 확인하여 있으면 바로 반환, 없으면 RAW 테이블에서 계산 후 INSERT. 대책서번호는 POST API로 UPDATE. 프론트는 월간 전용 2기간(전전월/전월) 표시, 200% 초과 셀에 대책서 등록/OK 표시.

**Tech Stack:** Next.js API Route, Oracle DB (oracledb), React (client component)

---

## 파일 구조

| 파일 | 역할 | 변경 |
|------|------|------|
| `docs/ddl/IQ_INDICATOR_MONTHLY.sql` | 테이블 DDL | 신규 |
| `src/app/api/ctq/indicator/route.ts` | GET(조회/자동생성) + POST(대책서등록) | 전면 재작성 |
| `src/app/monitoring/indicator/types.ts` | 타입 정의 | 수정 (월간 전용, 대책서 필드 추가) |
| `src/app/monitoring/indicator/hooks/useIndicator.ts` | 데이터 fetch 훅 | 수정 (월간 전용, 재생성/대책서 API) |
| `src/app/monitoring/indicator/components/IndicatorTable.tsx` | 테이블 렌더링 | 수정 (2기간, 대책서 등록/OK 표시) |
| `src/app/monitoring/indicator/page.tsx` | 페이지 | 수정 (주간 토글 제거, 재생성 버튼) |

---

### Task 1: DDL — IQ_INDICATOR_MONTHLY 테이블 생성

**Files:**
- Create: `docs/ddl/IQ_INDICATOR_MONTHLY.sql`

- [ ] **Step 1: DDL 파일 작성**

```sql
-- IQ_INDICATOR_MONTHLY: 지표 월간 캐싱 테이블
-- 월 + 모델 + 공정 단위로 NG/TOTAL/PPM 저장
CREATE TABLE IQ_INDICATOR_MONTHLY (
  TARGET_MONTH      VARCHAR2(7)   NOT NULL,   -- '2026/03'
  ITEM_CODE         VARCHAR2(50)  NOT NULL,   -- 모델 코드
  PROCESS_CODE      VARCHAR2(10)  NOT NULL,   -- 'ICT','HIPOT','FT','BURNIN','ATE'
  NG_COUNT          NUMBER        DEFAULT 0,  -- NG 건수
  TOTAL_COUNT       NUMBER        DEFAULT 0,  -- 전체 검사 건수
  PPM               NUMBER        DEFAULT 0,  -- PPM 값
  COUNTERMEASURE_NO VARCHAR2(50),             -- 대책서번호 (NULL=미등록)
  CREATED_DATE      DATE          DEFAULT SYSDATE,
  UPDATED_DATE      DATE          DEFAULT SYSDATE,
  CONSTRAINT PK_IQ_INDICATOR_MONTHLY PRIMARY KEY (TARGET_MONTH, ITEM_CODE, PROCESS_CODE)
);

COMMENT ON TABLE IQ_INDICATOR_MONTHLY IS '지표 월간 캐싱 — 모델×공정별 NG/PPM + 대책서';
COMMENT ON COLUMN IQ_INDICATOR_MONTHLY.TARGET_MONTH IS '대상 월 (YYYY/MM)';
COMMENT ON COLUMN IQ_INDICATOR_MONTHLY.ITEM_CODE IS '모델 코드 (IP_PRODUCT_2D_BARCODE.ITEM_CODE)';
COMMENT ON COLUMN IQ_INDICATOR_MONTHLY.PROCESS_CODE IS '공정 코드 (ICT/HIPOT/FT/BURNIN/ATE)';
COMMENT ON COLUMN IQ_INDICATOR_MONTHLY.COUNTERMEASURE_NO IS '대책서번호 (NULL이면 미등록)';
```

- [ ] **Step 2: DB에서 DDL 실행**

Oracle DB에 접속하여 위 DDL 실행. 테이블 생성 확인:
```sql
SELECT table_name FROM user_tables WHERE table_name = 'IQ_INDICATOR_MONTHLY';
```

- [ ] **Step 3: 커밋**

```bash
git add docs/ddl/IQ_INDICATOR_MONTHLY.sql
git commit -m "feat: IQ_INDICATOR_MONTHLY 테이블 DDL 추가"
```

---

### Task 2: 타입 정의 수정 — 월간 전용 + 대책서 필드

**Files:**
- Modify: `src/app/monitoring/indicator/types.ts`

- [ ] **Step 1: types.ts 전면 수정**

```typescript
/**
 * @file src/app/monitoring/indicator/types.ts
 * @description 지표 모니터링 타입 정의 — 월간 전용, 전전월/전월 2기간
 */

/** 대상 공정 키 */
export type IndicatorProcessKey =
  | "ICT" | "HIPOT" | "FT" | "BURNIN" | "ATE";

/** 공정별 2기간 데이터 */
export interface MonthlyProcessData {
  ngCount: number;
  totalCount: number;
  ppm: number;
  countermeasureNo: string | null;
}

/** 모델별 데이터 — 전전월/전월 각각 공정별 데이터 */
export interface IndicatorModelData {
  itemCode: string;
  monthBefore: Partial<Record<IndicatorProcessKey, MonthlyProcessData>>;
  lastMonth: Partial<Record<IndicatorProcessKey, MonthlyProcessData>>;
}

/** 월 범위 표시용 */
export interface MonthRange {
  month: string;      // '2026/01'
  displayLabel: string; // '01월' 또는 'Jan'
}

/** API 응답 */
export interface IndicatorResponse {
  models: IndicatorModelData[];
  monthBefore: MonthRange;
  lastMonth: MonthRange;
  lastUpdated: string;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/types.ts
git commit -m "feat: 지표 타입 월간 전용으로 변경 + 대책서 필드 추가"
```

---

### Task 3: API — GET (조회/자동생성) + POST (대책서 등록)

**Files:**
- Modify: `src/app/api/ctq/indicator/route.ts` (전면 재작성)

- [ ] **Step 1: route.ts 전면 재작성**

핵심 로직:

**GET `/api/ctq/indicator`:**
1. 전전월/전월 계산 (현재 날짜 기준)
2. `IQ_INDICATOR_MONTHLY`에서 두 달 데이터 조회
3. 없는 달은 RAW 테이블에서 계산 → INSERT
4. `?regenerate=true` 파라미터 시 DELETE 후 재계산
5. 피벗하여 모델별 응답 구성
6. minVolume 필터링 적용

**POST `/api/ctq/indicator`:**
- body: `{ targetMonth, itemCode, processCode, countermeasureNo }`
- `IQ_INDICATOR_MONTHLY` UPDATE

```typescript
/**
 * @file src/app/api/ctq/indicator/route.ts
 * @description CTQ 지표 API — 월간 캐싱 테이블 기반 조회 + 대책서 등록
 *
 * 초보자 가이드:
 * 1. IQ_INDICATOR_MONTHLY 테이블에 월+모델+공정 단위로 캐싱
 * 2. 해당 월 데이터 없으면 RAW 테이블에서 자동 계산 후 INSERT
 * 3. ?regenerate=true 로 강제 재생성 가능
 * 4. POST로 대책서번호 등록/수정
 */

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { executeQuery } from "@/lib/oracle";
import type { IndicatorProcessKey, IndicatorModelData, MonthlyProcessData } from "@/app/monitoring/indicator/types";

export const dynamic = "force-dynamic";

/* ── 공정 테이블 매핑 ── */

interface ProcessConfig {
  table: string;
  dateCol: string;
  pidCol: string;
  resultCol: string;
  extraWhere?: string;
}

const PROCESS_CONFIG: Record<IndicatorProcessKey, ProcessConfig> = {
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW",   dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", extraWhere: "AND t.LAST_FLAG = 'Y'" },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",     dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT", extraWhere: "AND t.LAST_FLAG = 'Y'" },
};

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

/* ── 월 범위 계산 ── */

function getMonthRanges(): { monthBefore: string; lastMonth: string; mbStart: string; mbEnd: string; lmStart: string; lmEnd: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based

  const lastMonthDate = new Date(y, m - 1, 1);
  const monthBeforeDate = new Date(y, m - 2, 1);

  const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const fmtOracle = (d: Date) => `${fmt(d)}/01 00:00:00`;

  const lmEnd = new Date(y, m, 1); // 당월 1일 = 전월 종료 경계
  const mbEnd = new Date(y, m - 1, 1); // 전월 1일 = 전전월 종료 경계

  return {
    monthBefore: fmt(monthBeforeDate),
    lastMonth: fmt(lastMonthDate),
    mbStart: fmtOracle(monthBeforeDate),
    mbEnd: fmtOracle(mbEnd),
    lmStart: fmtOracle(lastMonthDate),
    lmEnd: fmtOracle(lmEnd),
  };
}

/* ── 캐시 테이블 조회 ── */

interface CacheRow {
  TARGET_MONTH: string;
  ITEM_CODE: string;
  PROCESS_CODE: string;
  NG_COUNT: number;
  TOTAL_COUNT: number;
  PPM: number;
  COUNTERMEASURE_NO: string | null;
}

async function getCachedData(targetMonth: string): Promise<CacheRow[]> {
  const sql = `
    SELECT TARGET_MONTH, ITEM_CODE, PROCESS_CODE,
           NG_COUNT, TOTAL_COUNT, PPM, COUNTERMEASURE_NO
    FROM IQ_INDICATOR_MONTHLY
    WHERE TARGET_MONTH = :tm
  `;
  return executeQuery<CacheRow>(sql, { tm: targetMonth });
}

/* ── RAW 테이블에서 계산 후 INSERT ── */

interface RawRow {
  ITEM_CODE: string;
  NG_COUNT: number;
  TOTAL_COUNT: number;
}

async function generateMonthData(targetMonth: string, startStr: string, endStr: string): Promise<void> {
  // 기존 데이터 삭제
  await executeQuery(`DELETE FROM IQ_INDICATOR_MONTHLY WHERE TARGET_MONTH = :tm`, { tm: targetMonth });

  // 공정별 병렬 조회
  const results = await Promise.all(
    PROCESS_KEYS.map(async (key) => {
      const config = PROCESS_CONFIG[key];
      const col = `t.${config.dateCol}`;
      const sql = `
        SELECT b.ITEM_CODE,
               SUM(CASE WHEN t.${config.resultCol} NOT IN ('PASS','GOOD','OK','Y') THEN 1 ELSE 0 END) AS NG_COUNT,
               COUNT(*) AS TOTAL_COUNT
        FROM ${config.table} t
        JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.${config.pidCol}
        WHERE ${col} >= :startStr AND ${col} < :endStr
          AND (t.${config.pidCol} LIKE 'VN07%' OR t.${config.pidCol} LIKE 'VNL1%' OR t.${config.pidCol} LIKE 'VNA2%')
          AND t.LINE_CODE IS NOT NULL
          AND b.ITEM_CODE IS NOT NULL AND b.ITEM_CODE <> '*'
          ${config.extraWhere ?? ""}
        GROUP BY b.ITEM_CODE
      `;
      const rows = await executeQuery<RawRow>(sql, { startStr, endStr });
      return { key, rows };
    })
  );

  // INSERT (공정별 순회)
  for (const { key, rows } of results) {
    for (const row of rows) {
      const ppm = row.TOTAL_COUNT > 0 ? Math.round((row.NG_COUNT / row.TOTAL_COUNT) * 1_000_000) : 0;
      const insertSql = `
        INSERT INTO IQ_INDICATOR_MONTHLY
          (TARGET_MONTH, ITEM_CODE, PROCESS_CODE, NG_COUNT, TOTAL_COUNT, PPM, CREATED_DATE, UPDATED_DATE)
        VALUES (:tm, :ic, :pc, :ng, :tot, :ppm, SYSDATE, SYSDATE)
      `;
      await executeQuery(insertSql, {
        tm: targetMonth,
        ic: row.ITEM_CODE,
        pc: key,
        ng: row.NG_COUNT,
        tot: row.TOTAL_COUNT,
        ppm,
      });
    }
  }
}

/* ── 캐시 데이터 → 응답 변환 ── */

function buildResponse(
  mbRows: CacheRow[],
  lmRows: CacheRow[],
  monthBefore: string,
  lastMonth: string,
  minVolume: number
): IndicatorModelData[] {
  const modelMap = new Map<string, IndicatorModelData>();

  const ensureModel = (itemCode: string): IndicatorModelData => {
    if (!modelMap.has(itemCode)) {
      modelMap.set(itemCode, { itemCode, monthBefore: {}, lastMonth: {} });
    }
    return modelMap.get(itemCode)!;
  };

  for (const row of mbRows) {
    const model = ensureModel(row.ITEM_CODE);
    model.monthBefore[row.PROCESS_CODE as IndicatorProcessKey] = {
      ngCount: row.NG_COUNT,
      totalCount: row.TOTAL_COUNT,
      ppm: row.PPM,
      countermeasureNo: row.COUNTERMEASURE_NO,
    };
  }

  for (const row of lmRows) {
    const model = ensureModel(row.ITEM_CODE);
    model.lastMonth[row.PROCESS_CODE as IndicatorProcessKey] = {
      ngCount: row.NG_COUNT,
      totalCount: row.TOTAL_COUNT,
      ppm: row.PPM,
      countermeasureNo: row.COUNTERMEASURE_NO,
    };
  }

  // 필터링: 전전월/전월 PPM 모두 0이면 제외, minVolume 미만 제외
  const models = [...modelMap.values()].filter((model) => {
    const mbProcs = Object.values(model.monthBefore);
    const lmProcs = Object.values(model.lastMonth);
    const mbPpmSum = mbProcs.reduce((s, p) => s + (p?.ppm ?? 0), 0);
    const lmPpmSum = lmProcs.reduce((s, p) => s + (p?.ppm ?? 0), 0);
    if (mbPpmSum === 0 && lmPpmSum === 0) return false;
    const mbTotal = mbProcs.reduce((s, p) => s + (p?.totalCount ?? 0), 0);
    const lmTotal = lmProcs.reduce((s, p) => s + (p?.totalCount ?? 0), 0);
    if (mbTotal < minVolume || lmTotal < minVolume) return false;
    return true;
  });

  // PPM 합계 내림차순 정렬
  models.sort((a, b) => {
    const sumA = [...Object.values(a.monthBefore), ...Object.values(a.lastMonth)]
      .reduce((s, p) => s + (p?.ppm ?? 0), 0);
    const sumB = [...Object.values(b.monthBefore), ...Object.values(b.lastMonth)]
      .reduce((s, p) => s + (p?.ppm ?? 0), 0);
    return sumB - sumA;
  });

  return models;
}

/* ── GET 핸들러 ── */

export async function GET(request: NextRequest) {
  try {
    const regenerate = request.nextUrl.searchParams.get("regenerate") === "true";
    const minVolumeParam = Number(request.nextUrl.searchParams.get("minVolume"));
    const minVolume = minVolumeParam > 0 ? minVolumeParam : 200;

    const ranges = getMonthRanges();

    // 재생성 모드
    if (regenerate) {
      await Promise.all([
        generateMonthData(ranges.monthBefore, ranges.mbStart, ranges.mbEnd),
        generateMonthData(ranges.lastMonth, ranges.lmStart, ranges.lmEnd),
      ]);
    }

    // 캐시 조회
    let [mbRows, lmRows] = await Promise.all([
      getCachedData(ranges.monthBefore),
      getCachedData(ranges.lastMonth),
    ]);

    // 없는 달만 자동 생성
    if (mbRows.length === 0) {
      await generateMonthData(ranges.monthBefore, ranges.mbStart, ranges.mbEnd);
      mbRows = await getCachedData(ranges.monthBefore);
    }
    if (lmRows.length === 0) {
      await generateMonthData(ranges.lastMonth, ranges.lmStart, ranges.lmEnd);
      lmRows = await getCachedData(ranges.lastMonth);
    }

    const models = buildResponse(mbRows, lmRows, ranges.monthBefore, ranges.lastMonth, minVolume);

    const toDisplayLabel = (m: string) => `${m.split("/")[1]}월`;

    return NextResponse.json({
      models,
      monthBefore: { month: ranges.monthBefore, displayLabel: toDisplayLabel(ranges.monthBefore) },
      lastMonth: { month: ranges.lastMonth, displayLabel: toDisplayLabel(ranges.lastMonth) },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Indicator API error:", error);
    return NextResponse.json({ error: "데이터 조회 실패", detail: String(error) }, { status: 500 });
  }
}

/* ── POST 핸들러 — 대책서번호 등록 ── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetMonth, itemCode, processCode, countermeasureNo } = body;

    if (!targetMonth || !itemCode || !processCode) {
      return NextResponse.json({ error: "targetMonth, itemCode, processCode 필수" }, { status: 400 });
    }

    const sql = `
      UPDATE IQ_INDICATOR_MONTHLY
      SET COUNTERMEASURE_NO = :cn, UPDATED_DATE = SYSDATE
      WHERE TARGET_MONTH = :tm AND ITEM_CODE = :ic AND PROCESS_CODE = :pc
    `;
    await executeQuery(sql, {
      cn: countermeasureNo || null,
      tm: targetMonth,
      ic: itemCode,
      pc: processCode,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Indicator POST error:", error);
    return NextResponse.json({ error: "대책서 등록 실패", detail: String(error) }, { status: 500 });
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/api/ctq/indicator/route.ts
git commit -m "feat: 지표 API 월간 캐싱 테이블 기반 조회 + 대책서 POST"
```

---

### Task 4: Hook 수정 — 월간 전용 + 재생성/대책서 API

**Files:**
- Modify: `src/app/monitoring/indicator/hooks/useIndicator.ts`

- [ ] **Step 1: useIndicator.ts 수정**

```typescript
/**
 * @file src/app/monitoring/indicator/hooks/useIndicator.ts
 * @description 지표 데이터 fetch 훅 — 월간 전용, 재생성/대책서 등록 지원
 */

import { useState, useCallback } from "react";
import type { IndicatorResponse } from "../types";

export function useIndicator(minVolume: number = 200) {
  const [data, setData] = useState<IndicatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (regenerate = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (minVolume !== 200) params.set("minVolume", String(minVolume));
      if (regenerate) params.set("regenerate", "true");
      const qs = params.toString();
      const res = await fetch(`/api/ctq/indicator${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: IndicatorResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [minVolume]);

  /** 대책서번호 등록 */
  const registerCountermeasure = useCallback(async (
    targetMonth: string,
    itemCode: string,
    processCode: string,
    countermeasureNo: string
  ) => {
    const res = await fetch("/api/ctq/indicator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetMonth, itemCode, processCode, countermeasureNo }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // 등록 후 데이터 새로고침
    await fetchData();
  }, [fetchData]);

  return { data, error, loading, fetchData, registerCountermeasure };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/hooks/useIndicator.ts
git commit -m "feat: useIndicator 월간 전용 + 재생성/대책서 등록 지원"
```

---

### Task 5: IndicatorTable 수정 — 2기간 + 대책서 등록/OK 표시

**Files:**
- Modify: `src/app/monitoring/indicator/components/IndicatorTable.tsx`

- [ ] **Step 1: IndicatorTable.tsx 전면 수정**

핵심 변경:
- 2기간(전전월/전월)만 표시
- 전월 PPM이 전전월 대비 200% 초과 시: 빨간색 + `COUNTERMEASURE_NO` 없으면 **[등록]** 버튼, 있으면 **OK** 뱃지
- [등록] 클릭 시 대책서번호 입력 인풋 표시
- `onRegister` 콜백으로 부모에 전달

```typescript
/**
 * @file src/app/monitoring/indicator/components/IndicatorTable.tsx
 * @description 지표 테이블 — 모델 × 공정, 전전월/전월 2기간 PPM 비교 + 대책서 관리
 */

"use client";

import { useState } from "react";
import { useLocale } from "@/i18n";
import type { IndicatorModelData, IndicatorProcessKey, MonthlyProcessData, MonthRange } from "../types";

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

const PROCESS_LABELS: Record<IndicatorProcessKey, string> = {
  ICT: "ICT", HIPOT: "Hi-Pot", FT: "FT", BURNIN: "Burn-In", ATE: "ATE",
};

const MIN_SAMPLE_SIZE = 30;
const GROUP_BORDER = "border-l-2 border-l-gray-500";

function formatPpm(ppm: number): string {
  return ppm.toLocaleString();
}

function getRatioColor(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return "text-gray-600";
  if (prev === 0 && curr > 0) return "text-gray-600";
  if (curr === 0) return "text-green-400";
  const ratio = (curr / prev) * 100;
  if (ratio >= 200) return "text-red-400 font-bold";
  return "text-green-400";
}

function getRatio(prev: number, curr: number): number {
  if (prev === 0) return 0;
  return Math.round((curr / prev) * 100);
}

interface Props {
  models: IndicatorModelData[];
  monthBefore: MonthRange;
  lastMonth: MonthRange;
  onRegister: (targetMonth: string, itemCode: string, processCode: string, countermeasureNo: string) => Promise<void>;
}

export default function IndicatorTable({ models, monthBefore, lastMonth, onRegister }: Props) {
  const { t } = useLocale();
  const [editCell, setEditCell] = useState<{ item: string; process: string; month: string } | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleRegister = async () => {
    if (!editCell || !inputValue.trim()) return;
    await onRegister(editCell.month, editCell.item, editCell.process, inputValue.trim());
    setEditCell(null);
    setInputValue("");
  };

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-20" style={{ boxShadow: "0 2px 0 0 #1f2937" }}>
          <tr className="bg-gray-800">
            <th className="text-left px-3 py-2 border border-gray-700 bg-gray-800 sticky left-0 z-30" rowSpan={2}>
              {t("pages.indicator.model") as string}
            </th>
            {PROCESS_KEYS.map((key) => (
              <th key={key} className={`text-center px-1 py-1.5 border border-gray-700 bg-gray-800 font-bold ${GROUP_BORDER}`} colSpan={2}>
                {PROCESS_LABELS[key]} <span className="text-gray-400 font-normal text-xs">PPM</span>
              </th>
            ))}
          </tr>
          <tr className="text-xs bg-gray-800">
            {PROCESS_KEYS.map((key) => (
              <SubHeaders key={key} monthBefore={monthBefore} lastMonth={lastMonth} />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.itemCode} className="border-t border-gray-800 hover:bg-gray-800/30">
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap border border-gray-800 sticky left-0 bg-gray-950 z-10">
                {model.itemCode}
              </td>
              {PROCESS_KEYS.map((key) => {
                const mb = model.monthBefore[key];
                const lm = model.lastMonth[key];
                return (
                  <ProcessCells
                    key={key}
                    mb={mb}
                    lm={lm}
                    processCode={key}
                    itemCode={model.itemCode}
                    monthBeforeMonth={monthBefore.month}
                    lastMonthMonth={lastMonth.month}
                    editCell={editCell}
                    inputValue={inputValue}
                    onEditStart={(month) => { setEditCell({ item: model.itemCode, process: key, month }); setInputValue(""); }}
                    onInputChange={setInputValue}
                    onRegister={handleRegister}
                    onEditCancel={() => setEditCell(null)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubHeaders({ monthBefore, lastMonth }: { monthBefore: MonthRange; lastMonth: MonthRange }) {
  return (
    <>
      <th className={`px-1 py-1 border border-gray-700 whitespace-nowrap bg-gray-800 text-gray-400 ${GROUP_BORDER}`}>
        {monthBefore.displayLabel}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-indigo-900 text-indigo-200">
        {lastMonth.displayLabel}
      </th>
    </>
  );
}

interface ProcessCellsProps {
  mb: MonthlyProcessData | undefined;
  lm: MonthlyProcessData | undefined;
  processCode: string;
  itemCode: string;
  monthBeforeMonth: string;
  lastMonthMonth: string;
  editCell: { item: string; process: string; month: string } | null;
  inputValue: string;
  onEditStart: (month: string) => void;
  onInputChange: (v: string) => void;
  onRegister: () => void;
  onEditCancel: () => void;
}

function ProcessCells({
  mb, lm, processCode, itemCode, monthBeforeMonth, lastMonthMonth,
  editCell, inputValue, onEditStart, onInputChange, onRegister, onEditCancel,
}: ProcessCellsProps) {
  const mbPpm = mb?.ppm ?? 0;
  const lmPpm = lm?.ppm ?? 0;
  const ratio = getRatio(mbPpm, lmPpm);
  const isOver200 = mbPpm > 0 && ratio >= 200;
  const colorClass = getRatioColor(mbPpm, lmPpm);

  const isEditing = editCell?.item === itemCode && editCell?.process === processCode;

  // 전월 대책서 상태
  const lmCm = lm?.countermeasureNo;

  return (
    <>
      {/* 전전월 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 ${GROUP_BORDER} ${mbPpm > 0 ? "text-gray-300" : "text-gray-600"}`}>
        {formatPpm(mbPpm)}
      </td>
      {/* 전월 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-indigo-950/60 ${colorClass}`}>
        {isEditing ? (
          <span className="flex items-center gap-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onRegister(); if (e.key === "Escape") onEditCancel(); }}
              className="w-20 px-1 py-0.5 text-xs bg-gray-900 border border-gray-600 rounded text-white"
              placeholder="대책서번호"
              autoFocus
            />
            <button onClick={onRegister} className="text-xs px-1.5 py-0.5 bg-blue-600 rounded text-white">OK</button>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1">
            <span>{mbPpm === 0 && lmPpm === 0 ? "0" : mbPpm === 0 ? "0" : lmPpm === 0 ? "0 (0%)" : `${formatPpm(lmPpm)} (${ratio}%)`}</span>
            {isOver200 && !lmCm && (
              <button
                onClick={() => onEditStart(lastMonthMonth)}
                className="text-[10px] px-1 py-0.5 bg-red-700 hover:bg-red-600 rounded text-white ml-1"
              >
                등록
              </button>
            )}
            {isOver200 && lmCm && (
              <span className="text-[10px] px-1 py-0.5 bg-green-700 rounded text-white ml-1" title={lmCm}>
                OK
              </span>
            )}
          </span>
        )}
      </td>
    </>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/components/IndicatorTable.tsx
git commit -m "feat: 지표 테이블 2기간 + 200% 초과 대책서 등록/OK 표시"
```

---

### Task 6: 페이지 수정 — 주간 토글 제거 + 재생성 버튼

**Files:**
- Modify: `src/app/monitoring/indicator/page.tsx`

- [ ] **Step 1: page.tsx 수정**

핵심 변경:
- `period` 상태/토글 제거 (월간 고정)
- `selectedLines` 의존 제거 (SMPS 고정)
- 재생성 버튼 추가 (기존 새로고침 버튼 옆)
- `IndicatorTable`에 `onRegister` 전달

```typescript
/**
 * @file src/app/monitoring/indicator/page.tsx
 * @description CTQ 지표 모니터링 페이지 — 월간 전용 + 캐싱 테이블 기반
 *
 * 초보자 가이드:
 * 1. 전전월/전월 2기간 PPM 비교 테이블
 * 2. 데이터는 IQ_INDICATOR_MONTHLY 테이블에 캐싱
 * 3. 재생성 버튼으로 RAW에서 재계산 가능
 * 4. 200% 초과 셀에 대책서번호 등록 기능
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { useIndicator } from "./hooks/useIndicator";
import IndicatorTable from "./components/IndicatorTable";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLocale } from "@/i18n";

export default function IndicatorPage() {
  const { t, dateLocale } = useLocale();
  const [minVolume, setMinVolume] = usePersistedState<number>("indicator-minVolume", 200);
  const [showSettings, setShowSettings] = useState(false);
  const [tempVolume, setTempVolume] = useState(String(minVolume));
  const settingsRef = useRef<HTMLDivElement>(null);
  const { data, error, loading, fetchData, registerCountermeasure } = useIndicator(minVolume);

  /* 초기 로딩 */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* 설정 팝오버 외부 클릭 닫기 */
  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* 상단 헤더 */}
      <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center">
            <h1
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
            >
              {t("pages.accident.title") as string}
            </h1>
            <LanguageSelector />
            <HeaderActions />
          </div>
          <div className="flex flex-col items-end gap-1">
            {data && (
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{data.monthBefore.displayLabel}: {data.monthBefore.month}</span>
                <span>{data.lastMonth.displayLabel}: {data.lastMonth.month}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">Solum Vietnam</span>
          </div>
        </div>
      </div>

      {/* 네비게이션 + 버튼 */}
      <header className="shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <MonitoringNav />
          <div className="flex items-center gap-4">
            {/* 조회 버튼 */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  {t("common.dataLoading") as string}
                </span>
              ) : (
                t("pages.indicator.refreshBtn") as string
              )}
            </button>
            {/* 재생성 버튼 */}
            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-orange-700 hover:bg-orange-600 text-sm text-white transition-colors disabled:opacity-50"
            >
              재생성
            </button>
            {/* 설정 */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => { setShowSettings(!showSettings); setTempVolume(String(minVolume)); }}
                className={`p-1.5 rounded transition-colors ${showSettings ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"}`}
                title="모수 설정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
                  <div className="text-sm font-medium text-gray-200 mb-3">모수 필터 설정</div>
                  <label className="block text-xs text-gray-400 mb-1">최소 검사 수량 (기본: 200)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempVolume}
                      onChange={(e) => setTempVolume(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = Number(tempVolume);
                          if (v > 0) { setMinVolume(v); setShowSettings(false); }
                        }
                      }}
                      min={1}
                      className="flex-1 px-2 py-1.5 rounded bg-gray-900 border border-gray-600 text-sm text-gray-200 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => {
                        const v = Number(tempVolume);
                        if (v > 0) { setMinVolume(v); setShowSettings(false); }
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium"
                    >
                      적용
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">검사 수량이 이 값 미만인 모델은 목록에서 제외됩니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 min-h-0 max-w-[1920px] w-full mx-auto">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {t("common.dataError") as string}: {error}
          </div>
        )}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
            <span className="w-8 h-8 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
            {t("common.dataLoading") as string}
          </div>
        )}
        {data && data.models.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t("pages.indicator.noData") as string}
          </div>
        )}
        {data && data.models.length > 0 && (
          <IndicatorTable
            models={data.models}
            monthBefore={data.monthBefore}
            lastMonth={data.lastMonth}
            onRegister={registerCountermeasure}
          />
        )}
      </main>

      {/* 하단 상태바 */}
      <footer className="shrink-0 bg-gray-900 border-t border-gray-700 px-6 py-1.5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            <span>{loading ? (t("common.dataLoading") as string) : (t("common.statusNormal") as string)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {data && (
              <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/page.tsx
git commit -m "feat: 지표 페이지 월간 전용 + 재생성/대책서 등록 통합"
```

---

### Task 7: 통합 테스트 + 최종 커밋

- [ ] **Step 1: 빌드 확인**

```bash
npx next build
```
Expected: 빌드 성공, 타입 에러 없음

- [ ] **Step 2: 브라우저 테스트**

1. `http://localhost:3000/monitoring/indicator` 접속
2. 전전월/전월 데이터 자동 생성 확인
3. 200% 초과 셀에 [등록] 버튼 표시 확인
4. 대책서번호 입력 → OK 표시 확인
5. 재생성 버튼 클릭 → 데이터 재계산 확인

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat: 지표 월간 캐싱 테이블 + 대책서 관리 — 통합 완료"
```
