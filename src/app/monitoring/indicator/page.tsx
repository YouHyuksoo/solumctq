/**
 * @file src/app/monitoring/indicator/page.tsx
 * @description CTQ 지표 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. 모델(ITEM_CODE)별 × 공정별 주간/월간 불량 비교 테이블
 * 2. 자동 갱신 없음 — 진입 시 1회 조회 + 수동 새로고침
 * 3. 기존 라인 필터 공유 (LineFilterContext)
 * 4. h-screen flex 레이아웃 — 페이지 스크롤 없이 테이블만 스크롤
 * 5. 주간/월간 토글 버튼으로 점검주기 전환
 */

"use client";

import { useEffect, useState } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useIndicator } from "./hooks/useIndicator";
import type { PeriodType } from "./types";
import IndicatorTable from "./components/IndicatorTable";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import { useLocale } from "@/i18n";

export default function IndicatorPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const { data, error, loading, fetchData } = useIndicator(selectedLines, period);

  /* 초기 로딩 + 라인 필터 변경 시 재조회 */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center">
            <h1
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
            >
              {t("pages.accident.title") as string}
            </h1>
            <LineSelectButton />
          </div>
          <div className="flex flex-col items-end gap-1">
            {data && data.models.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{t(`pages.indicator.${period === "monthly" ? "monthBefore" : "weekBefore"}`) as string}: {data.weekRanges.weekBefore.start}~{data.weekRanges.weekBefore.end}</span>
                <span>{t(`pages.indicator.${period === "monthly" ? "lastMonth" : "lastWeek"}`) as string}: {data.weekRanges.lastWeek.start}~{data.weekRanges.lastWeek.end}</span>
                <span>{t(`pages.indicator.${period === "monthly" ? "thisMonth" : "thisWeek"}`) as string}: {data.weekRanges.thisWeek.start}~{data.weekRanges.thisWeek.end} ({data.thisWeekDays}{t(`pages.indicator.${period === "monthly" ? "thisMonthDays" : "thisWeekDays"}`) as string})</span>
              </div>
            )}
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
            {/* 점검주기 토글 */}
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => setPeriod("weekly")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === "weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {t("pages.indicator.periodWeekly") as string}
              </button>
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {t("pages.indicator.periodMonthly") as string}
              </button>
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

      {/* 본문 — 남은 공간 전체 사용, 테이블만 스크롤 */}
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
        {data && data.models.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t("pages.indicator.noData") as string}
          </div>
        )}
        {data && data.models.length > 0 && (
          <IndicatorTable
            models={data.models}
            thisWeekDays={data.thisWeekDays}
            period={period}
          />
        )}
      </main>
    </div>
  );
}
