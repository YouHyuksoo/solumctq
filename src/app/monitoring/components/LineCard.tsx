/**
 * @file src/app/monitoring/components/LineCard.tsx
 * @description 라인별 모니터링 카드 - 공정 상태 테이블 표시
 */

"use client";

import type { LineCardData, AlertGrade } from "../types";
import { useLocale, translateDetail } from "@/i18n";

const GRADE_STYLES: Record<AlertGrade, { card: string; badge: string }> = {
  A: {
    card: "border-red-500 bg-red-950/30",
    badge: "bg-red-600 text-white",
  },
  B: {
    card: "border-yellow-500 bg-yellow-950/20",
    badge: "bg-yellow-500 text-black",
  },
  C: {
    card: "border-orange-400 bg-orange-950/10",
    badge: "bg-orange-500 text-white",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
  },
};

const ROW_GRADE_STYLES: Record<AlertGrade, string> = {
  A: "bg-red-900/40 text-red-200",
  B: "bg-yellow-900/30 text-yellow-200",
  C: "bg-orange-900/20 text-orange-200",
  OK: "",
};

/** "2026/02/12 03:55:23" → "02/12 03:55" */
function formatShortDate(dt: string): string {
  const parts = dt.split(" ");
  if (parts.length < 2) return dt;
  const date = parts[0].slice(5); // "02/12"
  const time = parts[1].slice(0, 5); // "03:55"
  return `${date} ${time}`;
}

export default function LineCard({ line }: { line: LineCardData }) {
  const { t } = useLocale();
  const style = GRADE_STYLES[line.overallGrade];

  const GRADE_TEXT: Record<AlertGrade, string> = {
    A: t("grade.lineStop") as string,
    B: t("grade.shipmentStop") as string,
    C: t("grade.qualityImprove") as string,
    OK: t("grade.running") as string,
  };

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
          {GRADE_TEXT[line.overallGrade]}
        </span>
      </div>

      {/* 공정 테이블 */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/30 text-gray-400 text-xs">
            <th className="text-left px-3 py-1.5 w-24">{t("table.process") as string}</th>
            <th className="text-left px-3 py-1.5 w-32">{t("table.status") as string}</th>
            <th className="text-left px-3 py-1.5 w-28">{t("table.lastInspect") as string}</th>
            <th className="text-center px-3 py-1.5 w-14">NG</th>
            <th className="text-center px-3 py-1.5 w-14">{t("table.pending") as string}</th>
            <th className="text-center px-3 py-1.5 w-20">{t("table.gradeCol") as string}</th>
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
              <td className="px-3 py-1.5" title={translateDetail(p.detail, t) || ""}>
                {p.ngCount > 0 ? (
                  <span className="text-red-400 font-bold">NG</span>
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
                {p.pendingCount > 0 && (
                  <span className="text-blue-400 text-xs">{p.pendingCount}</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center whitespace-nowrap">
                {p.grade !== "OK" && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                      GRADE_STYLES[p.grade].badge
                    }`}
                  >
                    {t(`grade.${p.grade.toLowerCase()}`) as string}
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
