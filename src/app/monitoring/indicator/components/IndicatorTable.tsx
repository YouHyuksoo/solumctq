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

const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

const PROCESS_LABELS: Record<IndicatorProcessKey, string> = {
  ICT: "ICT",
  HIPOT: "Hi-Pot",
  FT: "FT",
  BURNIN: "Burn-In",
  ATE: "ATE",
};

/** PPM이 의미 있으려면 최소 이 건수 이상이어야 함 */
const MIN_SAMPLE_SIZE = 30;

/** 비율에 따른 색상 클래스 반환 */
function getRatioColor(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return "text-gray-600";
  if (prev === 0 && curr > 0) return "text-gray-600";
  if (curr === 0) return "text-green-400";
  const ratio = (curr / prev) * 100;
  if (ratio >= 200) return "text-red-400 font-bold";
  return "text-green-400";
}

/** PPM 숫자 포맷 (천 단위 콤마) */
function formatPpm(ppm: number): string {
  return ppm.toLocaleString();
}

/** PPM 포맷 */
function formatPpmOnly(ppm: number, total: number): string {
  if (total === 0) return "0";
  return ppm.toLocaleString();
}

/** 비율 텍스트 생성 (PPM + 전기 대비 비율) */
function getRatioText(
  prev: number,
  curr: number,
  currTotal: number,
  newLabel: string
): string {
  if (prev === 0 && curr === 0) return "0";
  if (prev === 0 && curr > 0) return "0";
  if (curr === 0) return "0 (0%)";
  const ratio = Math.round((curr / prev) * 100);
  return `${formatPpm(curr)} (${ratio}%)`;
}

/** 소량 모수용 텍스트: NG건/전체건 으로 표시 */
function getSmallSampleText(ppm: number, total: number): string {
  if (total === 0) return "-";
  const ng = Math.round((ppm / 1_000_000) * total);
  return `${ng}/${total}`;
}

/** 공정 그룹 첫 번째 셀(전전주)에 왼쪽 굵은 보더 */
const GROUP_BORDER = "border-l-2 border-l-gray-500";

interface Props {
  models: IndicatorModelData[];
  thisWeekDays: number;
  period: PeriodType;
  includeThisWeek?: boolean;
}

/** 표시 가능한 유효 데이터가 있는 모델만 남김 */
function filterVisibleModels(models: IndicatorModelData[]): IndicatorModelData[] {
  return models.filter((model) => {
    return PROCESS_KEYS.some((key) => {
      const p = model.processes[key];
      if (!p) return false;
      /* 전전기 PPM=0 & 전기 PPM>0 → 0으로 표시되므로 유효 데이터 아님 */
      if (p.weekBefore === 0 && p.lastWeek > 0) return false;
      /* 둘 다 0이면 표시할 게 없음 */
      if (p.weekBefore === 0 && p.lastWeek === 0) return false;
      return true;
    });
  });
}

export default function IndicatorTable({ models, thisWeekDays, period, includeThisWeek = false }: Props) {
  const { t } = useLocale();
  const newLabel = t("pages.indicator.newDefect") as string;
  const visibleModels = filterVisibleModels(models);

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
                colSpan={includeThisWeek ? 3 : 2}
              >
                {PROCESS_LABELS[key]} <span className="text-gray-400 font-normal text-xs">PPM</span>
              </th>
            ))}
          </tr>
          <tr className="text-xs bg-gray-800">
            {PROCESS_KEYS.map((key) => (
              <SubHeaders key={key} thisWeekDays={thisWeekDays} period={period} includeThisWeek={includeThisWeek} />
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleModels.map((model) => (
            <tr key={model.itemCode} className="border-t border-gray-800 hover:bg-gray-800/30">
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap border border-gray-800 sticky left-0 bg-gray-950 z-10">
                {model.itemCode}
              </td>
              {PROCESS_KEYS.map((key) => {
                const d: WeeklyNgData = model.processes[key] ?? {
                  weekBefore: 0, lastWeek: 0, thisWeek: 0,
                  weekBeforeTotal: 0, lastWeekTotal: 0, thisWeekTotal: 0,
                };
                return (
                  <ProcessCells key={key} data={d} newLabel={newLabel} includeThisWeek={includeThisWeek} />
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
function SubHeaders({ thisWeekDays, period, includeThisWeek }: { thisWeekDays: number; period: PeriodType; includeThisWeek: boolean }) {
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
      {includeThisWeek && (
        <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-teal-900 text-teal-200">
          {t(`pages.indicator.${isMonthly ? "thisMonth" : "thisWeek"}`) as string}
          <span className="text-teal-400/70 ml-0.5">({thisWeekDays}{t(`pages.indicator.${isMonthly ? "thisMonthDays" : "thisWeekDays"}`) as string})</span>
        </th>
      )}
    </>
  );
}

/** 소량 모수 여부에 따라 셀 내용 렌더링 */
function PpmCell({
  ppm, total, className, ratioText,
}: {
  ppm: number; total: number; className: string; ratioText?: string;
}) {
  const isSmall = total > 0 && total < MIN_SAMPLE_SIZE;
  if (isSmall) {
    return (
      <td className={`${className} text-orange-400/80 italic`} title={`PPM: ${formatPpm(ppm)} (모수 ${total}건 — 신뢰도 낮음)`}>
        {getSmallSampleText(ppm, total)}
      </td>
    );
  }
  return <td className={className}>{ratioText ?? formatPpmOnly(ppm, total)}</td>;
}

/** 공정별 3셀 (전전주/전주/금주) — 신규(전전기=0 & 전기>0) 공정은 빈 셀 */
function ProcessCells({ data, newLabel, includeThisWeek }: { data: WeeklyNgData; newLabel: string; includeThisWeek: boolean }) {
  const isNew = data.weekBefore === 0 && data.lastWeek > 0;
  const emptyCellBase = "px-2 py-1.5 text-center border border-gray-800 text-gray-700";

  if (isNew) {
    return (
      <>
        <td className={`${emptyCellBase} ${GROUP_BORDER}`}>0</td>
        <td className={`${emptyCellBase} bg-indigo-950/60`}>0</td>
        {includeThisWeek && <td className={`${emptyCellBase} bg-teal-950/60`}>0</td>}
      </>
    );
  }

  const lastWeekColor = getRatioColor(data.weekBefore, data.lastWeek);
  const thisWeekColor = getRatioColor(data.lastWeek, data.thisWeek);

  return (
    <>
      {/* 전전주: 기준값 */}
      <PpmCell
        ppm={data.weekBefore}
        total={data.weekBeforeTotal}
        className={`px-2 py-1.5 text-center border border-gray-800 ${GROUP_BORDER} ${
          data.weekBefore > 0 ? "text-gray-300" : "text-gray-600"
        }`}
      />
      {/* 전주: indigo 배경 */}
      <PpmCell
        ppm={data.lastWeek}
        total={data.lastWeekTotal}
        className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-indigo-950/60 ${lastWeekColor}`}
        ratioText={getRatioText(data.weekBefore, data.lastWeek, data.lastWeekTotal, newLabel)}
      />
      {/* 금주: teal 배경 */}
      {includeThisWeek && (
        <PpmCell
          ppm={data.thisWeek}
          total={data.thisWeekTotal}
          className={`px-2 py-1.5 text-center border border-gray-800 whitespace-nowrap bg-teal-950/60 ${thisWeekColor}`}
          ratioText={getRatioText(data.lastWeek, data.thisWeek, data.thisWeekTotal, newLabel)}
        />
      )}
    </>
  );
}
