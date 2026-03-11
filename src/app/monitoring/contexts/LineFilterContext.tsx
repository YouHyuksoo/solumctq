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
