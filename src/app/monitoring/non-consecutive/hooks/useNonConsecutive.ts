/**
 * @file src/app/monitoring/non-consecutive/hooks/useNonConsecutive.ts
 * @description B급 비연속 동일위치 불량 데이터 폴링 훅
 */

import { useState, useEffect, useCallback } from "react";
import type { RepeatabilityResponse } from "@/app/monitoring/repeatability/types";

export function useNonConsecutive(intervalMs: number, selectedLines: string[] = []) {
  const [data, setData] = useState<RepeatabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ctq/non-consecutive${linesParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RepeatabilityResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [linesParam]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { data, error, loading };
}
