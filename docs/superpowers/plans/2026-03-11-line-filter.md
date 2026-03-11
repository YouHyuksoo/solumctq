# Line Filter (라인 선택 모달 + 조건 전달) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 모니터링 페이지에 라인 선택 모달을 추가하고, 선택된 라인을 API IN 조건으로 전달하여 필터링된 모니터링 구현

**Architecture:** React Context(LineFilterContext)로 선택 라인 상태를 공유하고 localStorage로 persist. 최초 진입 시 선택된 라인이 없으면 모달을 강제 팝업. 선택된 라인은 query parameter(`?lines=P51,P52`)로 API에 전달되며, 6개 API route 모두 `lines` 파라미터를 받아 SQL WHERE IN 조건에 추가.

**Tech Stack:** Next.js 14 App Router, React Context, localStorage, Oracle DB (oracledb)

**DB 참조:** IP_PRODUCT_LINE 테이블 - LINE_CODE(PK), LINE_NAME, LINE_PRODUCT_DIVISION(그룹핑 기준)

---

## Chunk 1: 인프라 (API + Context + Modal)

### Task 1: 라인 목록 API 생성

**Files:**
- Create: `src/app/api/ctq/lines/route.ts`

- [ ] **Step 1: 라인 목록 API 생성**

`src/app/api/ctq/lines/route.ts` 파일을 생성한다.
IP_PRODUCT_LINE에서 LINE_CODE, LINE_NAME, LINE_PRODUCT_DIVISION을 조회하되,
`*`, `00` 같은 특수코드와 AI 라인(70~92번대)은 제외하고,
LINE_PRODUCT_DIVISION별로 그룹핑하여 응답한다.

```typescript
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
```

- [ ] **Step 2: 개발서버에서 API 응답 확인**

Run: `curl http://localhost:3000/api/ctq/lines`
Expected: `{ "groups": [{ "division": "SMPS", "lines": [...] }, ...] }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ctq/lines/route.ts
git commit -m "feat: add /api/ctq/lines endpoint for line list"
```

---

### Task 2: LineFilterContext 생성

**Files:**
- Create: `src/app/monitoring/contexts/LineFilterContext.tsx`

- [ ] **Step 1: LineFilterContext 생성**

선택된 라인 상태를 관리하고 localStorage에 persist하는 Context를 생성한다.
`isInitialized`는 localStorage에서 로드 완료 여부를, `hasSelection`은 라인이 1개 이상 선택되었는지를 나타낸다.

```typescript
/**
 * @file src/app/monitoring/contexts/LineFilterContext.tsx
 * @description 모니터링 라인 필터 공유 상태 (Context + localStorage persist)
 *
 * 초보자 가이드:
 * 1. **selectedLines**: 선택된 LINE_CODE 배열 (빈 배열 = 미선택 → 모달 강제 팝업)
 * 2. **localStorage**: 'ctq-selected-lines' 키로 persist → 새로고침 유지
 * 3. **isInitialized**: localStorage 로드 완료 여부 (hydration 보호)
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ctq-selected-lines";

interface LineFilterContextType {
  selectedLines: string[];
  setSelectedLines: (lines: string[]) => void;
  isInitialized: boolean;
  hasSelection: boolean;
}

const LineFilterContext = createContext<LineFilterContextType | null>(null);

export function LineFilterProvider({ children }: { children: ReactNode }) {
  const [selectedLines, setSelectedLinesState] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  /* localStorage에서 복원 */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedLinesState(parsed);
        }
      }
    } catch {
      /* 파싱 실패 시 무시 */
    }
    setIsInitialized(true);
  }, []);

  /* 변경 시 localStorage 저장 */
  const setSelectedLines = useCallback((lines: string[]) => {
    setSelectedLinesState(lines);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* 저장 실패 시 무시 */
    }
  }, []);

  return (
    <LineFilterContext.Provider
      value={{
        selectedLines,
        setSelectedLines,
        isInitialized,
        hasSelection: selectedLines.length > 0,
      }}
    >
      {children}
    </LineFilterContext.Provider>
  );
}

export function useLineFilter(): LineFilterContextType {
  const ctx = useContext(LineFilterContext);
  if (!ctx) {
    throw new Error("useLineFilter must be used within LineFilterProvider");
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/monitoring/contexts/LineFilterContext.tsx
git commit -m "feat: add LineFilterContext with localStorage persist"
```

---

### Task 3: LineSelectModal 생성

**Files:**
- Create: `src/app/monitoring/components/LineSelectModal.tsx`

- [ ] **Step 1: LineSelectModal 컴포넌트 생성**

LINE_PRODUCT_DIVISION별 그룹으로 체크박스를 표시하는 모달을 생성한다.
`forced` prop이 true이면 닫기 불가(최초 진입), false이면 닫기 가능(변경 시).

```typescript
/**
 * @file src/app/monitoring/components/LineSelectModal.tsx
 * @description 라인 선택 모달 - 그룹별 체크박스로 모니터링 대상 라인 선택
 *
 * 초보자 가이드:
 * 1. **forced 모드**: 최초 진입 시 닫기 불가, 1개+ 선택 필수
 * 2. **그룹 선택**: LINE_PRODUCT_DIVISION별 전체선택/해제 토글
 * 3. **API 호출**: /api/ctq/lines에서 라인 목록 fetch
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface LineItem {
  lineCode: string;
  lineName: string;
}

interface LineGroup {
  division: string;
  lines: LineItem[];
}

interface LineSelectModalProps {
  open: boolean;
  forced?: boolean;
  initialSelected: string[];
  onApply: (lines: string[]) => void;
  onClose: () => void;
}

export default function LineSelectModal({
  open,
  forced = false,
  initialSelected,
  onApply,
  onClose,
}: LineSelectModalProps) {
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  /* 라인 목록 fetch */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/ctq/lines")
      .then((res) => res.json())
      .then((data) => {
        setGroups(data.groups ?? []);
        setSelected(new Set(initialSelected));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [open, initialSelected]);

  const toggle = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const toggleGroup = useCallback(
    (group: LineGroup) => {
      setSelected((prev) => {
        const next = new Set(prev);
        const allSelected = group.lines.every((l) => next.has(l.lineCode));
        for (const l of group.lines) {
          if (allSelected) next.delete(l.lineCode);
          else next.add(l.lineCode);
        }
        return next;
      });
    },
    []
  );

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    for (const g of groups) {
      for (const l of g.lines) all.add(l.lineCode);
    }
    setSelected(all);
  }, [groups]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleApply = () => {
    if (selected.size === 0) return;
    onApply([...selected].sort());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">모니터링 라인 선택</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {forced
                ? "모니터링할 라인을 1개 이상 선택해주세요"
                : `${selected.size}개 라인 선택됨`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              전체선택
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              전체해제
            </button>
            {!forced && (
              <button
                onClick={onClose}
                className="ml-2 p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              라인 목록 로딩 중...
            </div>
          ) : (
            groups.map((group) => {
              const groupAllSelected = group.lines.every((l) =>
                selected.has(l.lineCode)
              );
              const groupSomeSelected =
                !groupAllSelected &&
                group.lines.some((l) => selected.has(l.lineCode));

              return (
                <div key={group.division} className="space-y-2">
                  {/* 그룹 헤더 */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = groupSomeSelected;
                      }}
                      onChange={() => toggleGroup(group)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-blue-400">
                      {group.division}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({group.lines.filter((l) => selected.has(l.lineCode)).length}/{group.lines.length})
                    </span>
                  </label>

                  {/* 라인 목록 (그리드) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 ml-6">
                    {group.lines.map((line) => (
                      <label
                        key={line.lineCode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors ${
                          selected.has(line.lineCode)
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(line.lineCode)}
                          onChange={() => toggle(line.lineCode)}
                          className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-300 truncate">
                          <span className="text-gray-500 mr-1">{line.lineCode}</span>
                          {line.lineName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
          <span className="text-sm text-gray-400">
            {selected.size}개 라인 선택됨
          </span>
          <div className="flex gap-2">
            {!forced && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                취소
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={selected.size === 0}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                selected.size > 0
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              적용 ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/monitoring/components/LineSelectModal.tsx
git commit -m "feat: add LineSelectModal with group checkboxes"
```

---

### Task 4: monitoring layout.tsx + MonitoringNav 수정

**Files:**
- Create: `src/app/monitoring/layout.tsx`
- Modify: `src/app/monitoring/components/MonitoringNav.tsx`

- [ ] **Step 1: monitoring layout.tsx 생성**

LineFilterProvider로 전체 monitoring 하위 페이지를 감싸고,
`isInitialized && !hasSelection`일 때 LineSelectModal을 강제 팝업한다.

```typescript
/**
 * @file src/app/monitoring/layout.tsx
 * @description 모니터링 레이아웃 - LineFilterProvider 감싸기 + 강제 라인 선택
 *
 * 초보자 가이드:
 * 1. **LineFilterProvider**: 하위 모든 페이지에서 선택 라인 공유
 * 2. **강제 모달**: localStorage에 저장된 라인이 없으면 모달 자동 팝업
 */

"use client";

import { LineFilterProvider, useLineFilter } from "./contexts/LineFilterContext";
import LineSelectModal from "./components/LineSelectModal";

function LineFilterGate({ children }: { children: React.ReactNode }) {
  const { selectedLines, setSelectedLines, isInitialized, hasSelection } =
    useLineFilter();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  return (
    <>
      {!hasSelection && (
        <LineSelectModal
          open={true}
          forced={true}
          initialSelected={[]}
          onApply={(lines) => setSelectedLines(lines)}
          onClose={() => {}}
        />
      )}
      {hasSelection && children}
    </>
  );
}

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LineFilterProvider>
      <LineFilterGate>{children}</LineFilterGate>
    </LineFilterProvider>
  );
}
```

- [ ] **Step 2: MonitoringNav에 필터 아이콘 + 뱃지 추가**

`MonitoringNav.tsx`를 수정하여 네비게이션 오른쪽에 필터 아이콘(깔때기)을 추가한다.
선택된 라인 수를 뱃지로 표시하고, 클릭 시 LineSelectModal을 연다.

```typescript
/**
 * @file src/app/monitoring/components/MonitoringNav.tsx
 * @description CTQ 모니터링 상단 네비게이션 탭 + 라인 필터 아이콘
 *
 * 초보자 가이드:
 * 1. **네비게이션 탭**: 5개 모니터링 페이지 이동
 * 2. **필터 아이콘**: 깔때기 모양, 선택 라인 수 뱃지 표시
 * 3. **클릭**: LineSelectModal 팝업
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLineFilter } from "../contexts/LineFilterContext";
import LineSelectModal from "./LineSelectModal";

const NAV_ITEMS = [
  { href: "/monitoring/repeatability", label: "반복성연속" },
  { href: "/monitoring/non-consecutive", label: "반복성동일" },
  { href: "/monitoring/accident", label: "사고성" },
  { href: "/monitoring/material", label: "원자재동일부품" },
  { href: "/monitoring/open-short", label: "원자재공용부품" },
];

export default function MonitoringNav() {
  const pathname = usePathname();
  const { selectedLines, setSelectedLines } = useLineFilter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <nav className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          );
        })}

        {/* 라인 필터 아이콘 */}
        <button
          onClick={() => setModalOpen(true)}
          className="relative ml-1 p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title={`라인 필터 (${selectedLines.length}개 선택)`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {selectedLines.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {selectedLines.length}
            </span>
          )}
        </button>
      </nav>

      <LineSelectModal
        open={modalOpen}
        forced={false}
        initialSelected={selectedLines}
        onApply={(lines) => {
          setSelectedLines(lines);
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/monitoring/layout.tsx src/app/monitoring/components/MonitoringNav.tsx
git commit -m "feat: add monitoring layout with LineFilterProvider and filter icon in nav"
```

---

## Chunk 2: API + Hook 수정 (조건 전달)

### Task 5: 6개 API route에 lines query parameter 추가

**Files:**
- Modify: `src/app/api/cqt/monitoring/route.ts`
- Modify: `src/app/api/ctq/accident/route.ts`
- Modify: `src/app/api/ctq/repeatability/route.ts`
- Modify: `src/app/api/ctq/non-consecutive/route.ts`
- Modify: `src/app/api/ctq/open-short/route.ts`
- Modify: `src/app/api/ctq/material/route.ts`

모든 API에 동일한 패턴을 적용한다:

1. `request.nextUrl.searchParams.get("lines")` 로 라인 코드 추출
2. 빈 값이면 기존처럼 전체 조회
3. 값이 있으면 SQL WHERE에 `LINE_CODE IN (...)` 조건 추가

- [ ] **Step 1: 공통 유틸 함수 생성 — 라인 필터 SQL 조건 생성기**

`src/lib/line-filter.ts`를 생성하여 라인 필터 관련 공통 로직을 둔다.

```typescript
/**
 * @file src/lib/line-filter.ts
 * @description 라인 필터 SQL 조건 생성 유틸
 *
 * 초보자 가이드:
 * 1. **parseLines**: URL query에서 라인 코드 배열 파싱
 * 2. **buildLineInClause**: IN 조건 SQL + bind params 생성
 */

import { type NextRequest } from "next/server";

/** URL query parameter에서 라인 코드 배열 파싱 */
export function parseLines(request: NextRequest): string[] {
  const linesParam = request.nextUrl.searchParams.get("lines");
  if (!linesParam) return [];
  return linesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * LINE_CODE IN (...) 조건 + bind params 생성
 * @returns { clause, params } — clause가 빈 문자열이면 필터 없음
 */
export function buildLineInClause(
  lines: string[],
  alias: string = "t",
  prefix: string = "ln"
): { clause: string; params: Record<string, string> } {
  if (lines.length === 0) return { clause: "", params: {} };

  const placeholders = lines.map((_, i) => `:${prefix}${i}`).join(",");
  const params: Record<string, string> = {};
  lines.forEach((code, i) => {
    params[`${prefix}${i}`] = code;
  });

  return {
    clause: `AND ${alias}.LINE_CODE IN (${placeholders})`,
    params,
  };
}
```

- [ ] **Step 2: `/api/cqt/monitoring/route.ts` 수정**

`GET()` 함수 시그니처를 `GET(request: NextRequest)`로 변경하고,
`parseLines(request)`로 라인 목록을 파싱하여 `getActiveLines()`에 전달한다.
`getActiveLines()`에서 라인 필터가 있으면 `LINE_PRODUCT_DIVISION IN ('SMPS', '3IN1')` 조건 대신
라인 코드 직접 필터를 사용한다.

변경 포인트:
- `import { type NextRequest } from "next/server";` 추가
- `import { parseLines, buildLineInClause } from "@/lib/line-filter";` 추가
- `GET()` → `GET(request: NextRequest)`
- `getActiveLines(todayStart)` → `getActiveLines(todayStart, lines)`
- `getActiveLines` 함수에 `lines: string[]` 파라미터 추가, lines가 있으면 IN 조건 적용
- `getBulkNgRecords`에도 라인 필터 추가하여 불필요한 데이터 조회 방지

- [ ] **Step 3: `/api/ctq/accident/route.ts` 수정**

변경 포인트:
- `import { type NextRequest } from "next/server";` 추가
- `import { parseLines, buildLineInClause } from "@/lib/line-filter";` 추가
- `GET()` → `GET(request: NextRequest)`
- `getLineSummary()`에 `lineFilter: { clause: string; params: Record<string, string> }` 파라미터 추가
- SQL의 `WHERE` 절에 `${lineFilter.clause}` 추가, params에 `...lineFilter.params` spread

- [ ] **Step 4: `/api/ctq/repeatability/route.ts` 수정**

accident와 동일 패턴:
- `GET(request: NextRequest)`, parseLines, buildLineInClause 추가
- `getLineSummary()`, `getRepeatLocations()`에 lineFilter 전달
- SQL WHERE에 `${lineFilter.clause}` + params spread

- [ ] **Step 5: `/api/ctq/non-consecutive/route.ts` 수정**

동일 패턴 적용:
- `getLineSummary()`, `getNonConsecutiveLocations()`에 lineFilter 전달

- [ ] **Step 6: `/api/ctq/open-short/route.ts` 수정**

동일 패턴 적용:
- 메인 SQL에 `${lineFilter.clause}` 추가

- [ ] **Step 7: `/api/ctq/material/route.ts` 수정**

material은 캐시가 있으므로 주의:
- 라인 필터가 있으면 캐시를 사용하지 않고 직접 DB 조회
- `fetchFromDB(lines: string[])` 파라미터 추가
- SQL WHERE에 `${lineFilter.clause}` 추가

- [ ] **Step 8: Commit**

```bash
git add src/lib/line-filter.ts src/app/api/cqt/monitoring/route.ts src/app/api/ctq/accident/route.ts src/app/api/ctq/repeatability/route.ts src/app/api/ctq/non-consecutive/route.ts src/app/api/ctq/open-short/route.ts src/app/api/ctq/material/route.ts
git commit -m "feat: add lines query parameter to all 6 monitoring APIs"
```

---

### Task 6: 6개 hooks에서 selectedLines 전달

**Files:**
- Modify: `src/app/monitoring/hooks/useMonitoring.ts`
- Modify: `src/app/monitoring/accident/hooks/useAccident.ts`
- Modify: `src/app/monitoring/repeatability/hooks/useRepeatability.ts`
- Modify: `src/app/monitoring/non-consecutive/hooks/useNonConsecutive.ts`
- Modify: `src/app/monitoring/open-short/hooks/useOpenShort.ts`
- Modify: `src/app/monitoring/material/hooks/useMaterial.ts`

모든 hook에 동일 패턴 적용:
1. 두 번째 파라미터로 `selectedLines: string[]` 추가
2. fetch URL에 `?lines=` query parameter 추가
3. `selectedLines`를 useCallback/useEffect 의존성에 추가

- [ ] **Step 1: useMonitoring.ts 수정**

```typescript
// 변경 전
export function useMonitoring(intervalMs = 10000) {
  const fetchData = useCallback(async () => {
    const res = await fetch("/api/cqt/monitoring", { cache: "no-store" });

// 변경 후
export function useMonitoring(intervalMs = 10000, selectedLines: string[] = []) {
  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/cqt/monitoring${linesParam}`, { cache: "no-store" });
```

`useCallback`과 `useEffect`의 의존성 배열에 `linesParam`을 추가한다.

- [ ] **Step 2: useAccident.ts 수정**

동일 패턴: `selectedLines` 파라미터 추가, fetch URL에 linesParam 추가

- [ ] **Step 3: useRepeatability.ts 수정**

동일 패턴

- [ ] **Step 4: useNonConsecutive.ts 수정**

동일 패턴

- [ ] **Step 5: useOpenShort.ts 수정**

동일 패턴

- [ ] **Step 6: useMaterial.ts 수정**

동일 패턴

- [ ] **Step 7: Commit**

```bash
git add src/app/monitoring/hooks/useMonitoring.ts src/app/monitoring/accident/hooks/useAccident.ts src/app/monitoring/repeatability/hooks/useRepeatability.ts src/app/monitoring/non-consecutive/hooks/useNonConsecutive.ts src/app/monitoring/open-short/hooks/useOpenShort.ts src/app/monitoring/material/hooks/useMaterial.ts
git commit -m "feat: pass selectedLines to all monitoring hooks"
```

---

### Task 7: 6개 page.tsx에서 Context 연결

**Files:**
- Modify: `src/app/monitoring/page.tsx`
- Modify: `src/app/monitoring/accident/page.tsx`
- Modify: `src/app/monitoring/repeatability/page.tsx`
- Modify: `src/app/monitoring/non-consecutive/page.tsx`
- Modify: `src/app/monitoring/open-short/page.tsx`
- Modify: `src/app/monitoring/material/page.tsx`

모든 page에 동일 패턴 적용:
1. `import { useLineFilter } from "../contexts/LineFilterContext"` (혹은 상대경로 조정)
2. `const { selectedLines } = useLineFilter();`
3. hook 호출에 `selectedLines` 전달: 예) `useAccident(monitorInterval, selectedLines)`

- [ ] **Step 1: monitoring/page.tsx 수정**

```typescript
// 추가
import { useLineFilter } from "./contexts/LineFilterContext";

// 컴포넌트 내부
const { selectedLines } = useLineFilter();
const { data, error, loading } = useMonitoring(monitorInterval, selectedLines);
```

- [ ] **Step 2: accident/page.tsx 수정**

```typescript
import { useLineFilter } from "../contexts/LineFilterContext";
const { selectedLines } = useLineFilter();
const { data, error, loading } = useAccident(monitorInterval, selectedLines);
```

- [ ] **Step 3: repeatability/page.tsx 수정**

동일 패턴

- [ ] **Step 4: non-consecutive/page.tsx 수정**

동일 패턴

- [ ] **Step 5: open-short/page.tsx 수정**

동일 패턴

- [ ] **Step 6: material/page.tsx 수정**

동일 패턴

- [ ] **Step 7: Commit**

```bash
git add src/app/monitoring/page.tsx src/app/monitoring/accident/page.tsx src/app/monitoring/repeatability/page.tsx src/app/monitoring/non-consecutive/page.tsx src/app/monitoring/open-short/page.tsx src/app/monitoring/material/page.tsx
git commit -m "feat: connect LineFilterContext to all monitoring pages"
```

---

## Chunk 3: 통합 테스트

### Task 8: 통합 동작 확인

- [ ] **Step 1: 개발서버 시작**

Run: `npm run dev`

- [ ] **Step 2: 최초 진입 시 모달 강제 팝업 확인**

1. localStorage에서 `ctq-selected-lines` 삭제
2. `/monitoring/repeatability` 접속
3. LineSelectModal이 자동 팝업되고 닫기 불가(X 버튼 없음) 확인
4. 라인 선택 없이 "적용" 버튼 비활성화 확인

- [ ] **Step 3: 라인 선택 후 모니터링 동작 확인**

1. SMPS 그룹 전체선택 → 적용
2. 모니터링 데이터가 선택한 라인만 표시되는지 확인
3. 다른 페이지 이동 시에도 같은 라인 유지 확인

- [ ] **Step 4: 필터 아이콘으로 재선택 확인**

1. MonitoringNav의 필터 아이콘 클릭
2. 기존 선택이 유지된 상태로 모달 열림 확인
3. 라인 변경 후 적용 → 데이터 갱신 확인
4. 취소 시 기존 선택 유지 확인

- [ ] **Step 5: 새로고침 시 localStorage 복원 확인**

1. 라인 선택 상태에서 F5 새로고침
2. 모달 팝업 없이 바로 모니터링 표시 확인
3. DevTools > Application > localStorage에서 `ctq-selected-lines` 값 확인

- [ ] **Step 6: Commit (필요 시 수정사항)**

```bash
git add -A
git commit -m "fix: integration adjustments for line filter"
```
