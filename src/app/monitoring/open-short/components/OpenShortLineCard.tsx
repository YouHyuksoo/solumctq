/**
 * @file src/app/monitoring/open-short/components/OpenShortLineCard.tsx
 * @description 공용부품 Open/Short 라인 카드
 */

"use client";

import { useState } from "react";
import type { OpenShortLineCardData, OpenShortGrade } from "../types";
import NgTooltip from "../../components/NgTooltip";
import NgDetailModal from "../../components/NgDetailModal";
import { useLocale } from "@/i18n";

const GRADE_STYLES: Record<OpenShortGrade, { card: string; badge: string }> = {
  B: {
    card: "border-orange-500 bg-orange-950/30",
    badge: "bg-orange-600 text-white",
  },
  OK: {
    card: "border-gray-700 bg-gray-900/50",
    badge: "bg-green-700 text-white",
  },
};

export default function OpenShortLineCard({ line }: { line: OpenShortLineCardData }) {
  const { t } = useLocale();
  const style = GRADE_STYLES[line.overallGrade];

  const GRADE_TEXT: Record<OpenShortGrade, string> = {
    B: t("grade.shipmentStop") as string,
    OK: t("grade.running") as string,
  };
  const [tooltip, setTooltip] = useState<{
    idx: number;
    pos: { x: number; y: number };
  } | null>(null);
  const [modal, setModal] = useState<{ defectType: string; badReasonCode: string } | null>(null);

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
            <th className="text-center px-3 py-1.5 w-20">{t("table.type") as string}</th>
            <th className="text-center px-3 py-1.5 w-16">{t("table.count") as string}</th>
          </tr>
        </thead>
        <tbody>
          {line.defects.map((d, i) => (
            <tr
              key={`${d.defectItem}-${d.badReasonCode}-${i}`}
              className={`border-t border-gray-800 ${d.ngDetails?.length > 0 ? "cursor-pointer" : ""}`}
              onMouseEnter={(e) => d.ngDetails?.length > 0 && setTooltip({ idx: i, pos: { x: e.clientX, y: e.clientY } })}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => d.count > 0 && setModal({ defectType: d.defectType, badReasonCode: d.badReasonCode })}
            >
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
                {t("table.noDefectsToday") as string}
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
            title={`${d.defectType} ${t("table.ngDetail") as string}`}
            totalCount={d.count}
            position={tooltip.pos}
          />
        );
      })()}

      <NgDetailModal
        open={modal !== null}
        title={modal ? `${line.lineName} - ${modal.defectType} ${t("table.ngAll") as string}` : ""}
        fetchUrl={modal ? `/api/ctq/ng-details?type=open-short&lineCode=${encodeURIComponent(line.lineCode)}&badReasonCode=${encodeURIComponent(modal.badReasonCode)}` : ""}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
