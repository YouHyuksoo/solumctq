/**
 * @file src/app/monitoring/material/page.tsx
 * @description CTQ 원자재 동일부품 모니터링 페이지
 *
 * 초보자 가이드:
 * 1. **테이블**: IP_PRODUCT_WORK_QC
 * 2. **판정 기준**: 동일 부품 기준
 *    - A급: 일 3건+ NG
 *    - C급: 90일 누적 3건+ NG → 불량개선
 * 3. **30초 갱신, 10초 롤링** (설정 변경 가능)
 */

"use client";

import { useLineFilter } from "../contexts/LineFilterContext";
import { useMaterial } from "./hooks/useMaterial";
import { useAutoRolling } from "../hooks/useAutoRolling";
import { usePersistedState } from "../hooks/usePersistedState";
import MaterialLineCard from "./components/MaterialLineCard";
import SettingsPanel from "../components/SettingsPanel";
import MonitoringNav from "../components/MonitoringNav";
import { useLocale } from "@/i18n";

const ITEMS_PER_PAGE = 9;

export default function MaterialPage() {
  const [monitorInterval, setMonitorInterval] = usePersistedState("ctq-monitor-interval", 30000);
  const [rollingInterval, setRollingInterval] = usePersistedState("ctq-rolling-interval", 10000);
  const [rollingEnabled, setRollingEnabled] = usePersistedState("ctq-rolling-enabled", true);

  const { t, dateLocale } = useLocale();
  const { selectedLines } = useLineFilter();
  const { data, error, loading } = useMaterial(monitorInterval, selectedLines);

  const totalItems = data?.lines.length ?? 0;
  const { currentPage, totalPages, startIdx, endIdx, progress, setCurrentPage } =
    useAutoRolling({
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      intervalMs: rollingInterval,
      enabled: rollingEnabled,
    });

  const visibleLines = data?.lines.slice(startIdx, endIdx) ?? [];
  const aCount = data?.lines.filter((l) => l.overallGrade === "A").length ?? 0;
  const cCount = data?.lines.filter((l) => l.overallGrade === "C").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">
              {t("pages.material.title") as string}
            </h1>
            <MonitoringNav />
          </div>
          <div className="flex items-center gap-4">
            {data && data.lines.length > 0 && (
              <>
                <SummaryBadge label={t("pages.material.gradeALabel") as string} count={aCount} color="bg-red-600" />
                <SummaryBadge label={t("pages.material.gradeCLabel") as string} count={cCount} color="bg-purple-600" />
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 ml-4">
              {data && (
                <span>{t("common.refresh") as string}: {new Date(data.lastUpdated).toLocaleTimeString(dateLocale)}</span>
              )}
              <span
                className={`w-2 h-2 rounded-full ${
                  loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}
              />
            </div>
            <SettingsPanel
              monitorInterval={monitorInterval}
              rollingInterval={rollingInterval}
              rollingEnabled={rollingEnabled}
              onMonitorIntervalChange={setMonitorInterval}
              onRollingIntervalChange={setRollingInterval}
              onRollingEnabledChange={setRollingEnabled}
            />
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
        {data && data.lines.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t("common.noActiveLines") as string}
          </div>
        )}
        {data && data.lines.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleLines.map((line) => (
                <MaterialLineCard key={line.lineCode} line={line} />
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
