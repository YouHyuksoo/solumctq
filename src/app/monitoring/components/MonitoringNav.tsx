/**
 * @file src/app/monitoring/components/MonitoringNav.tsx
 * @description CTQ 모니터링 상단 네비게이션 탭 + 라인 필터 아이콘
 *
 * 초보자 가이드:
 * 1. **네비게이션 탭**: 5개 모니터링 페이지 이동
 * 2. **필터 아이콘**: 깔때기 모양, 선택 라인 수 뱃지 표시
 * 3. **클릭**: LineSelectModal 팝업
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLineFilter } from "../contexts/LineFilterContext";
import LineSelectModal from "./LineSelectModal";

const NAV_ITEMS = [
  {
    href: "/monitoring/repeatability",
    label: "반복성연속",
    tooltip: [
      "공정: FT#1, ATE, IMAGE, SET검사",
      "조건: 동일 Location 연속 NG 2건+",
      "판정: A급 (Line Stop)",
      "테이블: 각 공정 RAW + IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~ 익일 08:00",
    ],
  },
  {
    href: "/monitoring/non-consecutive",
    label: "반복성동일",
    tooltip: [
      "공정: FT#1, ATE, IMAGE, SET검사",
      "조건: 동일 Location 2건+ (비연속)",
      "판정: B급 (Warning), A급 제외",
      "테이블: 각 공정 RAW + IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~ 익일 08:00",
    ],
  },
  {
    href: "/monitoring/accident",
    label: "사고성",
    tooltip: [
      "공정: HIPOT, BURN-IN, ATE",
      "HIPOT: NG 1건+ → A급 (Line Stop)",
      "BURNIN/ATE: 2건+ → A급, 1건 → B급",
      "테이블: 각 공정 RAW 테이블",
      "기간: 당일 08:00 ~ 익일 08:00",
    ],
  },
  {
    href: "/monitoring/material",
    label: "원자재동일부품",
    tooltip: [
      "대상: 동일 DEFECT_ITEM_CODE (부품)",
      "A급: 동일 부품 일 3건+ NG",
      "C급: 동일 부품 90일 누적 3건+",
      "테이블: IP_PRODUCT_WORK_QC",
      "기간: A급=당일, C급=90일 누적",
    ],
  },
  {
    href: "/monitoring/open-short",
    label: "원자재공용부품",
    tooltip: [
      "공정: ICT (W090, W430)",
      "대상: OPEN(B2020) / SHORT(B2030)",
      "판정: 동일 불량코드 일 2건+ → B급",
      "테이블: IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~",
    ],
  },
];

export default function MonitoringNav() {
  const pathname = usePathname();
  const { selectedLines, setSelectedLines } = useLineFilter();
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <>
      <nav className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-1">
        {NAV_ITEMS.map(({ href, label, tooltip }, idx) => {
          const active = pathname === href;
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
              {hoveredIdx === idx && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 z-[9999] pointer-events-none">
                  <div className="text-xs font-bold text-blue-400 mb-1.5">{label} 판정 기준</div>
                  <div className="space-y-1">
                    {tooltip.map((line, i) => (
                      <div key={i} className="text-xs text-gray-300 flex gap-1.5">
                        <span className="text-gray-500 shrink-0">·</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 라인 필터 아이콘 */}
        <button
          onClick={() => setModalOpen(true)}
          className="relative ml-1 p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title={`라인 필터 (${selectedLines.length}개 선택)`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {selectedLines.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {selectedLines.length}
            </span>
          )}
        </button>
      </nav>

      <LineSelectModal
        open={modalOpen}
        forced={false}
        initialSelected={selectedLines}
        onApply={(lines) => {
          setSelectedLines(lines);
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
