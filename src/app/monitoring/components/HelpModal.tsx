/**
 * @file src/app/monitoring/components/HelpModal.tsx
 * @description 시스템 전체 매뉴얼 모달 — 등급 체계, 메뉴별 기능, 사용법 안내
 *
 * 초보자 가이드:
 * 1. MonitoringNav의 매뉴얼 버튼에서 열림
 * 2. 시스템 개요 → 등급 체계 → 메뉴별 기준/상태 → 사용법 순서
 * 3. navTooltip i18n 데이터를 활용해 메뉴별 상세 기준 표시
 * 4. 다국어 지원 (ko/en/vi)
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

const MENU_SECTIONS: { key: PageKey; navKey: string; statusKey: string }[] = [
  { key: "repeatability", navKey: "nav.repeatability", statusKey: "repeatabilityStatus" },
  { key: "nonConsecutive", navKey: "nav.nonConsecutive", statusKey: "nonConsecutiveStatus" },
  { key: "accident", navKey: "nav.accident", statusKey: "accidentStatus" },
  { key: "material", navKey: "nav.material", statusKey: "materialStatus" },
  { key: "openShort", navKey: "nav.openShort", statusKey: "openShortStatus" },
  { key: "indicator", navKey: "nav.indicator", statusKey: "indicatorStatus" },
  { key: "fpy", navKey: "nav.fpy", statusKey: "fpyStatus" },
  { key: "equipment", navKey: "nav.equipment", statusKey: "equipmentStatus" },
];

export default function SystemManual({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [expandedMenu, setExpandedMenu] = useState<PageKey | null>(null);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {t("manual.title") as string}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 1. 시스템 개요 */}
          <Section title={t("manual.overview") as string} icon="info">
            <p className="text-sm text-gray-300 leading-relaxed">{t("manual.overviewDesc") as string}</p>
            <p className="text-xs text-gray-500 mt-2">{t("manual.shiftTime") as string}</p>
          </Section>

          {/* 2. 등급 체계 */}
          <Section title={t("manual.gradeSystem") as string} icon="shield">
            <div className="space-y-2">
              <GradeBadge color="bg-red-600" text={t("manual.gradeADesc") as string} />
              <GradeBadge color="bg-orange-500" text={t("manual.gradeBDesc") as string} />
              <GradeBadge color="bg-purple-500" text={t("manual.gradeCDesc") as string} />
            </div>
          </Section>

          {/* 3. 메뉴별 기능 안내 */}
          <Section title={t("manual.menuGuide") as string} icon="menu">
            <div className="space-y-1">
              {MENU_SECTIONS.map(({ key, navKey, statusKey }) => {
                const label = t(navKey) as string;
                const criteria = t(`navTooltip.${key}`) as unknown as readonly string[];
                const statusGuide = t(`navTooltip.${statusKey}`) as unknown as readonly string[];
                const isExpanded = expandedMenu === key;

                return (
                  <div key={key} className="border border-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-200">{label}</span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-3">
                        {/* 판정 기준 */}
                        {Array.isArray(criteria) && criteria.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-blue-400 mb-1.5">{t("manual.criteriaLabel") as string}</h4>
                            <ul className="space-y-1">
                              {criteria.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                                  <span className="text-gray-600 mt-0.5 shrink-0">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* 상태 색상 */}
                        {Array.isArray(statusGuide) && statusGuide.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-yellow-400 mb-1.5">{t("manual.statusLabel") as string}</h4>
                            <ul className="space-y-1">
                              {statusGuide.map((item, i) => {
                                const colorClass = getStatusColor(item);
                                return (
                                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                                    <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${colorClass}`} />
                                    {item}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 4. 사용 방법 */}
          <Section title={t("manual.howToUse") as string} icon="play">
            <ul className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="text-sm text-gray-300">
                  {t(`manual.howToUse${n}`) as string}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-3">{t("manual.langSwitch") as string}</p>
          </Section>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            {t("table.close") as string}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const iconPath = {
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    menu: "M4 6h16M4 12h16M4 18h16",
    play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
  }[icon] ?? "";

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
        {title}
      </h3>
      {children}
    </div>
  );
}

function GradeBadge({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`w-3 h-3 rounded mt-0.5 shrink-0 ${color}`} />
      <span className="text-sm text-gray-300">{text}</span>
    </div>
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
