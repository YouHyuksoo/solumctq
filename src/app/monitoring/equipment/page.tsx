/**
 * @file src/app/monitoring/equipment/page.tsx
 * @description 설비이상 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. 라인별 × 공정별 일일 정지시간 매트릭스
 * 2. 60분 이상 정지 → C급 (불량개선)
 * 3. 수동 새로고침 (자동 갱신 없음)
 * 4. h-screen flex 레이아웃 — 테이블만 스크롤
 */

"use client";

import { useEffect } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useEquipment } from "./hooks/useEquipment";
import EquipmentTable from "./components/EquipmentTable";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import { useLocale } from "@/i18n";

export default function EquipmentPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const { data, error, loading, fetchData } = useEquipment(selectedLines);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <h1
            className="text-4xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
          >
            {t("pages.accident.title") as string}
          </h1>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{t("table.process") as string}: ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET</span>
              <span><span className="text-purple-400 font-bold">{t("grade.c") as string}</span>: {t("pages.equipment.gradeDesc") as string}</span>
            </div>
            <span className="text-xs text-gray-500">Solum Vietnam</span>
          </div>
        </div>
      </div>
      <header className="shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  {t("common.dataLoading") as string}
                </span>
              ) : (
                t("pages.indicator.refreshBtn") as string
              )}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {data && (
                <span>
                  {t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}
                </span>
              )}
              <span
                className={`w-2 h-2 rounded-full ${
                  loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}
              />
            </div>
            <HeaderActions />
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-[1920px] w-full mx-auto">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {t("common.dataError") as string}: {error}
          </div>
        )}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
            <span className="w-8 h-8 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
            {t("common.dataLoading") as string}
          </div>
        )}
        {data && data.lines.length === 0 && (
          <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
            <div className="text-center p-12 bg-gray-900/60 border border-gray-700 rounded-2xl max-w-lg">
              <div className="text-6xl mb-5">🔧</div>
              <h2 className="text-2xl font-bold text-gray-200 mb-4">
                {t("pages.equipment.title") as string}
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {t("pages.equipment.noData") as string}
              </p>
              <div className="text-sm text-gray-400 space-y-3 text-left bg-gray-800/50 rounded-lg p-6">
                <div className="font-bold text-gray-200 text-base mb-2">{t("navTooltip.criteria") as string}</div>
                <p>· <span className="text-purple-400 font-bold">{t("grade.c") as string}</span>: {t("pages.equipment.gradeDesc") as string}</p>
                <div className="border-t border-gray-700 pt-3 mt-3 text-gray-500">
                  <p>· {t("table.process") as string}: ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET</p>
                  <p>· {t("pages.equipment.tableDesc") as string}</p>
                  <p>· {t("pages.equipment.periodDesc") as string}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {data && data.lines.length > 0 && (
          <EquipmentTable lines={data.lines} />
        )}
      </main>
    </div>
  );
}
