/**
 * @file src/app/monitoring/material/components/MaterialLineCard.tsx
 * @description 원자재 동일부품 라인 카드 - 부품별 일/90일 NG 건수 기반 등급 표시
 */

"use client";

import { useState } from "react";
import type { MaterialLineCardData, MaterialGrade } from "../types";
import NgTooltip from "../../components/NgTooltip";
import NgDetailModal from "../../components/NgDetailModal";
import { useLocale } from "@/i18n";

const GRADE_STYLES: Record<MaterialGrade, { card: string; badge: string }> = {
  A: {
    card: "border-red-500 bg-red-950/30",
    badge: "bg-red-600 text-white",
  },
  C: {
    card: "border-purple-500 bg-purple-950/30",
    badge: "bg-purple-600 text-white",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
  },
};

export default function MaterialLineCard({ line }: { line: MaterialLineCardData }) {
  const { t } = useLocale();
  const style = GRADE_STYLES[line.overallGrade];

  const GRADE_TEXT: Record<MaterialGrade, string> = {
    A: t("grade.lineStop") as string,
    C: t("grade.qualityImprove") as string,
    OK: t("grade.running") as string,
  };
  const [tooltip, setTooltip] = useState<{
    idx: number;
    pos: { x: number; y: number };
  } | null>(null);
  const [modal, setModal] = useState<{ defectItem: string } | null>(null);

  return (
    <div className={`rounded-lg border-2 ${style.card} p-0 overflow-hidden`}>
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

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/30 text-gray-400 text-xs">
            <th className="text-left px-3 py-1.5">{t("table.component") as string}</th>
            <th className="text-center px-3 py-1.5 w-16">{t("table.dailyNg") as string}</th>
            <th className="text-center px-3 py-1.5 w-20">{t("table.cumNg") as string}</th>
          </tr>
        </thead>
        <tbody>
          {line.defects.map((d, i) => (
            <tr
              key={`${d.defectItem}-${i}`}
              className={`border-t border-gray-800 ${d.ngDetails?.length > 0 ? "cursor-pointer" : ""}`}
              onMouseEnter={(e) => d.ngDetails?.length > 0 && setTooltip({ idx: i, pos: { x: e.clientX, y: e.clientY } })}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => d.cumulativeCount > 0 && setModal({ defectItem: d.defectItem })}
            >
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
                {t("table.noDefects") as string}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {tooltip != null && (() => {
        const d = line.defects[tooltip.idx];
        if (!d?.ngDetails?.length) return null;
        return (
          <NgTooltip
            details={d.ngDetails}
            title={`${d.defectItem} ${t("table.ngDetail") as string}`}
            totalCount={d.cumulativeCount}
            position={tooltip.pos}
          />
        );
      })()}

      <NgDetailModal
        open={modal !== null}
        title={modal ? `${line.lineName} - ${modal.defectItem} ${t("table.ngAll") as string}` : ""}
        fetchUrl={modal ? `/api/ctq/ng-details?type=material&lineCode=${encodeURIComponent(line.lineCode)}&defectItem=${encodeURIComponent(modal.defectItem)}` : ""}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
