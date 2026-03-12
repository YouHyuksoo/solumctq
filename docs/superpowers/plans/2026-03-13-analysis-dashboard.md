# 종합분석 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 8개 이상점 모니터링을 한 화면에서 종합 분석하는 대시보드 + 상세 보고서 페이지 구축

**Architecture:** 기존 8개 API를 프론트에서 Promise.all로 병렬 호출하여 집계. 상단 요약 카드 8개 + 하단 상세 보고서 8섹션 구조. 새 API 없이 프론트 집계만으로 구현.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, useLineFilter context

---

## File Structure

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/app/monitoring/analysis/types.ts` | 종합분석 전용 타입 정의 | 신규 생성 |
| `src/app/monitoring/analysis/hooks/useAnalysis.ts` | 8개 API 병렬 호출 + 집계 훅 | 신규 생성 |
| `src/app/monitoring/analysis/components/SummaryCards.tsx` | 8개 요약 카드 컴포넌트 | 신규 생성 |
| `src/app/monitoring/analysis/components/DetailReport.tsx` | 상세 보고서 8섹션 렌더러 | 신규 생성 |
| `src/app/monitoring/analysis/page.tsx` | 페이지 셸 + 레이아웃 | 신규 생성 |
| `src/i18n/locales/ko.ts` | 종합분석 번역 키 추가 | 수정 |
| `src/i18n/locales/en.ts` | 동일 | 수정 |
| `src/i18n/locales/vi.ts` | 동일 | 수정 |
| `src/app/page.tsx` | 주메뉴에 종합분석 카드 추가 | 수정 |
| `src/app/monitoring/components/MonitoringNav.tsx` | 종합분석 탭 추가 | 수정 |

---

## Task 1: 타입 정의 + 다국어 키 추가

**Files:**
- Create: `src/app/monitoring/analysis/types.ts`
- Modify: `src/i18n/locales/ko.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/vi.ts`

- [ ] **Step 1:** `types.ts` 생성 — 종합분석 전용 타입

```typescript
/**
 * @file src/app/monitoring/analysis/types.ts
 * @description 종합분석 대시보드 전용 타입 정의
 */

/** 8개 모니터링 키 */
export type MonitorKey =
  | "repeatability" | "nonConsecutive" | "accident" | "material"
  | "openShort" | "indicator" | "fpy" | "equipment";

/** 모니터링별 요약 */
export interface MonitorSummary {
  key: MonitorKey;
  highestGrade: "A" | "B" | "C" | "OK";
  abnormalCount: number;
  /** 이상 라인 목록 (보고서용) */
  abnormalLines: AbnormalLine[];
  /** API 호출 실패 시 에러 메시지 */
  error?: string;
}

/** 이상 라인 상세 */
export interface AbnormalLine {
  lineName: string;
  lineCode: string;
  grade: string;
  details: ProcessDetail[];
}

/** 공정별 상세 (반복성/비연속/사고성/원자재/공용부품) */
export interface ProcessDetail {
  process: string;
  grade: string;
  ngCount: number;
  detail: string;
}

/** FPY 이상 상세 */
export interface FpyDetail {
  lineName: string;
  lineCode: string;
  process: string;
  yieldRate: number;
  diff: number | null;
}

/** 설비 이상 상세 */
export interface EquipmentDetail {
  lineName: string;
  lineCode: string;
  process: string;
  stopMinutes: number;
  grade: string;
}

/** 지표 이상 상세 */
export interface IndicatorDetail {
  itemCode: string;
  process: string;
  lastWeek: number;
  thisWeek: number;
  changeRate: number;
}

/** 전체 현황 집계 */
export interface OverallStatus {
  gradeA: number;
  gradeB: number;
  gradeC: number;
  ok: number;
}

/** useAnalysis 반환 타입 */
export interface AnalysisData {
  summaries: MonitorSummary[];
  overall: OverallStatus;
  lastUpdated: string;
}
```

- [ ] **Step 2:** ko.ts에 종합분석 번역 키 추가

`nav` 섹션에 추가:
```typescript
analysis: "종합분석",
```

`pages.home` 섹션에 추가:
```typescript
analysisDesc: "8개 모니터링 종합 분석 보고",
```

`pages` 섹션에 추가:
```typescript
analysis: {
  title: "종합분석",
  noIssues: "이상 없음",
  overallStatus: "전체 현황",
  abnormalLines: "이상 라인",
  reportTime: "분석 시점",
  fetchError: "조회 실패",
  section: "상세 보고서",
},
```

- [ ] **Step 3:** en.ts에 동일 구조 영어 키 추가

```typescript
// nav
analysis: "Analysis",
// pages.home
analysisDesc: "Comprehensive analysis of all 8 monitors",
// pages.analysis
analysis: {
  title: "Comprehensive Analysis",
  noIssues: "No Issues",
  overallStatus: "Overall Status",
  abnormalLines: "Abnormal Lines",
  reportTime: "Report Time",
  fetchError: "Fetch Failed",
  section: "Detail Report",
},
```

- [ ] **Step 4:** vi.ts에 동일 구조 베트남어 키 추가

```typescript
// nav
analysis: "Phân tích",
// pages.home
analysisDesc: "Phân tích tổng hợp 8 giám sát",
// pages.analysis
analysis: {
  title: "Phân tích tổng hợp",
  noIssues: "Không có vấn đề",
  overallStatus: "Tình trạng chung",
  abnormalLines: "Line bất thường",
  reportTime: "Thời gian phân tích",
  fetchError: "Lỗi truy vấn",
  section: "Báo cáo chi tiết",
},
```

- [ ] **Step 5:** 빌드 확인

Run: `npx next build`
Expected: 성공

---

## Task 2: useAnalysis 훅 구현

**Files:**
- Create: `src/app/monitoring/analysis/hooks/useAnalysis.ts`

- [ ] **Step 1:** useAnalysis 훅 생성

기존 useFpy 패턴을 따르되 8개 API를 병렬 호출:

```typescript
/**
 * @file src/app/monitoring/analysis/hooks/useAnalysis.ts
 * @description 종합분석 데이터 훅 — 8개 API 병렬 호출 + 집계
 *
 * 초보자 가이드:
 * 1. fetchAll() 호출 시 8개 모니터링 API를 Promise.allSettled로 병렬 호출
 * 2. 각 API 응답에서 이상 라인 추출 + 등급 집계
 * 3. 부분 실패 시 해당 모니터링만 에러 표시
 */

import { useState, useCallback } from "react";
import type { MonitorKey, MonitorSummary, AnalysisData, OverallStatus, AbnormalLine, ProcessDetail } from "../types";

const API_ENDPOINTS: { key: MonitorKey; path: string }[] = [
  { key: "repeatability", path: "/api/ctq/repeatability" },
  { key: "nonConsecutive", path: "/api/ctq/non-consecutive" },
  { key: "accident", path: "/api/ctq/accident" },
  { key: "material", path: "/api/ctq/material" },
  { key: "openShort", path: "/api/ctq/open-short" },
  { key: "indicator", path: "/api/ctq/indicator" },
  { key: "fpy", path: "/api/ctq/fpy" },
  { key: "equipment", path: "/api/ctq/equipment" },
];

/** 등급 우선순위 (높을수록 심각) */
function gradePriority(g: string): number {
  if (g === "A") return 3;
  if (g === "B") return 2;
  if (g === "C") return 1;
  return 0;
}

function higherGrade(a: string, b: string): string {
  return gradePriority(a) >= gradePriority(b) ? a : b;
}

/**
 * 일반 모니터링 (반복성/비연속/사고성/원자재/공용부품) 응답 파싱
 * lines[].overallGrade, lines[].processes[] 구조
 */
function parseStandardResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    const grade = line.overallGrade ?? "OK";
    if (grade === "OK") continue;
    highest = higherGrade(highest, grade);

    const details: ProcessDetail[] = [];
    const procs = Array.isArray(line.processes) ? line.processes : [];
    for (const p of procs) {
      if (p.grade && p.grade !== "OK") {
        details.push({
          process: p.processLabel ?? p.process ?? "",
          grade: p.grade,
          ngCount: p.ngCount ?? 0,
          detail: p.detail ?? "",
        });
      }
    }
    abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade, details });
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** FPY 응답 파싱 — overallGrade="A"인 라인 추출 */
function parseFpyResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    if (line.overallGrade !== "A") continue;
    highest = "A";
    const details: ProcessDetail[] = [];
    const procs = line.processes ?? {};
    for (const [key, val] of Object.entries(procs) as [string, any][]) {
      const today = val?.today;
      if (today && today.yield < 90) {
        details.push({ process: key, grade: "A", ngCount: today.ng ?? 0, detail: `${today.yield.toFixed(1)}%` });
      }
    }
    abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade: "A", details });
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** 설비 응답 파싱 */
function parseEquipmentResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    const grade = line.overallGrade ?? line.grade ?? "OK";
    if (grade === "OK") continue;
    highest = higherGrade(highest, grade);
    const details: ProcessDetail[] = [];
    const procs = Array.isArray(line.processes) ? line.processes : [];
    for (const p of procs) {
      if (p.grade && p.grade !== "OK") {
        details.push({ process: p.process ?? "", grade: p.grade, ngCount: p.stopMinutes ?? 0, detail: `${p.stopMinutes ?? 0}분` });
      }
    }
    abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade, details });
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** 지표 응답 파싱 */
function parseIndicatorResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const data = json.data ?? json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  // indicator는 모델별이라 구조가 다름 — 등급이 C 이상인 항목 추출
  if (Array.isArray(data)) {
    for (const item of data) {
      const grade = item.grade ?? item.overallGrade ?? "OK";
      if (grade === "OK") continue;
      highest = higherGrade(highest, grade);
      abnormal.push({
        lineName: item.itemCode ?? item.lineName ?? "",
        lineCode: item.lineCode ?? "",
        grade,
        details: [{ process: item.process ?? "", grade, ngCount: item.thisWeek ?? 0, detail: `${item.changeRate ?? 0}%` }],
      });
    }
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

function parseResponse(key: MonitorKey, json: any) {
  if (key === "fpy") return parseFpyResponse(json);
  if (key === "equipment") return parseEquipmentResponse(json);
  if (key === "indicator") return parseIndicatorResponse(json);
  return parseStandardResponse(json);
}

export function useAnalysis(selectedLines: string[] = []) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled(
      API_ENDPOINTS.map(async ({ key, path }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(`${path}${linesParam}`, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          return { key, json };
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    const summaries: MonitorSummary[] = API_ENDPOINTS.map(({ key }, i) => {
      const result = results[i];
      if (result.status === "rejected") {
        return { key, highestGrade: "OK" as const, abnormalCount: 0, abnormalLines: [], error: String(result.reason) };
      }
      const { json } = result.value;
      const parsed = parseResponse(key, json);
      return {
        key,
        highestGrade: parsed.highestGrade as "A" | "B" | "C" | "OK",
        abnormalCount: parsed.abnormalLines.length,
        abnormalLines: parsed.abnormalLines,
      };
    });

    const overall: OverallStatus = { gradeA: 0, gradeB: 0, gradeC: 0, ok: 0 };
    for (const s of summaries) {
      if (s.error) continue;
      for (const line of s.abnormalLines) {
        if (line.grade === "A") overall.gradeA++;
        else if (line.grade === "B") overall.gradeB++;
        else if (line.grade === "C") overall.gradeC++;
      }
    }
    // OK 라인 수: 전체 라인 - 이상 라인 (모니터링별 합산이므로 근사치)
    const totalAbnormal = overall.gradeA + overall.gradeB + overall.gradeC;
    overall.ok = Math.max(0, selectedLines.length * 8 - totalAbnormal);

    setData({ summaries, overall, lastUpdated: new Date().toISOString() });
    setLoading(false);
  }, [linesParam, selectedLines.length]);

  return { data, loading, fetchAll };
}
```

- [ ] **Step 2:** 빌드 확인

Run: `npx next build`
Expected: 성공

---

## Task 3: SummaryCards 컴포넌트

**Files:**
- Create: `src/app/monitoring/analysis/components/SummaryCards.tsx`

- [ ] **Step 1:** SummaryCards 생성

```typescript
/**
 * @file src/app/monitoring/analysis/components/SummaryCards.tsx
 * @description 종합분석 요약 카드 8개 + 전체 현황 바
 *
 * 초보자 가이드:
 * 1. 8개 모니터링별 요약 카드 (최고등급 + 이상라인 수)
 * 2. 카드 클릭 → 해당 보고서 섹션으로 smooth 스크롤
 * 3. 전체 현황 바: A/B/C/OK 건수 합산
 */

"use client";

import { useLocale } from "@/i18n";
import type { MonitorSummary, OverallStatus, MonitorKey } from "../types";

const MONITOR_LABELS: Record<string, Record<MonitorKey, string>> = {
  ko: { repeatability: "반복성", nonConsecutive: "비연속", accident: "사고성", material: "원자재", openShort: "공용부품", indicator: "지표", fpy: "FPY", equipment: "설비" },
  en: { repeatability: "Repeat", nonConsecutive: "Non-Consec.", accident: "Accident", material: "Material", openShort: "Open/Short", indicator: "Indicator", fpy: "FPY", equipment: "Equipment" },
  vi: { repeatability: "Lặp lại", nonConsecutive: "Không LT", accident: "Sự cố", material: "Nguyên liệu", openShort: "Open/Short", indicator: "Chỉ số", fpy: "FPY", equipment: "Thiết bị" },
};

const GRADE_STYLES: Record<string, { border: string; badge: string }> = {
  A: { border: "border-red-500", badge: "bg-red-600" },
  B: { border: "border-orange-500", badge: "bg-orange-600" },
  C: { border: "border-purple-500", badge: "bg-purple-600" },
  OK: { border: "border-green-700", badge: "bg-green-700" },
};

interface Props {
  summaries: MonitorSummary[];
  overall: OverallStatus;
}

export default function SummaryCards({ summaries, overall }: Props) {
  const { locale } = useLocale();
  const l = (locale === "ko" || locale === "en" || locale === "vi") ? locale : "ko";
  const labels = MONITOR_LABELS[l] ?? MONITOR_LABELS.ko;

  const scrollTo = (key: MonitorKey) => {
    document.getElementById(`report-${key}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {/* 요약 카드 8개 */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {summaries.map((s) => {
          const style = GRADE_STYLES[s.highestGrade] ?? GRADE_STYLES.OK;
          return (
            <button key={s.key} onClick={() => scrollTo(s.key)}
              className={`rounded-lg border-2 ${style.border} bg-gray-900/70 p-3 text-center hover:bg-gray-800/70 transition-colors`}>
              <div className="text-xs text-gray-400 mb-1">{labels[s.key]}</div>
              {s.error ? (
                <span className="text-[10px] text-red-400">ERR</span>
              ) : (
                <>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold text-white ${style.badge}`}>
                    {s.highestGrade}
                  </span>
                  {s.abnormalCount > 0 && (
                    <div className="text-[10px] text-gray-500 mt-1">{s.abnormalCount} lines</div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* 전체 현황 바 */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg text-sm">
        <span className="text-gray-400 font-medium">
          {l === "en" ? "Overall:" : l === "vi" ? "Tổng:" : "전체 현황:"}
        </span>
        {overall.gradeA > 0 && <Badge color="bg-red-600" label="A" count={overall.gradeA} />}
        {overall.gradeB > 0 && <Badge color="bg-orange-600" label="B" count={overall.gradeB} />}
        {overall.gradeC > 0 && <Badge color="bg-purple-600" label="C" count={overall.gradeC} />}
        {overall.gradeA === 0 && overall.gradeB === 0 && overall.gradeC === 0 && (
          <span className="text-green-400 text-xs font-bold">
            {l === "en" ? "All Normal" : l === "vi" ? "Tất cả bình thường" : "전체 정상"}
          </span>
        )}
      </div>
    </div>
  );
}

function Badge({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${color}`}>{label}</span>
      <span className="text-white text-xs">{count}건</span>
    </div>
  );
}
```

- [ ] **Step 2:** 빌드 확인

---

## Task 4: DetailReport 컴포넌트

**Files:**
- Create: `src/app/monitoring/analysis/components/DetailReport.tsx`

- [ ] **Step 1:** DetailReport 생성

8개 섹션을 순서대로 렌더링. 각 섹션에 `id="report-{key}"`로 스크롤 앵커 제공.

이상 있는 라인만 테이블로 표시, 없으면 "이상 없음" 표시.

각 모니터링의 abnormalLines 배열을 테이블로 렌더링:
- 라인명 | 공정 | 등급 | NG건수 | 상세

- [ ] **Step 2:** 빌드 확인

---

## Task 5: 페이지 셸 + 라우트 통합

**Files:**
- Create: `src/app/monitoring/analysis/page.tsx`
- Modify: `src/app/page.tsx` (종합분석 카드 추가)
- Modify: `src/app/monitoring/components/MonitoringNav.tsx` (탭 추가)

- [ ] **Step 1:** `analysis/page.tsx` 생성

기존 FPY 페이지 패턴을 따름:
- 타이틀 배너 + MonitoringNav 헤더
- useAnalysis 훅으로 데이터 fetch
- SummaryCards + DetailReport 렌더링

- [ ] **Step 2:** MonitoringNav에 종합분석 탭 추가

`NAV_ITEMS` 배열 맨 앞에 종합분석 항목 추가:
```typescript
{ href: "/monitoring/analysis", labelKey: "nav.analysis", tooltipKey: "navTooltip.analysis", statusKey: "navTooltip.analysisStatus" },
```

- [ ] **Step 3:** 주메뉴(`page.tsx`)에 종합분석 카드 추가

MENU_ITEMS 배열 맨 앞에 추가:
```typescript
{
  href: "/monitoring/analysis",
  title: t("nav.analysis") as string,
  description: t("pages.home.analysisDesc") as string,
  icon: Icons.analysis, // 새 SVG 아이콘 (클립보드+체크)
  accent: "border-blue-500 hover:bg-blue-950/40",
  badge: "ALL",
  badgeColor: "bg-blue-600",
},
```

- [ ] **Step 4:** 빌드 확인 + 브라우저 테스트

Run: `npx next build`
Expected: 성공

---

## Task 6: 최종 확인

- [ ] **Step 1:** 전체 빌드 성공 확인
- [ ] **Step 2:** 기존 navTooltip 참조 깨지지 않았는지 확인
- [ ] **Step 3:** `/monitoring/analysis` 페이지 동작 확인
