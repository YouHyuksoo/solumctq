/**
 * @file src/app/monitoring/components/NgDetailModal.tsx
 * @description NG 상세 전체 조회 모달 - 클릭 시 전체 NG 레코드 표시
 *
 * 초보자 가이드:
 * 1. **용도**: 카드 내 NG 항목 클릭 → 전체 NG 레코드 (최대 200건) 조회
 * 2. **API**: /api/ctq/ng-details?type=X&lineCode=Y&... 호출
 * 3. **렌더링**: createPortal로 body에 렌더링하여 overflow 문제 방지
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n";

interface NgRecord {
  time: string;
  pid: string;
  model: string;
  receiptDeficit: string;
  locationCode: string;
  repairResult: string;
  qcHandling: string;
  defectItem: string;
  inspectResult: string;
  badReasonCode: string;
  badReasonName: string;
  workstageName?: string;
  badPhenomenon?: string;
}

interface NgDetailModalProps {
  open: boolean;
  title: string;
  fetchUrl: string;
  onClose: () => void;
}

export default function NgDetailModal({ open, title, fetchUrl, onClose }: NgDetailModalProps) {
  const { t } = useLocale();

  const rdLabel = (v: string) => {
    if (v === "1") return t("table.receipt") as string;
    if (v === "2") return t("table.repairLabel") as string;
    return v || "-";
  };
  const [records, setRecords] = useState<NgRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !fetchUrl) return;
    setLoading(true);
    setError(null);
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [open, fetchUrl]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div
      data-ng-modal="open"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-5xl max-h-[80vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? t("table.searching") as string : `${t("table.totalCount") as string} ${total}${t("table.cases") as string}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              {t("common.dataLoading") as string}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-400 text-sm">
              {t("table.searchFailed") as string}: {error}
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              {t("table.noNgData") as string}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-2 pr-2 w-8">#</th>
                  <th className="text-left pb-2 pr-2">{t("table.time") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.process") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.model") as string}</th>
                  <th className="text-left pb-2 pr-2">PID</th>
                  <th className="text-left pb-2 pr-2">{t("table.category") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.location") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.defectPart") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.repair") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.handling") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.badReason") as string}</th>
                  <th className="text-left pb-2 pr-2">{t("table.badPhenomenon") as string}</th>
                  <th className="text-left pb-2">{t("table.inspectResult") as string}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 text-gray-300">
                    <td className="py-1.5 pr-2 text-gray-600">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-mono whitespace-nowrap">
                      {r.time?.length > 10 ? r.time.slice(5, 19) : r.time}
                    </td>
                    <td className="py-1.5 pr-2 whitespace-nowrap text-cyan-300">{r.workstageName || "-"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap ">{r.model}</td>
                    <td className="py-1.5 pr-2 font-mono text-gray-400 whitespace-nowrap">{r.pid}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{rdLabel(r.receiptDeficit)}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap text-blue-300 ">{r.locationCode || "-"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap ">{r.defectItem || "-"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.repairResult || "-"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.qcHandling || "-"}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap ">
                      {r.badReasonName && r.badReasonName !== "-" ? r.badReasonName : r.badReasonCode || "-"}
                    </td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.badPhenomenon || "-"}</td>
                    <td className="py-1.5 whitespace-nowrap">
                      {r.inspectResult && r.inspectResult !== "-" ? (
                        <span className="text-red-400 font-medium">{r.inspectResult}</span>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-700 shrink-0">
          <span className="text-xs text-gray-500">
            {!loading && records.length > 0 && `${records.length}${t("table.showing") as string}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            {t("table.close") as string}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
