/**
 * @file src/app/monitoring/open-short/components/OpenShortLineCard.tsx
 * @description 공용부품 Open/Short 라인 카드
 */

"use client";

import type { OpenShortLineCardData, OpenShortGrade } from "../types";

const GRADE_STYLES: Record<OpenShortGrade, { card: string; badge: string; text: string }> = {
  B: {
    card: "border-orange-500 bg-orange-950/30",
    badge: "bg-orange-600 text-white",
    text: "출하중지",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
    text: "Running",
  },
};

export default function OpenShortLineCard({ line }: { line: OpenShortLineCardData }) {
  const style = GRADE_STYLES[line.overallGrade];

  return (
    <div className={`rounded-lg border-2 ${style.card} p-0 overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2 bg-black/40">
        <div>
          <span className="text-sm text-gray-400">Line: </span>
          <span className="font-bold text-white">{line.lineName}</span>
          <span className="ml-2 text-xs text-gray-500">({line.lineCode})</span>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-bold ${style.badge}`}>
          {style.text}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/30 text-gray-400 text-xs">
            <th className="text-left px-3 py-1.5">부품</th>
            <th className="text-center px-3 py-1.5 w-20">유형</th>
            <th className="text-center px-3 py-1.5 w-16">건수</th>
          </tr>
        </thead>
        <tbody>
          {line.defects.map((d, i) => (
            <tr key={`${d.defectItem}-${d.badReasonCode}-${i}`} className="border-t border-gray-800">
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap">
                {d.defectItem}
              </td>
              <td className="px-3 py-1.5 text-center">
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  d.defectType === "SHORT" ? "bg-red-900/60 text-red-300" : "bg-blue-900/60 text-blue-300"
                }`}>
                  {d.defectType}
                </span>
              </td>
              <td className="px-3 py-1.5 text-center">
                <span className={`font-bold ${d.count >= 2 ? "text-orange-400" : "text-gray-400"}`}>
                  {d.count}
                </span>
              </td>
            </tr>
          ))}
          {line.defects.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-3 text-center text-gray-600 text-xs">
                금일 불량 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
