/**
 * @file src/app/monitoring/components/MonitoringNav.tsx
 * @description CTQ 모니터링 상단 네비게이션 탭 + 호버 툴팁
 *
 * 초보자 가이드:
 * 1. **네비게이션 탭**: 9개 모니터링 페이지 이동
 * 2. **호버 툴팁**: 각 메뉴 판정 기준 + 상태 표시 안내
 * 3. 라인 선택은 최상단 헤더의 LineSelectButton으로 분리
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n";

interface NavItem {
  href: string;
  labelKey: string;
  tooltipKey: string;
  statusKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/monitoring/repeatability", labelKey: "nav.repeatability", tooltipKey: "navTooltip.repeatability", statusKey: "navTooltip.repeatabilityStatus" },
  { href: "/monitoring/non-consecutive", labelKey: "nav.nonConsecutive", tooltipKey: "navTooltip.nonConsecutive", statusKey: "navTooltip.nonConsecutiveStatus" },
  { href: "/monitoring/accident", labelKey: "nav.accident", tooltipKey: "navTooltip.accident", statusKey: "navTooltip.accidentStatus" },
  { href: "/monitoring/material", labelKey: "nav.material", tooltipKey: "navTooltip.material", statusKey: "navTooltip.materialStatus" },
  { href: "/monitoring/open-short", labelKey: "nav.openShort", tooltipKey: "navTooltip.openShort", statusKey: "navTooltip.openShortStatus" },
  { href: "/monitoring/indicator", labelKey: "nav.indicator", tooltipKey: "navTooltip.indicator", statusKey: "navTooltip.indicatorStatus" },
  { href: "/monitoring/fpy", labelKey: "nav.fpy", tooltipKey: "navTooltip.fpy", statusKey: "navTooltip.fpyStatus" },
  { href: "/monitoring/equipment", labelKey: "nav.equipment", tooltipKey: "navTooltip.equipment", statusKey: "navTooltip.equipmentStatus" },
  { href: "/monitoring/equipment-history", labelKey: "nav.equipmentHistory", tooltipKey: "navTooltip.equipmentHistory", statusKey: "" },
  { href: "/monitoring/repair-status", labelKey: "nav.repairStatus", tooltipKey: "navTooltip.repairStatus", statusKey: "" },
  { href: "/monitoring/analysis", labelKey: "nav.analysis", tooltipKey: "", statusKey: "" },
];

export default function MonitoringNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <nav className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-1">
      <Link
        href="/"
        className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        title={t("nav.goHome") as string}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      </Link>

      <div className="w-px h-5 bg-gray-700" />

      {NAV_ITEMS.map(({ href, labelKey, tooltipKey, statusKey }, idx) => {
        const active = pathname === href;
        const label = t(labelKey) as string;
        const tooltip = t(tooltipKey) as readonly string[];
        const statusInfo = t(statusKey) as readonly string[];

        return (
          <div
            key={href}
            className="relative"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <Link
              href={href}
              className={`block px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
            {hoveredIdx === idx && tooltipKey && (
              <div className={`absolute top-full mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 z-[9999] pointer-events-none ${idx <= 1 ? "left-0" : idx >= NAV_ITEMS.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
                <div className="text-xs font-bold text-blue-400 mb-1.5">{label} {t("navTooltip.criteria") as string}</div>
                <div className="space-y-1">
                  {tooltip.map((line, i) => (
                    <div key={i} className="text-xs text-gray-300 flex gap-1.5">
                      <span className="text-gray-500 shrink-0">·</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
                {statusInfo && statusInfo.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs font-bold text-yellow-400 mb-1">{t("navTooltip.statusGuide") as string}</div>
                    <div className="space-y-1">
                      {statusInfo.map((line, i) => (
                        <div key={i} className="text-xs flex gap-1.5">
                          <span className="text-gray-500 shrink-0">▸</span>
                          <span className={
                            (line as string).startsWith("A") || (line as string).startsWith("Cấp A") ? "text-red-400" :
                            (line as string).startsWith("B") || (line as string).startsWith("Cấp B") || (line as string).startsWith("Grade B") ? "text-orange-400" :
                            (line as string).startsWith("C") || (line as string).startsWith("Cấp C") || (line as string).startsWith("Grade C") ? "text-purple-400" :
                            (line as string).startsWith("NG") ? "text-yellow-400" :
                            "text-gray-300"
                          }>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
