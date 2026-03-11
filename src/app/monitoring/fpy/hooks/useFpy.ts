/**
 * @file src/app/monitoring/fpy/hooks/useFpy.ts
 * @description 직행율 데이터 fetch 훅 — 수동 새로고침
 *
 * 초보자 가이드:
 * 1. fetchData() 호출 시 /api/ctq/fpy 에서 데이터 조회
 * 2. 자동 갱신 없음
 */

import { useState, useCallback } from "react";
import type { FpyResponse } from "../types";

export function useFpy(selectedLines: string[] = []) {
  const [data, setData] = useState<FpyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ctq/fpy${linesParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: FpyResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [linesParam]);

  return { data, error, loading, fetchData };
}
