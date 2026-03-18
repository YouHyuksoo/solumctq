/**
 * @file src/app/monitoring/indicator/components/IndicatorTable.tsx
 * @description 지표 테이블 — 모델 × 공정 매트릭스, 3기간 PPM 비교 (주간/월간)
 *
 * 초보자 가이드:
 * 1. 2단 헤더: 1행=공정명(colspan=3), 2행=전전주/전주/금주 또는 전전월/전월/당월
 * 2. 비율 색상: 200%↑ 빨강, 100~199% 노랑, <100% 초록, 신규 보라, 0→0 회색
 * 3. 공정 사이 굵은 왼쪽 보더로 시각적 구분
 * 4. period prop으로 주간/월간 라벨 전환
 */

"use client";

import { useLocale } from "@/i18n";
import type { IndicatorModelData, IndicatorProcessKey, PeriodType, WeeklyNgData } from "../types";

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
  if (prev === 0 && curr > 0) return "text-violet-400 font-bold";
  if (curr === 0) return "text-green-400";
  const ratio = (curr / prev) * 100;
  if (ratio >= 200) return "text-red-400 font-bold";
  if (ratio >= 100) return "text-yellow-400";
  return "text-green-400";
}

/** PPM 숫자 포맷 (천 단위 콤마) */
function formatPpm(ppm: number): string {
  return ppm.toLocaleString();
}

/** 비율 텍스트 생성 (PPM + 전기 대비 비율) */
function getRatioText(
  prev: number,
  curr: number,
  newLabel: string
): string {
  if (prev === 0 && curr === 0) return "0";
  if (prev === 0 && curr > 0) return `${formatPpm(curr)} (${newLabel})`;
  if (curr === 0) return "0 (0%)";
  const ratio = Math.round((curr / prev) * 100);
  return `${formatPpm(curr)} (${ratio}%)`;
}

/** 공정 그룹 첫 번째 셀(전전주)에 왼쪽 굵은 보더 */
const GROUP_BORDER = "border-l-2 border-l-gray-500";

interface Props {
  models: IndicatorModelData[];
  thisWeekDays: number;
  period: PeriodType;
}

export default function IndicatorTable({ models, thisWeekDays, period }: Props) {
  const { t } = useLocale();
  const newLabel = t("pages.indicator.newDefect") as string;

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-separate border-spacing-0">
        {/* 2단 헤더 */}
        <thead className="sticky top-0 z-20" style={{ boxShadow: "0 2px 0 0 #1f2937" }}>
          <tr className="bg-gray-800">
            <th
              className="text-left px-3 py-2 border border-gray-700 bg-gray-800 sticky left-0 z-30"
              rowSpan={2}
            >
              {t("pages.indicator.model") as string}
            </th>
            {PROCESS_KEYS.map((key) => (
              <th
                key={key}
                className={`text-center px-1 py-1.5 border border-gray-700 bg-gray-800 font-bold ${GROUP_BORDER}`}
                colSpan={3}
              >
                {PROCESS_LABELS[key]}
              </th>
            ))}
          </tr>
          <tr className="text-xs bg-gray-800">
            {PROCESS_KEYS.map((key) => (
              <SubHeaders key={key} thisWeekDays={thisWeekDays} period={period} />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.itemCode} className="border-t border-gray-800 hover:bg-gray-800/30">
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

/** 공정별 서브헤더 (전전주/전주/금주 또는 전전월/전월/당월) */
function SubHeaders({ thisWeekDays, period }: { thisWeekDays: number; period: PeriodType }) {
  const { t } = useLocale();
  const isMonthly = period === "monthly";
  return (
    <>
      <th className={`px-1 py-1 border border-gray-700 whitespace-nowrap bg-gray-800 text-gray-400 ${GROUP_BORDER}`}>
        {t(`pages.indicator.${isMonthly ? "monthBefore" : "weekBefore"}`) as string}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-indigo-900 text-indigo-200">
        {t(`pages.indicator.${isMonthly ? "lastMonth" : "lastWeek"}`) as string}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-teal-900 text-teal-200">
        {t(`pages.indicator.${isMonthly ? "thisMonth" : "thisWeek"}`) as string}
        <span className="text-teal-400/70 ml-0.5">({thisWeekDays}{t(`pages.indicator.${isMonthly ? "thisMonthDays" : "thisWeekDays"}`) as string})</span>
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
      {/* 전전주: 기준값 — 배경 없음 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 ${GROUP_BORDER} ${
        data.weekBefore > 0 ? "text-gray-300" : "text-gray-600"
      }`}>
        {formatPpm(data.weekBefore)}
      </td>
      {/* 전주: indigo 배경 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-indigo-950/60 ${lastWeekColor}`}>
        {getRatioText(data.weekBefore, data.lastWeek, newLabel)}
      </td>
      {/* 금주: teal 배경 */}
      <td className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-teal-950/60 ${thisWeekColor}`}>
        {getRatioText(data.lastWeek, data.thisWeek, newLabel)}
      </td>
    </>
  );
}
