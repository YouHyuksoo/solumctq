/**
 * @file src/app/monitoring/analysis/page.tsx
 * @description 종합분석 페이지 셸 — 8개 모니터링 요약 + 상세 보고서
 *
 * 초보자 가이드:
 * 1. useAnalysis 훅으로 8개 API 병렬 호출
 * 2. SummaryCards: 요약 카드 8개 + 전체 현황 바
 * 3. DetailReport: 이상 라인 상세 보고서 8섹션
 * 4. 자동 갱신 없음, 수동 새로고침 버튼만 제공
 */

"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n";
import { useLineFilter } from "../contexts/LineFilterContext";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import LanguageSelector from "@/app/components/LanguageSelector";
import SummaryCards from "./components/SummaryCards";
import DetailReport from "./components/DetailReport";
import { useAnalysis } from "./hooks/useAnalysis";

export default function AnalysisPage() {
  const { t } = useLocale();
  const { selectedLines, isInitialized } = useLineFilter();
  const { data, loading, fetchAll } = useAnalysis(selectedLines);

  useEffect(() => {
    if (isInitialized) fetchAll();
  }, [fetchAll, isInitialized]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MonitoringNav />
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* 타이틀 + 새로고침 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{t("pages.analysis.title") as string}</h1>
              <LineSelectButton />
              <LanguageSelector />
              <HeaderActions />
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5.1 15A7 7 0 0118.9 9M18.9 15a7 7 0 01-13.8 0" />
            </svg>
            {loading ? (t("common.loading") as string) : (t("common.refresh") as string)}
          </button>
        </div>

        {/* 로딩 스피너 */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
            <span className="w-8 h-8 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
            {t("common.dataLoading") as string}
          </div>
        )}

        {/* 데이터 렌더링 */}
        {data && (
          <>
            <SummaryCards summaries={data.summaries} overall={data.overall} />
            <DetailReport summaries={data.summaries} />
          </>
        )}
      </main>

      {/* 하단 상태바 */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gray-900 border-t border-gray-700 px-6 py-1.5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
            <span>{loading ? (t("common.dataLoading") as string) : (t("common.statusNormal") as string)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {data && (
              <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
