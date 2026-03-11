# 지표(Indicator) 페이지 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모델(ITEM_CODE) × 공정별 주간 불량 건수 비교 테이블 페이지 구현

**Architecture:** API에서 7개 RAW 테이블을 병렬 조회하여 ITEM_CODE별 3주치(전전주/전주/금주) NG 건수를 집계. 프론트에서 공정별 3컬럼 테이블로 표시하며 비율에 따라 색상 구분.

**Tech Stack:** Next.js App Router, Oracle DB, TypeScript, Tailwind CSS, 기존 i18n Context

---

## Chunk 1: 타입 + i18n + API

### Task 1: 타입 정의

**Files:**
- Create: `src/app/monitoring/indicator/types.ts`

- [ ] **Step 1: 타입 파일 작성**

```ts
/**
 * @file src/app/monitoring/indicator/types.ts
 * @description 지표 모니터링 타입 정의
 *
 * 초보자 가이드:
 * - 모델(ITEM_CODE)별 × 공정별 주간 불량 비교 데이터 구조
 * - 전전주/전주/금주 3주치 NG 건수 + 비율 표시용
 */

/** 대상 공정 키 */
export type IndicatorProcessKey =
  | "ICT" | "HIPOT" | "FT" | "BURNIN" | "ATE" | "IMAGE" | "SET";

/** 공정별 3주 불량 데이터 */
export interface WeeklyNgData {
  weekBefore: number;  // 전전주 불량 건수
  lastWeek: number;    // 전주 불량 건수
  thisWeek: number;    // 금주 불량 건수
}

/** 모델별 데이터 */
export interface IndicatorModelData {
  itemCode: string;
  processes: Partial<Record<IndicatorProcessKey, WeeklyNgData>>;
}

/** 주간 범위 */
export interface WeekRange {
  start: string;
  end: string;
}

/** API 응답 */
export interface IndicatorResponse {
  models: IndicatorModelData[];
  weekRanges: {
    weekBefore: WeekRange;
    lastWeek: WeekRange;
    thisWeek: WeekRange;
  };
  thisWeekDays: number;
  lastUpdated: string;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/types.ts
git commit -m "feat(indicator): add type definitions"
```

---

### Task 2: i18n 번역 키 추가

**Files:**
- Modify: `src/i18n/locales/ko.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/vi.ts`

- [ ] **Step 1: ko.ts에 지표 관련 키 추가**

`nav` 섹션에 추가:
```ts
indicator: "지표",
```

`navTooltip` 섹션에 추가:
```ts
indicator: [
  "대상: 모든 공정 (ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET)",
  "내용: 모델별/공정별 주간 불량 건수 비교",
  "기준: 전주 대비 2배 이상 → C급 (불량개선)",
  "주기: 주간 (월요일~일요일)",
],
indicatorStatus: [
  "빨강: 전주 대비 200%↑ 또는 신규 불량 (C급)",
  "노랑: 전주 대비 100~199% (증가)",
  "초록: 전주 대비 100% 미만 (감소)",
  "회색: 불량 없음 (0→0)",
],
```

`pages` 섹션에 추가:
```ts
indicator: {
  title: "CTQ 지표 모니터링",
  weekBefore: "전전주",
  lastWeek: "전주",
  thisWeek: "금주",
  thisWeekDays: "일차",
  model: "모델",
  noData: "해당 기간 불량 데이터가 없습니다.",
  newDefect: "신규",
  refreshBtn: "새로고침",
  weekRange: "주간 범위",
},
```

`pages.home` 섹션에 추가:
```ts
indicatorDesc: "모델별/공정별 주간 불량률 증가 지표. 전전주→전주→금주 비교.",
```

- [ ] **Step 2: en.ts에 동일 키 영어 번역 추가**

nav:
```ts
indicator: "Indicator",
```

navTooltip:
```ts
indicator: [
  "Target: All processes (ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET)",
  "Content: Weekly NG count comparison by model/process",
  "Criteria: 2x or more vs previous week → Grade C",
  "Cycle: Weekly (Monday to Sunday)",
],
indicatorStatus: [
  "Red: 200%+ vs previous week or new defect (Grade C)",
  "Yellow: 100~199% vs previous week (increase)",
  "Green: Under 100% vs previous week (decrease)",
  "Gray: No defects (0→0)",
],
```

pages:
```ts
indicator: {
  title: "CTQ Indicator Monitoring",
  weekBefore: "2 Weeks Ago",
  lastWeek: "Last Week",
  thisWeek: "This Week",
  thisWeekDays: "days",
  model: "Model",
  noData: "No defect data for the period.",
  newDefect: "New",
  refreshBtn: "Refresh",
  weekRange: "Week Range",
},
```

home:
```ts
indicatorDesc: "Weekly NG rate trend by model/process. Compare week-over-week.",
```

- [ ] **Step 3: vi.ts에 동일 키 베트남어 번역 추가**

nav:
```ts
indicator: "Chỉ số",
```

navTooltip:
```ts
indicator: [
  "Đối tượng: Tất cả công đoạn (ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET)",
  "Nội dung: So sánh số lượng NG hàng tuần theo model/công đoạn",
  "Tiêu chí: Gấp 2 lần trở lên so với tuần trước → Cấp C",
  "Chu kỳ: Hàng tuần (Thứ Hai ~ Chủ Nhật)",
],
indicatorStatus: [
  "Đỏ: 200%+ so với tuần trước hoặc lỗi mới (Cấp C)",
  "Vàng: 100~199% so với tuần trước (tăng)",
  "Xanh: Dưới 100% so với tuần trước (giảm)",
  "Xám: Không có lỗi (0→0)",
],
```

pages:
```ts
indicator: {
  title: "Giám sát chỉ số CTQ",
  weekBefore: "2 tuần trước",
  lastWeek: "Tuần trước",
  thisWeek: "Tuần này",
  thisWeekDays: "ngày",
  model: "Model",
  noData: "Không có dữ liệu lỗi trong kỳ.",
  newDefect: "Mới",
  refreshBtn: "Làm mới",
  weekRange: "Phạm vi tuần",
},
```

home:
```ts
indicatorDesc: "Chỉ số tỷ lệ NG hàng tuần theo model/công đoạn. So sánh tuần trước.",
```

- [ ] **Step 4: 커밋**

```bash
git add src/i18n/locales/ko.ts src/i18n/locales/en.ts src/i18n/locales/vi.ts
git commit -m "feat(indicator): add i18n translations for indicator page"
```

---

### Task 3: API 라우트 구현

**Files:**
- Create: `src/app/api/ctq/indicator/route.ts`

**참고 파일:**
- `src/app/api/ctq/accident/route.ts` — 기존 API 패턴 (Promise.all 병렬 조회)
- `src/lib/oracle.ts` — `executeQuery<T>(sql, params)`
- `src/lib/line-filter.ts` — `parseLines(request)`, `buildLineInClause(lines, alias, prefix)`

- [ ] **Step 1: API 라우트 작성**

핵심 로직:
1. `getWeekRanges()` — 현재 날짜 기준 월요일 시작 3주치 범위 계산
2. `PROCESS_CONFIG` — 7개 공정 테이블/컬럼 매핑
3. 7개 테이블 `Promise.all` 병렬 조회
4. 각 쿼리: RAW 테이블 JOIN `IP_PRODUCT_2D_BARCODE` → ITEM_CODE 취득, `CASE WHEN` 3주 분류, GROUP BY
5. 결과 merge → ITEM_CODE별 공정별 WeeklyNgData 구조로 변환
6. 총 불량 건수 내림차순 정렬

SQL 패턴 (공정별 공통):
```sql
SELECT b.ITEM_CODE,
       SUM(CASE WHEN t.INSPECT_DATE >= :wbStart AND t.INSPECT_DATE < :wbEnd THEN 1 ELSE 0 END) AS WEEK_BEFORE,
       SUM(CASE WHEN t.INSPECT_DATE >= :lwStart AND t.INSPECT_DATE < :lwEnd THEN 1 ELSE 0 END) AS LAST_WEEK,
       SUM(CASE WHEN t.INSPECT_DATE >= :twStart AND t.INSPECT_DATE < :twEnd THEN 1 ELSE 0 END) AS THIS_WEEK
FROM {TABLE} t
JOIN IP_PRODUCT_2D_BARCODE b ON b.SERIAL_NO = t.PID
WHERE t.INSPECT_DATE >= :wbStart AND t.INSPECT_DATE < :twEnd
  AND t.INSPECT_RESULT NOT IN ('PASS', 'GOOD', 'OK')
  AND t.LINE_CODE IS NOT NULL
  {lineFilter}
  AND b.ITEM_CODE IS NOT NULL
GROUP BY b.ITEM_CODE
HAVING SUM(1) > 0
```

주간 범위 계산 (JavaScript):
```ts
function getWeekRanges(): { weekBefore, lastWeek, thisWeek, thisWeekDays } {
  const now = new Date();
  // 이번주 월요일 찾기
  const day = now.getDay(); // 0=일, 1=월, ...
  const diffToMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  // 전주, 전전주 월요일
  const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
  const weekBeforeMonday = new Date(thisMonday); weekBeforeMonday.setDate(thisMonday.getDate() - 14);
  const nextMonday = new Date(thisMonday); nextMonday.setDate(thisMonday.getDate() + 7);
  // thisWeekDays = diffToMonday + 1 (월=1, 화=2, ..., 일=7)
  // 날짜를 Oracle VARCHAR 형식 "YYYY/MM/DD HH24:MI:SS"로 변환
}
```

PROCESS_CONFIG:
```ts
const PROCESS_CONFIG = {
  ICT:    { table: "IQ_MACHINE_ICT_SERVER_DATA_RAW",       dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  HIPOT:  { table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW",      dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  FT:     { table: "IQ_MACHINE_FT1_SMPS_DATA_RAW",         dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  BURNIN: { table: "IQ_MACHINE_BURNIN_DATA_RAW",           dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  ATE:    { table: "IQ_MACHINE_ATE_SERVER_DATA_RAW",        dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  IMAGE:  { table: "IQ_MACHINE_INSPECT_DATA_PBA_FT",       dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
  SET:    { table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET",    dateCol: "INSPECT_DATE", pidCol: "PID", resultCol: "INSPECT_RESULT" },
};
```

- [ ] **Step 2: 빌드 확인**

```bash
npx next build
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/ctq/indicator/route.ts
git commit -m "feat(indicator): add API route for weekly NG comparison"
```

---

## Chunk 2: 프론트엔드 (훅 + 테이블 + 페이지 + 네비)

### Task 4: 데이터 fetch 훅

**Files:**
- Create: `src/app/monitoring/indicator/hooks/useIndicator.ts`

**참고:** `src/app/monitoring/accident/hooks/useAccident.ts` 패턴과 유사하지만, 자동 갱신 없이 수동 fetch만 지원.

- [ ] **Step 1: useIndicator 훅 작성**

```ts
/**
 * @file src/app/monitoring/indicator/hooks/useIndicator.ts
 * @description 지표 데이터 fetch 훅 - 수동 새로고침만 지원
 */

import { useState, useCallback } from "react";
import type { IndicatorResponse } from "../types";

export function useIndicator(selectedLines: string[] = []) {
  const [data, setData] = useState<IndicatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const linesParam = selectedLines.length > 0
        ? `?lines=${selectedLines.join(",")}`
        : "";
      const res = await fetch(`/api/ctq/indicator${linesParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: IndicatorResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedLines]);

  return { data, error, loading, fetchData };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/hooks/useIndicator.ts
git commit -m "feat(indicator): add useIndicator fetch hook"
```

---

### Task 5: IndicatorTable 컴포넌트

**Files:**
- Create: `src/app/monitoring/indicator/components/IndicatorTable.tsx`

- [ ] **Step 1: 테이블 컴포넌트 작성**

핵심 로직:
- 공정 키 배열: `["ICT", "HIPOT", "FT", "BURNIN", "ATE", "IMAGE", "SET"]`
- 공정 표시명: `{ ICT: "ICT", HIPOT: "Hi-Pot", FT: "FT", BURNIN: "Burn-In", ATE: "ATE", IMAGE: "IMAGE", SET: "SET" }`
- 2단 헤더: 1행=공정명(colspan=3), 2행=전전주/전주/금주
- 금주 헤더에 `(N일차)` 표시
- 셀 렌더링 함수 `renderCell(current, previous)`:
  - `prev=0, curr=0` → "0" (회색)
  - `prev=0, curr>0` → "N (신규)" (빨강)
  - `prev>0, curr=0` → "0 (0%)" (초록)
  - `prev>0, curr>0` → "N (M%)" + 비율 색상
- 전전주 셀: 기준값, 흰색

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/components/IndicatorTable.tsx
git commit -m "feat(indicator): add IndicatorTable component"
```

---

### Task 6: 지표 페이지

**Files:**
- Create: `src/app/monitoring/indicator/page.tsx`

**참고:** `src/app/monitoring/accident/page.tsx` 패턴과 유사하지만 더 단순 — 롤링/페이징 없이 테이블 1개.

- [ ] **Step 1: 페이지 컴포넌트 작성**

구조:
- header: 제목 + MonitoringNav + 새로고침 버튼 + 갱신시각
- main: 에러/로딩/빈 데이터 처리 + IndicatorTable
- `useEffect`로 초기 1회 fetch + selectedLines 변경 시 재조회

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/indicator/page.tsx
git commit -m "feat(indicator): add indicator page"
```

---

### Task 7: MonitoringNav에 지표 탭 추가

**Files:**
- Modify: `src/app/monitoring/components/MonitoringNav.tsx:28-34`

- [ ] **Step 1: NAV_ITEMS에 지표 추가**

기존 5개 항목 뒤에 추가:
```ts
{ href: "/monitoring/indicator", labelKey: "nav.indicator", tooltipKey: "navTooltip.indicator", statusKey: "navTooltip.indicatorStatus" },
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/monitoring/components/MonitoringNav.tsx
git commit -m "feat(indicator): add indicator tab to MonitoringNav"
```

---

### Task 8: 메인 메뉴에 지표 카드 추가

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 메인 메뉴에 지표 카드 추가**

기존 5개 카드 뒤에 지표 카드 추가:
- href: `/monitoring/indicator`
- title: `t("nav.indicator")`
- description: `t("pages.home.indicatorDesc")`
- 아이콘: 차트/그래프 SVG

- [ ] **Step 2: 빌드 확인**

```bash
npx next build
```

Expected: 빌드 성공, `/monitoring/indicator` 라우트 표시

- [ ] **Step 3: 최종 커밋**

```bash
git add src/app/page.tsx
git commit -m "feat(indicator): add indicator card to home menu"
```
