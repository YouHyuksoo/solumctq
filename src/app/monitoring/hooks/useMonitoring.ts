/**
 * @file src/app/monitoring/hooks/useMonitoring.ts
 * @description 모니터링 데이터 폴링 훅 (10초 간격)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { MonitoringResponse } from "../types";

export function useMonitoring(intervalMs = 10000) {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/cqt/monitoring", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MonitoringResponse = await res.json();
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
