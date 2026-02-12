/**
 * @file src/app/monitoring/material/components/MaterialLineCard.tsx
 * @description 원자재 동일부품 라인 카드 - 부품별 일/90일 NG 건수 기반 등급 표시
 */

"use client";

import type { MaterialLineCardData, MaterialGrade } from "../types";

const GRADE_STYLES: Record<MaterialGrade, { card: string; badge: string; text: string }> = {
  A: {
    card: "border-red-500 bg-red-950/30",
    badge: "bg-red-600 text-white",
    text: "Line Stop",
  },
  C: {
    card: "border-purple-500 bg-purple-950/30",
    badge: "bg-purple-600 text-white",
    text: "불량개선",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
    text: "Running",
  },
};

export default function MaterialLineCard({ line }: { line: MaterialLineCardData }) {
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
            <th className="text-center px-3 py-1.5 w-16">일 NG</th>
            <th className="text-center px-3 py-1.5 w-20">90일 NG</th>
          </tr>
        </thead>
        <tbody>
          {line.defects.map((d, i) => (
            <tr key={`${d.defectItem}-${i}`} className="border-t border-gray-800">
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap">
                {d.defectItem}
              </td>
              <td className="px-3 py-1.5 text-center">
                {d.dailyCount > 0 ? (
                  <span className={`font-bold ${d.dailyCount >= 3 ? "text-red-400" : "text-yellow-400"}`}>
                    {d.dailyCount}
                  </span>
                ) : (
                  <span className="text-gray-600">0</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center">
                {d.cumulativeCount > 0 ? (
                  <span className={`font-bold ${d.cumulativeCount >= 3 ? "text-orange-400" : "text-yellow-400"}`}>
                    {d.cumulativeCount}
                  </span>
                ) : (
                  <span className="text-gray-600">0</span>
                )}
              </td>
            </tr>
          ))}
          {line.defects.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-3 text-center text-gray-600 text-xs">
                불량 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
