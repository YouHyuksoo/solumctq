/**
 * @file src/app/monitoring/material/page.tsx
 * @description CTQ 원자재 동일부품 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. **테이블**: IP_PRODUCT_WORK_QC
 * 2. **판정 기준**: 동일 부품 기준
 *    - A급: 일 3건+ NG
 *    - C급: 90일 누적 3건+ NG → 불량개선
 * 3. 자동 갱신 (30초 기본, 설정 가능)
 */

"use client";

import { useLineFilter } from "../contexts/LineFilterContext";
import { usePersistedState } from "../hooks/usePersistedState";
import { useAutoRolling } from "../hooks/useAutoRolling";
import { useMaterial } from "./hooks/useMaterial";
import MaterialLineCard from "./components/MaterialLineCard";
import SettingsPanel from "../components/SettingsPanel";
import MonitoringNav from "../components/MonitoringNav";
import HeaderActions from "../components/HeaderActions";
import LineSelectButton from "../components/LineSelectButton";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLocale } from "@/i18n";

const ITEMS_PER_PAGE = 12;

export default function MaterialPage() {
  const [monitorInterval, setMonitorInterval] = usePersistedState("ctq-material-monitor-interval", 600000);
  const [rollingInterval, setRollingInterval] = usePersistedState("ctq-material-rolling-interval", 10000);
  const [rollingEnabled, setRollingEnabled] = usePersistedState("ctq-material-rolling-enabled", true);

  const { t, dateLocale } = useLocale();
  const { selectedLines, isInitialized } = useLineFilter();
  const { data, error, loading } = useMaterial(monitorInterval, selectedLines, isInitialized);

  const totalItems = data?.lines.length ?? 0;
  const { currentPage, totalPages, startIdx, endIdx, progress, setCurrentPage } =
    useAutoRolling({
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      intervalMs: rollingInterval,
      enabled: rollingEnabled,
    });

  const aCount = data?.lines.filter((l) => l.overallGrade === "A").length ?? 0;
  const cCount = data?.lines.filter((l) => l.overallGrade === "C").length ?? 0;
  const sortedLines = [...(data?.lines ?? [])].sort((a, b) => a.lineCode.localeCompare(b.lineCode));
  const visibleLines = sortedLines.slice(startIdx, endIdx);

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
            <SettingsPanel
              monitorInterval={monitorInterval}
              rollingInterval={rollingInterval}
              rollingEnabled={rollingEnabled}
              onMonitorIntervalChange={setMonitorInterval}
              onRollingIntervalChange={setRollingInterval}
              onRollingEnabledChange={setRollingEnabled}
            />
            <HeaderActions />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><span className="text-red-400 font-bold">{t("grade.a") as string}</span>: {t("pages.material.gradeALabel") as string} — {t("table.dailyNg") as string} 3+</span>
              <span><span className="text-purple-400 font-bold">{t("grade.c") as string}</span>: {t("pages.material.gradeCLabel") as string} — 90{t("pages.indicator.thisWeekDays") as string} {t("table.cumNg") as string} 3+</span>
              <span>{t("table.process") as string}: IP_PRODUCT_WORK_QC</span>
            </div>
            <span className="text-xs text-gray-500">Solum Vietnam</span>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-4">
            {data && data.lines.length > 0 && (
              <>
                <SummaryBadge label={t("pages.material.gradeALabel") as string} count={aCount} color="bg-red-600" />
                <SummaryBadge label={t("pages.material.gradeCLabel") as string} count={cCount} color="bg-purple-600" />
              </>
            )}
          </div>
        </div>
        {rollingEnabled && totalPages > 1 && (
          <div className="max-w-[1920px] mx-auto mt-2">
            <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
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
              <div className="text-6xl mb-5">📦</div>
              <h2 className="text-2xl font-bold text-gray-200 mb-4">
                {t("pages.material.title") as string}
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {t("common.noMatchingData") as string}
              </p>
              <div className="text-sm text-gray-400 space-y-3 text-left bg-gray-800/50 rounded-lg p-6">
                <div className="font-bold text-gray-200 text-base mb-2">{t("navTooltip.criteria") as string}</div>
                <p>· <span className="text-red-400 font-bold">{t("grade.a") as string}</span>: {t("pages.material.gradeALabel") as string} — DEFECT_ITEM_CODE 1{t("table.dailyNg") as string} 3+</p>
                <p>· <span className="text-purple-400 font-bold">{t("grade.c") as string}</span>: {t("pages.material.gradeCLabel") as string} — DEFECT_ITEM_CODE {t("table.cumNg") as string} 3+</p>
                <div className="border-t border-gray-700 pt-3 mt-3 text-gray-500">
                  <p>· {t("table.process") as string}: IP_PRODUCT_WORK_QC</p>
                  <p>· {t("grade.a") as string} {t("table.lastInspect") as string}: 08:00 ~ +24h</p>
                  <p>· {t("grade.c") as string} {t("table.lastInspect") as string}: 90d</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {data && data.lines.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {visibleLines.map((line) => (
                <MaterialLineCard key={line.lineCode} line={line} compact />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentPage ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-xs text-gray-500">
                  {currentPage + 1} / {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {/* 하단 상태바 */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gray-900 border-t border-gray-700 px-6 py-1.5">
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
            <span>{t("table.process") as string}: IP_PRODUCT_WORK_QC</span>
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
