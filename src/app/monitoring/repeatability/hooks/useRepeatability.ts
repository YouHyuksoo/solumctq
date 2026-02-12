/**
 * @file src/app/monitoring/repeatability/hooks/useRepeatability.ts
 * @description 반복성 모니터링 데이터 폴링 훅
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { RepeatabilityResponse } from "../types";

export function useRepeatability(intervalMs = 30000) {
  const [data, setData] = useState<RepeatabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ctq/repeatability", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RepeatabilityResponse = await res.json();
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
    const timer = setInterval(fetchData, intervalMs);
    return () => clearInterval(timer);
  }, [fetchData, intervalMs]);

  return { data, error, loading };
}
