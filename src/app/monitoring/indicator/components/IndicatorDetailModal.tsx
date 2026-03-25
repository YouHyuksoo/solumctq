/**
 * @file src/app/monitoring/indicator/components/IndicatorDetailModal.tsx
 * @description 지표 불량 상세 모달 — OK 클릭 시 IP_PRODUCT_WORK_QC 이력 조회
 *
 * 초보자 가이드:
 * 1. 대책서 등록 완료(OK) 셀 클릭 시 해당 모델+월의 불량 이력 표시
 * 2. /api/ctq/indicator/details 호출 (month + itemCode)
 * 3. 모든 코드는 F_GET_BASECODE로 명칭 변환되어 표시
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface DetailRecord {
  qcDate: string;
  serialNo: string;
  modelName: string;
  workstageName: string;
  receiptName: string;
  qcResultName: string;
  repairResultName: string;
  locationCode: string;
  defectItemCode: string;
  handlingName: string;
  badReasonName: string;
  badPhenomenon: string;
}

interface Props {
  open: boolean;
  month: string;
  itemCode: string;
  processCode: string;
  processLabel: string;
  countermeasureNo: string;
  onClose: () => void;
  onUpdate: (countermeasureNo: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function IndicatorDetailModal({
  open, month, itemCode, processCode, processLabel, countermeasureNo, onClose, onUpdate, onDelete,
}: Props) {
  const [records, setRecords] = useState<DetailRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(countermeasureNo);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !month || !itemCode) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ month, itemCode });
    fetch(`/api/ctq/indicator/details?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [open, month, itemCode]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  if (!open) return null;

  const COLUMNS = [
    { key: "qcDate", label: "일시" },
    { key: "serialNo", label: "PID" },
    { key: "modelName", label: "모델" },
    { key: "workstageName", label: "공정" },
    { key: "receiptName", label: "구분" },
    { key: "qcResultName", label: "QC결과" },
    { key: "repairResultName", label: "수리결과" },
    { key: "locationCode", label: "위치" },
    { key: "defectItemCode", label: "불량부품" },
    { key: "handlingName", label: "처리" },
    { key: "badReasonName", label: "불량코드" },
    { key: "badPhenomenon", label: "불량현상" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-6xl max-h-[80vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">불량 상세 이력</h2>
            <div className="flex items-center gap-3 text-base">
              <span className="text-white font-bold text-lg">{itemCode}</span>
              <span className="text-gray-600">|</span>
              <span className="text-cyan-400 font-semibold text-lg">{processLabel}</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-300 font-medium">{month}</span>
              <span className="text-gray-600">|</span>
              <span className="text-sm text-gray-400">
                {loading ? "조회 중..." : `${total}건`}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {!editing ? (
                <>
                  <span className="text-sm text-green-400 font-medium">대책서: {countermeasureNo}</span>
                  <button
                    onClick={() => { setEditing(true); setEditVal(countermeasureNo); }}
                    className="px-2.5 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                  >
                    수정
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("대책서번호를 삭제하시겠습니까?")) return;
                      setSubmitting(true);
                      try { await onDelete(); } finally { setSubmitting(false); }
                    }}
                    disabled={submitting}
                    className="px-2.5 py-1 text-xs rounded bg-red-800 hover:bg-red-700 text-red-200 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </>
              ) : (
                <>
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editVal.trim()) {
                        setSubmitting(true);
                        onUpdate(editVal.trim()).finally(() => { setSubmitting(false); setEditing(false); });
                      }
                      if (e.key === "Escape") setEditing(false);
                    }}
                    disabled={submitting}
                    className="px-3 py-1 text-sm rounded bg-gray-800 border border-gray-600 text-gray-200 focus:outline-none focus:border-blue-500 w-48"
                  />
                  <button
                    onClick={async () => {
                      if (!editVal.trim()) return;
                      setSubmitting(true);
                      try { await onUpdate(editVal.trim()); } finally { setSubmitting(false); setEditing(false); }
                    }}
                    disabled={submitting || !editVal.trim()}
                    className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
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
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">데이터 조회 중...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-400 text-sm">조회 실패: {error}</div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">해당 기간 데이터가 없습니다</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-2 pr-2 w-8">#</th>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="text-left pb-2 pr-2 whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 text-gray-300">
                    <td className="py-1.5 pr-2 text-gray-600">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-mono whitespace-nowrap">{r.qcDate?.slice(5, 16)}</td>
                    <td className="py-1.5 pr-2 font-mono text-gray-400 whitespace-nowrap">{r.serialNo}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.modelName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap text-cyan-300">{r.workstageName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.receiptName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.qcResultName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.repairResultName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap text-blue-300">{r.locationCode}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.defectItemCode}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.handlingName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.badReasonName}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{r.badPhenomenon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
