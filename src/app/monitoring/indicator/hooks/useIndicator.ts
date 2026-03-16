/**
 * @file src/app/monitoring/indicator/hooks/useIndicator.ts
 * @description 지표 데이터 fetch 훅 — 수동 새로고침만 지원 (자동 갱신 없음)
 *
 * 초보자 가이드:
 * 1. fetchData()를 호출하면 /api/ctq/indicator에서 데이터 조회
 * 2. selectedLines 변경 시 자동 재조회하지 않음 (페이지에서 useEffect로 처리)
 * 3. period 파라미터로 주간/월간 전환 가능
 */

import { useState, useCallback } from "react";
import type { IndicatorResponse, PeriodType } from "../types";

export function useIndicator(selectedLines: string[] = [], period: PeriodType = "weekly") {
  const [data, setData] = useState<IndicatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLines.length > 0) params.set("lines", selectedLines.join(","));
      if (period === "monthly") params.set("period", "monthly");
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
  }, [selectedLines, period]);

  return { data, error, loading, fetchData };
}
