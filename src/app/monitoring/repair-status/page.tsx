/**
 * @file src/app/monitoring/repair-status/page.tsx
 * @description 수리상태 페이지 — IP_PRODUCT_WORK_QC 당일 불량 PID 수리 현황
 *
 * 초보자 가이드:
 * 1. 당일 불량 감지된 PID의 수리 상태를 목록으로 표시
 * 2. 수동 새로고침 (자동 갱신 없음)
 * 3. h-screen flex 레이아웃 — 테이블만 스크롤
 */

"use client";

import { useEffect, useState } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useRepairStatus } from "./hooks/useRepairStatus";
import RepairStatusTable from "./components/RepairStatusTable";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLocale } from "@/i18n";

export default function RepairStatusPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines, isInitialized } = useLineFilter();
  const [pidInput, setPidInput] = useState("");
  const [pidFilter, setPidFilter] = useState("");
  const { data, error, loading, fetchData } = useRepairStatus(selectedLines, pidFilter);

  useEffect(() => {
    if (isInitialized) fetchData();
  }, [fetchData, isInitialized]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center">
            <h1
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
            >
              {t("pages.repairStatus.title") as string}
            </h1>
            <LineSelectButton />
            <LanguageSelector />
            <HeaderActions />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{t("pages.repairStatus.tableSource") as string}</span>
              <span>{t("pages.repairStatus.periodDesc") as string}</span>
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pidInput}
                onChange={(e) => setPidInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setPidFilter(pidInput); } }}
                placeholder="PID 검색..."
                className="w-56 px-3 py-1.5 rounded bg-gray-900 border border-gray-600 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {pidFilter && (
                <button
                  onClick={() => { setPidInput(""); setPidFilter(""); }}
                  className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-300"
                  title="필터 초기화"
                >
                  ✕
                </button>
              )}
            </div>
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
        {data && data.rows.length === 0 && (
          <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
            <div className="text-center p-12 bg-gray-900/60 border border-gray-700 rounded-2xl max-w-lg">
              <div className="text-6xl mb-5">🔧</div>
              <h2 className="text-2xl font-bold text-gray-200 mb-4">
                {t("pages.repairStatus.title") as string}
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                {t("pages.repairStatus.noData") as string}
              </p>
            </div>
          </div>
        )}
        {data && data.rows.length > 0 && (
          <RepairStatusTable rows={data.rows} />
        )}
      </main>
      <footer className="shrink-0 bg-gray-900 border-t border-gray-700 px-6 py-1.5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            <span>{loading ? (t("common.dataLoading") as string) : (t("common.statusNormal") as string)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {data && (
              <>
                <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
                <span>({data.total}{t("table.cases") as string})</span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
