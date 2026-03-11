/**
 * @file src/app/monitoring/accident/hooks/useAccident.ts
 * @description 사고성 모니터링 데이터 폴링 훅
 */

import { useState, useEffect, useCallback } from "react";
import type { AccidentResponse } from "../types";

export function useAccident(intervalMs: number, selectedLines: string[] = []) {
  const [data, setData] = useState<AccidentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ctq/accident${linesParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AccidentResponse = await res.json();
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
