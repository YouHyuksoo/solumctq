/**
 * @file src/app/monitoring/repair-status/components/RepairStatusTable.tsx
 * @description 수리상태 테이블 — 불량 PID별 수리 현황 목록
 *
 * 초보자 가이드:
 * 1. 행=개별 불량 PID 레코드
 * 2. RECEIPT_DEFICIT: 1=입고, 2=불량입고
 * 3. REPAIR_RESULT_CODE: 수리결과
 * 4. QC_INSPECT_HANDLING: 검사처리결과
 */

"use client";

import { useLocale } from "@/i18n";
import type { RepairStatusRow } from "../types";

/** 수리결과에 따른 배지 색상 */
function getRepairBadge(code: string): { color: string; label: string } {
  if (code === "-" || !code) return { color: "bg-gray-600", label: "-" };
  if (code === "OK" || code === "PASS") return { color: "bg-green-600", label: code };
  if (code === "NG" || code === "FAIL") return { color: "bg-red-600", label: code };
  return { color: "bg-yellow-600", label: code };
}

/** 입고구분 표시 */
function getReceiptLabel(code: string, t: (key: string) => unknown): string {
  if (code === "1") return t("pages.repairStatus.receiptNormal") as string;
  if (code === "2") return t("pages.repairStatus.receiptDefect") as string;
  return code;
}

interface Props {
  rows: RepairStatusRow[];
}

export default function RepairStatusTable({ rows }: Props) {
  const { t } = useLocale();

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-20" style={{ boxShadow: "0 2px 0 0 #1f2937" }}>
          <tr className="bg-gray-800">
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.time") as string}
            </th>
            <th className="text-left px-3 py-2 border border-gray-700 bg-gray-800 sticky left-0 z-30">
              PID
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("common.line") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.model") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.receipt") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.location") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.defectPart") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.badReason") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.repairLabel") as string}
            </th>
            <th className="text-center px-3 py-2 border border-gray-700 bg-gray-800">
              {t("table.handling") as string}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const repairBadge = getRepairBadge(row.repairResultCode);
            return (
              <tr key={idx} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.qcDate}
                </td>
                <td className="px-3 py-1.5 font-mono text-gray-200 whitespace-nowrap border border-gray-800 sticky left-0 bg-gray-950 z-10">
                  {row.pid}
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.lineName}
                  <span className="ml-1 text-xs text-gray-500">({row.lineCode})</span>
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.modelName}
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 whitespace-nowrap">
                  <span className={row.receiptDeficit === "2" ? "text-red-400 font-bold" : "text-gray-400"}>
                    {getReceiptLabel(row.receiptDeficit, t)}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300">
                  {row.locationCode}
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.defectItemCode}
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.badReasonName !== "-" ? row.badReasonName : row.badReasonCode}
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${repairBadge.color}`}>
                    {repairBadge.label}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center border border-gray-800 text-gray-300 whitespace-nowrap">
                  {row.qcInspectHandling}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
