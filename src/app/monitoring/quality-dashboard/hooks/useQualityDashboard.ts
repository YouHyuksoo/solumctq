/**
 * @file src/app/monitoring/quality-dashboard/hooks/useQualityDashboard.ts
 * @description 품질 분석 대시보드 데이터 조회 훅
 *
 * 초보자 가이드:
 * 1. fetchData() 호출 시 API 1회 조회
 * 2. 자동 갱신 없음 (수동 새로고침)
 */

"use client";

import { useState, useCallback } from "react";
import type { QualityDashboardResponse } from "../types";

export function useQualityDashboard(selectedLines: string[]) {
  const [data, setData] = useState<QualityDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedLines.length > 0) {
        params.set("lines", selectedLines.join(","));
      }
      const res = await fetch(`/api/ctq/quality-dashboard?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: QualityDashboardResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedLines]);

  return { data, error, loading, fetchData };
}
