/**
 * @file src/app/monitoring/indicator/components/IndicatorTable.tsx
 * @description 지표 테이블 — 모델 × 공정 매트릭스, 월간 전전월/전월 PPM 비교 + 대책서 등록
 *
 * 초보자 가이드:
 * 1. 2단 헤더: 1행=공정명(colspan=2), 2행=전전월 displayLabel / 전월 displayLabel
 * 2. 비율 색상: 200%↑ 빨강, curr=0 초록, 둘 다 0 회색
 * 3. 200% 초과 + 대책서 미등록 → 빨간 [등록] 버튼, 등록 완료 → 초록 OK 뱃지
 * 4. [등록] 클릭 → 인라인 입력, Enter/OK → onRegister, Escape → 취소
 * 5. 공정 사이 굵은 왼쪽 보더로 시각적 구분
 */

"use client";

import { useState } from "react";
import { useLocale } from "@/i18n";
import type {
  IndicatorModelData,
  IndicatorProcessKey,
  MonthlyProcessData,
  MonthRange,
} from "../types";

/** 대상 공정 목록 */
const PROCESS_KEYS: IndicatorProcessKey[] = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

/** 공정 표시명 */
const PROCESS_LABELS: Record<IndicatorProcessKey, string> = {
  ICT: "ICT",
  HIPOT: "Hi-Pot",
  FT: "FT",
  BURNIN: "Burn-In",
  ATE: "ATE",
};

/** 공정 그룹 첫 번째 셀에 왼쪽 굵은 보더 */
const GROUP_BORDER = "border-l-2 border-l-gray-500";

/** PPM 숫자 포맷 (천 단위 콤마) */
function formatPpm(ppm: number): string {
  return ppm.toLocaleString();
}

/** 비율에 따른 색상 클래스 반환 */
function getRatioColor(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return "text-gray-600";
  if (curr === 0) return "text-green-400";
  if (prev === 0) return "text-gray-600";
  const ratio = (curr / prev) * 100;
  if (ratio >= 200) return "text-red-400 font-bold";
  return "text-green-400";
}

/** 200% 이상인지 판단 */
function isOver200(prev: number, curr: number): boolean {
  if (prev <= 0 || curr <= 0) return false;
  return (curr / prev) * 100 >= 200;
}

/** 비율 텍스트 생성 (PPM + 전기 대비 비율) */
function getRatioText(prev: number, curr: number): string {
  if (prev === 0 && curr === 0) return "0";
  if (prev === 0) return "0";
  if (curr === 0) return "0 (0%)";
  const ratio = Math.round((curr / prev) * 100);
  return `${formatPpm(curr)} (${ratio}%)`;
}

interface Props {
  models: IndicatorModelData[];
  monthBefore: MonthRange;
  lastMonth: MonthRange;
  onRegister: (
    targetMonth: string,
    itemCode: string,
    processCode: string,
    countermeasureNo: string
  ) => Promise<void>;
}

export default function IndicatorTable({ models, monthBefore, lastMonth, onRegister }: Props) {
  const { t } = useLocale();

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-separate border-spacing-0">
        {/* 2단 헤더 */}
        <thead className="sticky top-0 z-20" style={{ boxShadow: "0 2px 0 0 #1f2937" }}>
          {/* 1행: 공정명 (colspan=2) */}
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
                colSpan={2}
              >
                {PROCESS_LABELS[key]}{" "}
                <span className="text-gray-400 font-normal text-xs">PPM</span>
              </th>
            ))}
          </tr>
          {/* 2행: 전전월/전월 라벨 */}
          <tr className="text-xs bg-gray-800">
            {PROCESS_KEYS.map((key) => (
              <SubHeaders
                key={key}
                monthBeforeLabel={monthBefore.displayLabel}
                lastMonthLabel={lastMonth.displayLabel}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <ModelRow
              key={model.itemCode}
              model={model}
              lastMonthKey={lastMonth.month}
              onRegister={onRegister}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 공정별 서브헤더 (전전월/전월) */
function SubHeaders({
  monthBeforeLabel,
  lastMonthLabel,
}: {
  monthBeforeLabel: string;
  lastMonthLabel: string;
}) {
  return (
    <>
      <th
        className={`px-1 py-1 border border-gray-700 whitespace-nowrap bg-gray-800 text-gray-400 ${GROUP_BORDER}`}
      >
        {monthBeforeLabel}
      </th>
      <th className="px-1 py-1 border border-gray-700 whitespace-nowrap bg-indigo-900 text-indigo-200">
        {lastMonthLabel}
      </th>
    </>
  );
}

/** 모델 1행 */
function ModelRow({
  model,
  lastMonthKey,
  onRegister,
}: {
  model: IndicatorModelData;
  lastMonthKey: string;
  onRegister: Props["onRegister"];
}) {
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/30">
      <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap border border-gray-800 sticky left-0 bg-gray-950 z-10">
        {model.itemCode}
      </td>
      {PROCESS_KEYS.map((key) => (
        <ProcessCells
          key={key}
          processKey={key}
          itemCode={model.itemCode}
          prev={model.monthBefore[key]}
          curr={model.lastMonth[key]}
          lastMonthKey={lastMonthKey}
          onRegister={onRegister}
        />
      ))}
    </tr>
  );
}

/** 공정별 2셀 (전전월/전월) + 대책서 등록 */
function ProcessCells({
  processKey,
  itemCode,
  prev,
  curr,
  lastMonthKey,
  onRegister,
}: {
  processKey: IndicatorProcessKey;
  itemCode: string;
  prev?: MonthlyProcessData;
  curr?: MonthlyProcessData;
  lastMonthKey: string;
  onRegister: Props["onRegister"];
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const prevPpm = prev?.ppm ?? 0;
  const currPpm = curr?.ppm ?? 0;
  const color = getRatioColor(prevPpm, currPpm);
  const needsAction = isOver200(prevPpm, currPpm);
  const hasCountermeasure = !!curr?.countermeasureNo;

  /** 등록 제출 */
  const handleSubmit = async () => {
    const val = inputVal.trim();
    if (!val) return;
    setSubmitting(true);
    try {
      await onRegister(lastMonthKey, itemCode, processKey, val);
      setEditing(false);
      setInputVal("");
    } finally {
      setSubmitting(false);
    }
  };

  /** 등록 취소 */
  const handleCancel = () => {
    setEditing(false);
    setInputVal("");
  };

  const baseCellClass = "px-2 py-1.5 text-center border border-gray-800";

  return (
    <>
      {/* 전전월: 기준값 */}
      <td
        className={`${baseCellClass} ${GROUP_BORDER} ${
          prevPpm > 0 ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {formatPpm(prevPpm)}
      </td>
      {/* 전월: indigo 배경 + 비율 + 대책서 */}
      <td
        className={`${baseCellClass} whitespace-nowrap bg-indigo-950/60 ${color}`}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{getRatioText(prevPpm, currPpm)}</span>
          {/* 200% 초과 시 대책서 상태 표시 */}
          {needsAction && !hasCountermeasure && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-red-600 hover:bg-red-500 text-white font-medium"
            >
              등록
            </button>
          )}
          {needsAction && hasCountermeasure && (
            <span
              className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-green-700 text-green-100 font-medium"
              title={curr!.countermeasureNo!}
            >
              OK
            </span>
          )}
        </div>
        {/* 인라인 입력 */}
        {editing && (
          <div className="flex items-center gap-1 mt-1">
            <input
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") handleCancel();
              }}
              placeholder="대책서 번호"
              disabled={submitting}
              className="w-20 px-1 py-0.5 text-[11px] rounded bg-gray-900 border border-gray-600 text-gray-200 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-1.5 py-0.5 text-[10px] rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              OK
            </button>
          </div>
        )}
      </td>
    </>
  );
}
