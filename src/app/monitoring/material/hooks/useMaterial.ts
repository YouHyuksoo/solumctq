/**
 * @file src/app/monitoring/material/hooks/useMaterial.ts
 * @description 원자재 주기별점검 데이터 조회 훅 (수동 새로고침)
 *
 * 초보자 가이드:
 * 1. 자동 갱신 없음 — fetchData 호출 시에만 데이터 조회
 * 2. 페이지에서 버튼 또는 useEffect로 fetchData 호출
 */

import { useState, useCallback } from "react";
import type { MaterialResponse } from "../types";

export function useMaterial(selectedLines: string[] = []) {
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

  return { data, error, loading, fetchData };
}
