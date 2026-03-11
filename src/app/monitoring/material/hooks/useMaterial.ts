/**
 * @file src/app/monitoring/material/hooks/useMaterial.ts
 * @description 원자재 주기별점검 데이터 폴링 훅
 */

import { useState, useEffect, useCallback } from "react";
import type { MaterialResponse } from "../types";

export function useMaterial(intervalMs: number, selectedLines: string[] = []) {
  const [data, setData] = useState<MaterialResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ctq/material${linesParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MaterialResponse = await res.json();
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
