/**
 * @file src/app/monitoring/open-short/hooks/useOpenShort.ts
 * @description 공용부품 Open/Short 데이터 폴링 훅
 */

import { useState, useEffect, useCallback } from "react";
import type { OpenShortResponse } from "../types";

export function useOpenShort(intervalMs: number) {
  const [data, setData] = useState<OpenShortResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ctq/open-short");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: OpenShortResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { data, error, loading };
}
