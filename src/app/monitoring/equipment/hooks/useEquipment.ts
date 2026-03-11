/**
 * @file src/app/monitoring/equipment/hooks/useEquipment.ts
 * @description 설비이상 데이터 조회 훅 — 수동 새로고침 전용
 *
 * 초보자 가이드:
 * 1. fetchData() 호출 시 API 1회 조회
 * 2. 자동 갱신 없음 (지표 페이지와 동일 방식)
 */

"use client";

import { useState, useCallback } from "react";
import type { EquipmentResponse } from "../types";

export function useEquipment(selectedLines: string[]) {
  const [data, setData] = useState<EquipmentResponse | null>(null);
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
      const res = await fetch(`/api/ctq/equipment?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: EquipmentResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedLines]);

  return { data, error, loading, fetchData };
}
