/**
 * @file src/app/monitoring/indicator/components/IndicatorTable.tsx
 * @description 지표 테이블 — 모델 × 공정 매트릭스, 3주 비교
 *
 * 초보자 가이드:
 * 1. 2단 헤더: 1행=공정명(colspan=3), 2행=전전주/전주/금주
 * 2. 비율 색상: 200%↑ 빨강, 100~199% 노랑, <100% 초록, 0→0 회색
 * 3. 전전주 셀은 기준값 (색상 없음), 전주/금주 셀에 비율 표시
 */

"use client";

import { useLocale } from "@/i18n";
import type { IndicatorModelData, IndicatorProcessKey, WeeklyNgData } from "../types";

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE", "IMAGE", "SET"];

const PROCESS_LABELS: Record<IndicatorProcessKey, string> = {
  ICT: "ICT",
  HIPOT: "Hi-Pot",
  FT: "FT",
  BURNIN: "Burn-In",
  ATE: "ATE",
  IMAGE: "IMAGE",
  SET: "SET",
};

/** 비율에 따른 색상 클래스 반환 */
function getRatioColor(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return "text-gray-600";
  if (prev === 0 && curr > 0) return "text-red-400 font-bold";
  if (curr === 0) return "text-green-400";
  const ratio = (curr / prev) * 100;
  if (ratio >= 200) return "text-red-400 font-bold";
  if (ratio >= 100) return "text-yellow-400";
  return "text-green-400";
}

/** 비율 텍스트 생성 */
function getRatioText(
  prev: number,
  curr: number,
  newLabel: string
): string {
  if (prev === 0 && curr === 0) return "0";
  if (prev === 0 && curr > 0) return `${curr} (${newLabel})`;
  if (curr === 0) return "0 (0%)";
  const ratio = Math.round((curr / prev) * 100);
  return `${curr} (${ratio}%)`;
}

interface Props {
  models: IndicatorModelData[];
  thisWeekDays: number;
}

export default function IndicatorTable({ models, thisWeekDays }: Props) {
  const { t } = useLocale();
  const newLabel = t("pages.indicator.newDefect") as string;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {/* 2단 헤더 */}
        <thead>
          <tr className="bg-gray-900/80">
            <th
              className="text-left px-3 py-2 border border-gray-700 bg-gray-800 sticky left-0 z-10"
              rowSpan={2}
            >
              {t("pages.indicator.model") as string}
            </th>
            {PROCESS_KEYS.map((key) => (
              <th
                key={key}
                className="text-center px-1 py-1.5 border border-gray-700 bg-gray-800"
                colSpan={3}
              >
                {PROCESS_LABELS[key]}
              </th>
            ))}
          </tr>
          <tr className="bg-gray-900/60 text-xs text-gray-400">
            {PROCESS_KEYS.map((key) => (
              <SubHeaders key={key} thisWeekDays={thisWeekDays} />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.itemCode} className="border-t border-gray-800 hover:bg-gray-900/40">
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap border border-gray-800 sticky left-0 bg-gray-950 z-10">
                {model.itemCode}
              </td>
              {PROCESS_KEYS.map((key) => {
                const d: WeeklyNgData = model.processes[key] ?? { weekBefore: 0, lastWeek: 0, thisWeek: 0 };
                return (
                  <ProcessCells key={key} data={d} newLabel={newLabel} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 공정별 서브헤더 (전전주/전주/금주) */
function SubHeaders({ thisWeekDays }: { thisWeekDays: number }) {
  const { t } = useLocale();
  return (
    <>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap">
        {t("pages.indicator.weekBefore") as string}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-gray-600/40">
        {t("pages.indicator.lastWeek") as string}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap">
        {t("pages.indicator.thisWeek") as string}
        <span className="text-gray-500 ml-0.5">({thisWeekDays}{t("pages.indicator.thisWeekDays") as string})</span>
      </th>
    </>
  );
}

/** 공정별 3셀 (전전주/전주/금주) */
function ProcessCells({ data, newLabel }: { data: WeeklyNgData; newLabel: string }) {
  const lastWeekColor = getRatioColor(data.weekBefore, data.lastWeek);
  const thisWeekColor = getRatioColor(data.lastWeek, data.thisWeek);

  return (
    <>
      {/* 전전주: 기준값 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 ${
        data.weekBefore > 0 ? "text-gray-300" : "text-gray-600"
      }`}>
        {data.weekBefore}
      </td>
      {/* 전주: 전전주 대비 — 배경 구분 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-gray-700/40 ${lastWeekColor}`}>
        {getRatioText(data.weekBefore, data.lastWeek, newLabel)}
      </td>
      {/* 금주: 전주 대비 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap ${thisWeekColor}`}>
        {getRatioText(data.lastWeek, data.thisWeek, newLabel)}
      </td>
    </>
  );
}
