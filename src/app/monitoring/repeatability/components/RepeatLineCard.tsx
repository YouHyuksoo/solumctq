/**
 * @file src/app/monitoring/repeatability/components/RepeatLineCard.tsx
 * @description 반복성 라인 카드 - A급/B급/OK 공통 사용
 */

"use client";

import type { RepeatLineCardData, RepeatGrade } from "../types";

const GRADE_STYLES: Record<RepeatGrade, { card: string; badge: string; text: string }> = {
  A: {
    card: "border-red-500 bg-red-950/30",
    badge: "bg-red-600 text-white",
    text: "Line Stop",
  },
  B: {
    card: "border-yellow-500 bg-yellow-950/30",
    badge: "bg-yellow-600 text-white",
    text: "Warning",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
    text: "Running",
  },
};

const ROW_GRADE_STYLES: Record<RepeatGrade, string> = {
  A: "bg-red-900/40 text-red-200",
  B: "bg-yellow-900/40 text-yellow-200",
  OK: "",
};

/** "2026/02/12 03:55:23" → "02/12 03:55" */
function formatShortDate(dt: string): string {
  const parts = dt.split(" ");
  if (parts.length < 2) return dt;
  const date = parts[0].slice(5);
  const time = parts[1].slice(0, 5);
  return `${date} ${time}`;
}

export default function RepeatLineCard({ line }: { line: RepeatLineCardData }) {
  const style = GRADE_STYLES[line.overallGrade];

  return (
    <div className={`rounded-lg border-2 ${style.card} p-0 overflow-hidden`}>
      {/* 헤더 */}
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

      {/* 공정 테이블 */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/30 text-gray-400 text-xs">
            <th className="text-left px-3 py-1.5 w-24">공정</th>
            <th className="text-left px-3 py-1.5">상태</th>
            <th className="text-left px-3 py-1.5 w-28">최근 검사</th>
            <th className="text-center px-3 py-1.5 w-14">NG</th>
            <th className="text-center px-3 py-1.5 w-16">등급</th>
          </tr>
        </thead>
        <tbody>
          {line.processes.map((p) => (
            <tr
              key={p.process}
              className={`border-t border-gray-800 ${ROW_GRADE_STYLES[p.grade]}`}
            >
              <td className="px-3 py-1.5 font-medium text-gray-200 whitespace-nowrap">
                {p.processLabel}
              </td>
              <td className="px-3 py-1.5" title={p.detail || ""}>
                {p.detail ? (
                  <span className={`font-bold text-xs ${p.grade === "A" ? "text-red-400" : "text-yellow-400"}`}>
                    {p.detail}
                  </span>
                ) : p.ngCount > 0 ? (
                  <span className="text-yellow-400">NG</span>
                ) : (
                  <span className="text-green-400">OK</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-gray-400 text-xs font-mono whitespace-nowrap">
                {p.lastInspectDate ? formatShortDate(p.lastInspectDate) : "-"}
              </td>
              <td className="px-3 py-1.5 text-center">
                {p.ngCount > 0 ? (
                  <span className="text-red-400 font-bold">{p.ngCount}</span>
                ) : (
                  <span className="text-gray-600">0</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center">
                {p.grade === "A" && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${GRADE_STYLES.A.badge}`}>
                    A급
                  </span>
                )}
                {p.grade === "B" && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${GRADE_STYLES.B.badge}`}>
                    B급
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
