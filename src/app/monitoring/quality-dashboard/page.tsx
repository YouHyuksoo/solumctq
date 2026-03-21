/**
 * @file src/app/monitoring/quality-dashboard/page.tsx
 * @description 품질 분석 대시보드 페이지 — 사이드바 설정 + 다차원 차트
 *
 * 초보자 가이드:
 * 1. 왼쪽 사이드바: 차트 구성 설정 (레이아웃/높이/팔레트/토글)
 * 2. 오른쪽: Recharts 기반 6종 차트 + 요약 카드
 * 3. h-screen flex 레이아웃 — 차트 영역만 스크롤
 */

"use client";

import { useEffect, useState } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useQualityDashboard } from "./hooks/useQualityDashboard";
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardCharts from "./components/DashboardCharts";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import { useLocale } from "@/i18n";
import { usePersistedState } from "../hooks/usePersistedState";
import type { DashboardSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export default function QualityDashboardPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const { data, error, loading, fetchData } = useQualityDashboard(selectedLines);
  const [settings, setSettings] = usePersistedState<DashboardSettings>("quality-dashboard-settings", DEFAULT_SETTINGS);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <header className="shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-3">
            <LineSelectButton />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {data && (
                <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
              )}
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            </div>
            <HeaderActions />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <DashboardSidebar settings={settings} onChange={setSettings} onRefresh={fetchData} loading={loading} />

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {t("common.dataError") as string}: {error}
            </div>
          </div>
        )}
        {loading && !data && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
            <span className="w-8 h-8 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
            {t("common.dataLoading") as string}
          </div>
        )}
        {data && <DashboardCharts data={data} settings={settings} />}
      </div>
    </div>
  );
}
