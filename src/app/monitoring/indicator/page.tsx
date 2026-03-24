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

import { useEffect, useRef, useState } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import { useLineFilter } from "../contexts/LineFilterContext";
import { useIndicator } from "./hooks/useIndicator";
import type { PeriodType } from "./types";
import IndicatorTable from "./components/IndicatorTable";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLocale } from "@/i18n";

export default function IndicatorPage() {
  const { t, dateLocale } = useLocale();
  const { selectedLines, isInitialized } = useLineFilter();
  const [period, setPeriod] = usePersistedState<PeriodType>("indicator-period", "weekly");
  const [minVolume, setMinVolume] = usePersistedState<number>("indicator-minVolume", 200);
  const [showSettings, setShowSettings] = useState(false);
  const [tempVolume, setTempVolume] = useState(String(minVolume));
  const settingsRef = useRef<HTMLDivElement>(null);
  const { data, error, loading, fetchData } = useIndicator(selectedLines, period, minVolume);

  /* 초기 로딩 + 라인 필터 변경 시 재조회 */
  useEffect(() => {
    if (isInitialized) fetchData();
  }, [fetchData, isInitialized]);

  /* 설정 팝오버 외부 클릭 닫기 */
  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

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
            <LanguageSelector />
            <HeaderActions />
          </div>
          <div className="flex flex-col items-end gap-1">
            {data && data.models.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{t(`pages.indicator.${period === "monthly" ? "monthBefore" : "weekBefore"}`) as string}: {data.weekRanges.weekBefore.start}~{data.weekRanges.weekBefore.end}</span>
                <span>{t(`pages.indicator.${period === "monthly" ? "lastMonth" : "lastWeek"}`) as string}: {data.weekRanges.lastWeek.start}~{data.weekRanges.lastWeek.end}</span>
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
            {/* 설정 아이콘 + 팝오버 */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => { setShowSettings(!showSettings); setTempVolume(String(minVolume)); }}
                className={`p-1.5 rounded transition-colors ${showSettings ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"}`}
                title="모수 설정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
                  <div className="text-sm font-medium text-gray-200 mb-3">모수 필터 설정</div>
                  <label className="block text-xs text-gray-400 mb-1">최소 검사 수량 (기본: 200)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tempVolume}
                      onChange={(e) => setTempVolume(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = Number(tempVolume);
                          if (v > 0) { setMinVolume(v); setShowSettings(false); }
                        }
                      }}
                      min={1}
                      className="flex-1 px-2 py-1.5 rounded bg-gray-900 border border-gray-600 text-sm text-gray-200 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => {
                        const v = Number(tempVolume);
                        if (v > 0) { setMinVolume(v); setShowSettings(false); }
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium"
                    >
                      적용
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">검사 수량이 이 값 미만인 모델은 목록에서 제외됩니다</p>
                </div>
              )}
            </div>
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

      {/* 하단 상태바 */}
      <footer className="shrink-0 bg-gray-900 border-t border-gray-700 px-6 py-1.5">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span
              className={`w-2 h-2 rounded-full ${
                loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
              }`}
            />
            <span>{loading ? (t("common.dataLoading") as string) : (t("common.statusNormal") as string)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {data && (
              <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
