/**
 * @file src/app/monitoring/page.tsx
 * @description CTQ 모니터링 대시보드 (반복성 + 사고성)
 *
 * 초보자 가이드:
 * 1. **30초 자동갱신**: useMonitoring 훅이 30초마다 API 호출 (설정 변경 가능)
 * 2. **10초 롤링**: 카드 페이지가 10초마다 자동 전환 (설정 변경 가능)
 * 3. **NG 라인 상단 정렬**: A급 → B급 → C급 → OK 순서
 * 4. **카드**: 라인별 5개 공정 (ICT, HIPOT, FT#1, BURN-IN, ATE) 상태 표시
 */

"use client";

import { useState } from "react";
import { useLineFilter } from "./contexts/LineFilterContext";
import { useMonitoring } from "./hooks/useMonitoring";
import { useAutoRolling } from "./hooks/useAutoRolling";
import LineCard from "./components/LineCard";
import SettingsPanel from "./components/SettingsPanel";

const ITEMS_PER_PAGE = 9; // 3열 × 3행

export default function MonitoringPage() {
  const [monitorInterval, setMonitorInterval] = useState(30000);
  const [rollingInterval, setRollingInterval] = useState(10000);
  const [rollingEnabled, setRollingEnabled] = useState(true);

  const { selectedLines } = useLineFilter();
  const { data, error, loading } = useMonitoring(monitorInterval, selectedLines);

  const totalItems = data?.lines.length ?? 0;
  const { currentPage, totalPages, startIdx, endIdx, progress, setCurrentPage } =
    useAutoRolling({
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      intervalMs: rollingInterval,
      enabled: rollingEnabled,
    });

  const visibleLines = data?.lines.slice(startIdx, endIdx) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <h1 className="text-lg font-bold">
            CTQ 모니터링
            <span className="ml-2 text-sm font-normal text-gray-400">
              반복성 / 사고성
            </span>
          </h1>
          <div className="flex items-center gap-4">
            {data && data.lines.length > 0 && (
              <>
                <SummaryBadge
                  label="A급 (Line Stop)"
                  count={data.lines.filter((l) => l.overallGrade === "A").length}
                  color="bg-red-600"
                />
                <SummaryBadge
                  label="B급 (출하중지)"
                  count={data.lines.filter((l) => l.overallGrade === "B").length}
                  color="bg-yellow-500 text-black"
                />
                <SummaryBadge
                  label="정상"
                  count={data.lines.filter((l) => l.overallGrade === "OK").length}
                  color="bg-green-700"
                />
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400 ml-4">
              {data && (
                <span>
                  갱신: {new Date(data.lastUpdated).toLocaleTimeString("ko-KR")}
                </span>
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

        {/* 롤링 프로그레스 바 */}
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

      {/* 본문 */}
      <main className="max-w-[1920px] mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            데이터 조회 오류: {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            데이터 로딩 중...
          </div>
        )}

        {data && data.lines.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            활성 라인이 없습니다.
          </div>
        )}

        {data && data.lines.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleLines.map((line) => (
                <LineCard key={line.lineCode} line={line} />
              ))}
            </div>

            {/* 페이지 인디케이터 */}
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

function SummaryBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>
        {count}
      </span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  );
}
