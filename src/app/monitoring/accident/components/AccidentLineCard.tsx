/**
 * @file src/app/monitoring/accident/components/AccidentLineCard.tsx
 * @description 사고성 라인 카드 - HIPOT/BURNIN/ATE 공정별 NG 건수 기반 등급 표시
 */

"use client";

import { useState } from "react";
import type { AccidentLineCardData, AccidentGrade } from "../types";
import NgTooltip from "../../components/NgTooltip";
import NgDetailModal from "../../components/NgDetailModal";
import { useLocale, translateDetail } from "@/i18n";

const GRADE_STYLES: Record<AccidentGrade, { card: string; badge: string }> = {
  A: {
    card: "border-red-500 bg-red-950/30",
    badge: "bg-red-600 text-white",
  },
  B: {
    card: "border-yellow-500 bg-yellow-950/30",
    badge: "bg-yellow-600 text-white",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
  },
};

const ROW_GRADE_STYLES: Record<AccidentGrade, string> = {
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

export default function AccidentLineCard({ line }: { line: AccidentLineCardData }) {
  const { t } = useLocale();
  const style = GRADE_STYLES[line.overallGrade];

  const GRADE_TEXT: Record<AccidentGrade, string> = {
    A: t("grade.lineStop") as string,
    B: t("grade.warning") as string,
    OK: t("grade.running") as string,
  };
  const [tooltip, setTooltip] = useState<{
    process: string;
    pos: { x: number; y: number };
  } | null>(null);
  const [modal, setModal] = useState<{ process: string; label: string } | null>(null);

  const handleMouseEnter = (process: string, e: React.MouseEvent) => {
    setTooltip({ process, pos: { x: e.clientX, y: e.clientY } });
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
              <td className="px-3 py-1.5">
                {p.detail ? (
                  <span className={`font-bold text-xs ${p.grade === "A" ? "text-red-400" : "text-yellow-400"}`}>
                    {translateDetail(p.detail, t)}
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
              <td
                className="px-3 py-1.5 text-center"
                onMouseEnter={(e) => p.ngCount > 0 && p.ngDetails?.length > 0 && handleMouseEnter(p.process, e)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => p.ngCount > 0 && setModal({ process: p.process, label: p.processLabel })}
              >
                {p.ngCount > 0 ? (
                  <span className="text-red-400 font-bold cursor-pointer">{p.ngCount}</span>
                ) : (
                  <span className="text-gray-600">0</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center whitespace-nowrap">
                {p.grade === "A" && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${GRADE_STYLES.A.badge}`}>
                    {t("grade.a") as string}
                  </span>
                )}
                {p.grade === "B" && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${GRADE_STYLES.B.badge}`}>
                    {t("grade.b") as string}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip && (() => {
        const p = line.processes.find((pr) => pr.process === tooltip.process);
        if (!p?.ngDetails?.length) return null;
        return (
          <NgTooltip
            details={p.ngDetails}
            title={`${p.processLabel} ${t("table.recentNgDetail") as string}`}
            totalCount={p.ngCount}
            position={tooltip.pos}
          />
        );
      })()}

      <NgDetailModal
        open={modal !== null}
        title={modal ? `${line.lineName} - ${modal.label} ${t("table.ngAll") as string}` : ""}
        fetchUrl={modal ? `/api/ctq/ng-details?type=${modal.process}&lineCode=${encodeURIComponent(line.lineCode)}` : ""}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
