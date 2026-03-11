/**
 * @file src/app/monitoring/indicator/hooks/useIndicator.ts
 * @description 지표 데이터 fetch 훅 — 수동 새로고침만 지원 (자동 갱신 없음)
 *
 * 초보자 가이드:
 * 1. fetchData()를 호출하면 /api/ctq/indicator에서 데이터 조회
 * 2. selectedLines 변경 시 자동 재조회하지 않음 (페이지에서 useEffect로 처리)
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
