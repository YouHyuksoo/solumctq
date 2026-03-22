/**
 * @file src/app/monitoring/fpy/page.tsx
 * @description 직행율(First Pass Yield) 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. 라인별 × 공정별 당일 직행율 카드 표시
 * 2. 90% 미만이면 A급 (Line Stop)
 * 3. 수동 새로고침
 */

"use client";

import { useEffect } from "react";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useFpy } from "./hooks/useFpy";
import FpyLineCard from "./components/FpyLineCard";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import { useLocale } from "@/i18n";
import LanguageSelector from "@/app/components/LanguageSelector";

export default function FpyPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const { data, error, loading, fetchData } = useFpy(selectedLines);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aCount = data?.lines.filter((l) => l.overallGrade === "A").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center">
            <h1
              className="text-4xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
            >
              {t("pages.accident.title") as string}
            </h1>
            <LineSelectButton />
            <LanguageSelector />
            <HeaderActions />
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span>{t("table.process") as string}: ICT, Hi-Pot, FT, Burn-In, ATE</span>
              <span className="text-gray-600">|</span>
              <span><span className="text-red-400 font-bold">{t("grade.a") as string}</span>: 당일 직행율 90% 미만</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              <span>직행율 = 제품별 최초검사 PASS수 / 고유제품수 x 100 (재검사 제외)</span>
              <span className="text-gray-600">|</span>
              <span>전일: 10:00~10:00 | 당일: 10:00~익일 10:00 (VN)</span>
            </div>
            {data?.dateRange && (
              <div className="flex items-center gap-3 text-gray-500">
                <span>전일: <span className="text-gray-400">{data.dateRange.yesterday}</span></span>
                <span className="text-gray-600">|</span>
                <span>당일: <span className="text-gray-400">{data.dateRange.today}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-4">
            {data && data.lines.length > 0 && aCount > 0 && (
              <SummaryBadge label={t("pages.fpy.gradeALabel") as string} count={aCount} color="bg-red-600" />
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
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

      <main className="max-w-[1920px] mx-auto px-4 py-2">
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
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
              <div className="text-6xl mb-5">📈</div>
              <h2 className="text-2xl font-bold text-gray-200 mb-4">
                {t("pages.fpy.title") as string}
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {t("pages.fpy.noData") as string}
              </p>
            </div>
          </div>
        )}
        {data && data.lines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {data.lines.map((line) => (
              <FpyLineCard key={line.lineCode} line={line} dateRange={data.dateRange} />
            ))}
          </div>
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
              <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
            )}
            <span>{t("table.process") as string}: ICT, Hi-Pot, FT, Burn-In, ATE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{count}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  );
}
