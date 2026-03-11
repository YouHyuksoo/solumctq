/**
 * @file src/app/monitoring/indicator/page.tsx
 * @description CTQ 지표 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. 모델(ITEM_CODE)별 × 공정별 주간 불량 비교 테이블
 * 2. 자동 갱신 없음 — 진입 시 1회 조회 + 수동 새로고침
 * 3. 기존 라인 필터 공유 (LineFilterContext)
 */

"use client";

import { useEffect } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useIndicator } from "./hooks/useIndicator";
import IndicatorTable from "./components/IndicatorTable";
import MonitoringNav from "../components/MonitoringNav";
import { useLocale } from "@/i18n";

export default function IndicatorPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const { data, error, loading, fetchData } = useIndicator(selectedLines);

  /* 초기 로딩 + 라인 필터 변경 시 재조회 */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">
              {t("pages.indicator.title") as string}
            </h1>
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-4">
            {/* 새로고침 버튼 */}
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
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {t("common.dataError") as string}: {error}
          </div>
        )}
        {loading && !data && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t("common.dataLoading") as string}
          </div>
        )}
        {data && data.models.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t("pages.indicator.noData") as string}
          </div>
        )}
        {data && data.models.length > 0 && (
          <div>
            {/* 주간 범위 표시 */}
            <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
              <span>{t("pages.indicator.weekBefore") as string}: {data.weekRanges.weekBefore.start}~{data.weekRanges.weekBefore.end}</span>
              <span>{t("pages.indicator.lastWeek") as string}: {data.weekRanges.lastWeek.start}~{data.weekRanges.lastWeek.end}</span>
              <span>{t("pages.indicator.thisWeek") as string}: {data.weekRanges.thisWeek.start}~{data.weekRanges.thisWeek.end} ({data.thisWeekDays}{t("pages.indicator.thisWeekDays") as string})</span>
            </div>
            <IndicatorTable
              models={data.models}
              thisWeekDays={data.thisWeekDays}
            />
          </div>
        )}
      </main>
    </div>
  );
}
