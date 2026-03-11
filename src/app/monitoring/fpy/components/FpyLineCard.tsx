/**
 * @file src/app/monitoring/fpy/components/FpyLineCard.tsx
 * @description 직행율 라인 카드 — 공정별 전일/당일 2줄 게이지 비교
 *
 * 초보자 가이드:
 * 1. 라인별 카드에 7개 공정 직행율 표시
 * 2. 각 공정마다 전일(위) / 당일(아래) 2줄 게이지
 * 3. 90% 미만 → 빨간색(A급), 90~95% → 노란색, 95%+ → 초록색
 */

"use client";

import { useLocale } from "@/i18n";
import type { FpyLineData, FpyProcessKey, FpyProcessData, FpyProcessDayData } from "../types";

const PROCESS_KEYS: FpyProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE", "IMAGE", "SET"];

const PROCESS_LABELS: Record<FpyProcessKey, string> = {
  ICT: "ICT",
  HIPOT: "Hi-Pot",
  FT: "FT",
  BURNIN: "Burn-In",
  ATE: "ATE",
  IMAGE: "IMAGE",
  SET: "SET",
};

function getYieldColor(yieldRate: number): { text: string; bar: string } {
  if (yieldRate < 90) return { text: "text-red-400", bar: "bg-red-500" };
  if (yieldRate < 95) return { text: "text-yellow-400", bar: "bg-yellow-500" };
  return { text: "text-green-400", bar: "bg-green-500" };
}

export default function FpyLineCard({ line }: { line: FpyLineData }) {
  const { t } = useLocale();

  const hasAnyProcess = PROCESS_KEYS.some((k) => line.processes[k]);

  return (
    <div className="rounded-lg border-2 border-gray-700 bg-gray-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-600/50">
        <div>
          <span className="text-sm text-gray-400">Line: </span>
          <span className="font-bold text-white text-lg">{line.lineName}</span>
          <span className="ml-2 text-xs text-gray-500">({line.lineCode})</span>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-bold ${
          line.overallGrade === "A" ? "bg-red-600 text-white" : "bg-green-700 text-white"
        }`}>
          {line.overallGrade === "A" ? t("grade.lineStop") as string : "OK"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {!hasAnyProcess && (
          <div className="text-center text-gray-600 text-sm py-4">
            {t("table.noDefects") as string}
          </div>
        )}
        {PROCESS_KEYS.map((key) => {
          const proc = line.processes[key];
          if (!proc) return null;
          return <ProcessRow key={key} processKey={key} data={proc} />;
        })}
      </div>
    </div>
  );
}

function GaugeBar({ data, label, barColorClass }: { data: FpyProcessData; label: string; barColorClass: string }) {
  const color = getYieldColor(data.yield);
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-[10px] text-gray-500 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full ${barColorClass} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(data.yield, 100)}%` }}
        />
        {/* 90% 기준선 */}
        <div className="absolute top-0 bottom-0 border-l border-dashed border-red-500/40" style={{ left: "90%" }} />
      </div>
      <span className={`w-14 text-right text-xs font-bold shrink-0 ${color.text}`}>
        {data.yield.toFixed(1)}%
      </span>
      <span className="w-20 text-right text-[10px] text-gray-500 shrink-0">
        {data.pass}/{data.total}
      </span>
    </div>
  );
}

function ProcessRow({ processKey, data }: { processKey: FpyProcessKey; data: FpyProcessDayData }) {
  const yesterday = data.yesterday;
  const today = data.today;
  if (!yesterday && !today) return null;

  const yieldDiff = yesterday && today ? today.yield - yesterday.yield : null;

  return (
    <div className="flex items-start gap-3">
      <div className="w-14 text-sm font-medium text-gray-300 shrink-0 pt-0.5">
        {PROCESS_LABELS[processKey]}
      </div>
      <div className="flex-1 space-y-1">
        {/* 전일 (위) */}
        {yesterday ? (
          <GaugeBar data={yesterday} label="전일" barColorClass="bg-gray-500" />
        ) : (
          <div className="flex items-center gap-2 h-3">
            <span className="w-7 text-[10px] text-gray-600 shrink-0 text-right">전일</span>
            <span className="text-[10px] text-gray-600">—</span>
          </div>
        )}
        {/* 당일 (아래) */}
        {today ? (
          <GaugeBar data={today} label="당일" barColorClass={getYieldColor(today.yield).bar} />
        ) : (
          <div className="flex items-center gap-2 h-3">
            <span className="w-7 text-[10px] text-gray-600 shrink-0 text-right">당일</span>
            <span className="text-[10px] text-gray-600">— 데이터 없음</span>
          </div>
        )}
      </div>
      {/* 증감 표시 */}
      <div className="w-12 shrink-0 text-right pt-1">
        {yieldDiff !== null ? (
          <span className={`text-xs font-bold ${yieldDiff >= 0 ? "text-green-500" : "text-red-400"}`}>
            {yieldDiff >= 0 ? "▲" : "▼"}{Math.abs(yieldDiff).toFixed(1)}
          </span>
        ) : (
          <span className="text-[10px] text-gray-600" />
        )}
      </div>
    </div>
  );
}
