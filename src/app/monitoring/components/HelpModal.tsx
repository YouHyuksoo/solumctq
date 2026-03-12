/**
 * @file src/app/monitoring/components/HelpModal.tsx
 * @description 도움말 모달 — 각 페이지의 판정 기준/상태 표시 안내
 *
 * 초보자 가이드:
 * 1. pageKey로 navTooltip에서 해당 페이지 도움말 가져옴
 * 2. 판정 기준 + 상태 표시 안내 2섹션 표시
 * 3. 다국어 지원 (ko/en/vi)
 */

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n";

type PageKey =
  | "repeatability"
  | "nonConsecutive"
  | "accident"
  | "material"
  | "openShort"
  | "indicator"
  | "fpy"
  | "equipment";

const STATUS_KEY_MAP: Record<PageKey, string> = {
  repeatability: "repeatabilityStatus",
  nonConsecutive: "nonConsecutiveStatus",
  accident: "accidentStatus",
  material: "materialStatus",
  openShort: "openShortStatus",
  indicator: "indicatorStatus",
  fpy: "fpyStatus",
  equipment: "equipmentStatus",
};

export default function HelpModal({ pageKey }: { pageKey: PageKey }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const criteria = t(`navTooltip.${pageKey}`) as unknown as readonly string[];
  const statusKey = STATUS_KEY_MAP[pageKey];
  const statusGuide = t(`navTooltip.${statusKey}`) as unknown as readonly string[];

  if (!criteria || !Array.isArray(criteria)) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        title={t("navTooltip.criteria") as string}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("navTooltip.criteria") as string}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 판정 기준 */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-2">{t("navTooltip.criteria") as string}</h3>
                <ul className="space-y-1.5">
                  {criteria.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-gray-600 mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 상태 표시 안내 */}
              {Array.isArray(statusGuide) && statusGuide.length > 0 && (
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">{t("navTooltip.statusGuide") as string}</h3>
                  <ul className="space-y-1.5">
                    {statusGuide.map((item, i) => {
                      const colorClass = getStatusColor(item);
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${colorClass}`} />
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t border-gray-800 text-right">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                {t("table.close") as string}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/** 상태 텍스트에서 색상 추출 */
function getStatusColor(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("빨강") || lower.includes("red") || lower.includes("đỏ") || lower.includes("a급") || lower.includes("grade a") || lower.includes("cấp a")) return "bg-red-500";
  if (lower.includes("노랑") || lower.includes("yellow") || lower.includes("vàng") || lower.includes("b급") || lower.includes("grade b") || lower.includes("cấp b") || lower.includes("ng")) return "bg-yellow-500";
  if (lower.includes("초록") || lower.includes("green") || lower.includes("xanh")) return "bg-green-500";
  if (lower.includes("보라") || lower.includes("purple") || lower.includes("tím") || lower.includes("c급") || lower.includes("grade c") || lower.includes("cấp c")) return "bg-purple-500";
  return "bg-gray-500";
}
