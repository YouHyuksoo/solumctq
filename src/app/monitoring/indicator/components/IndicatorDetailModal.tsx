/**
 * @file src/app/monitoring/indicator/components/IndicatorDetailModal.tsx
 * @description 지표 불량 상세 모달 — IQ_DAILY_NOTIFY 이력 조회 + 대책서 수정/삭제
 *
 * 초보자 가이드:
 * 1. OK 클릭 시 해당 모델+월+공정의 IQ_DAILY_NOTIFY 이력 표시
 * 2. 폼 스타일 카드 레이아웃 (레거시 시스템과 유사)
 * 3. 대책서번호 수정/삭제 기능 포함
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface NotifyRecord {
  actionDate: string;
  startTime: string;
  endTime: string;
  lineName: string;
  workstageName: string;
  machineCode: string;
  modelName: string;
  itemCode: string;
  detectLocation: string;
  locationInfo: string;
  serialNo: string;
  grade: string;
  badReasonName: string;
  badDescription: string;
  materialMaker: string;
  inspectBadQty: number;
  inspectQty: number;
  runNo: string;
  notifyStatusName: string;
  completeYn: string;
  completeDate: string;
  inspectCharger: string;
  inspectManager: string;
  departmentName: string;
  countermeasure: string;
  comments: string;
  qcComments: string;
  lineStatusNotify: string;
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

/** 라벨+값 한 쌍 */
function Field({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-gray-500 text-xs whitespace-nowrap min-w-[90px] text-right">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-cyan-300" : "text-gray-200"} break-all`}>
        {value === "-" || value === "" || value === "*" ? <span className="text-gray-600">-</span> : value}
      </span>
    </div>
  );
}

export default function IndicatorDetailModal({
  open, month, itemCode, processCode, processLabel, countermeasureNo, onClose, onUpdate, onDelete,
}: Props) {
  const [records, setRecords] = useState<NotifyRecord[]>([]);
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
    if (processCode) params.set("processCode", processCode);
    fetch(`/api/ctq/indicator/details?${params}`)
      .then((res) => res.json())
      .then((data) => { setRecords(data.records ?? []); setTotal(data.total ?? 0); })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [open, month, itemCode, processCode]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-5xl max-h-[85vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">불량 상세 이력</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-lg">
            <span className="text-white font-bold">{itemCode}</span>
            <span className="text-gray-600">|</span>
            <span className="text-cyan-400 font-semibold">{processLabel}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-300">{month}</span>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-400">{loading ? "조회 중..." : `${total}건`}</span>
          </div>
          {/* 대책서 관리 */}
          <div className="flex items-center gap-3 mt-3">
            {!editing ? (
              <>
                <span className="text-sm text-green-400 font-medium">대책서: {countermeasureNo}</span>
                <button
                  onClick={() => { setEditing(true); setEditVal(countermeasureNo); }}
                  className="px-2.5 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                >수정</button>
                <button
                  onClick={async () => {
                    if (!confirm("대책서번호를 삭제하시겠습니까?")) return;
                    setSubmitting(true);
                    try { await onDelete(); } finally { setSubmitting(false); }
                  }}
                  disabled={submitting}
                  className="px-2.5 py-1 text-xs rounded bg-red-800 hover:bg-red-700 text-red-200 disabled:opacity-50"
                >삭제</button>
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
                >저장</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300">취소</button>
              </>
            )}
          </div>
        </div>

        {/* 본문 — 카드 리스트 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">데이터 조회 중...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-400 text-sm">조회 실패: {error}</div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">해당 기간 데이터가 없습니다</div>
          ) : (
            records.map((r, i) => (
              <div key={i} className="border border-gray-700 rounded-lg bg-gray-800/50 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">#{i + 1}</span>
                  <span className="text-sm font-bold text-yellow-300 font-mono">{r.serialNo}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded font-medium ${
                    r.completeYn === "Y" ? "bg-green-800 text-green-200" : "bg-orange-800 text-orange-200"
                  }`}>
                    {r.completeYn === "Y" ? "완료" : "진행중"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                  <Field label="일자" value={r.actionDate} />
                  <Field label="시작시간" value={r.startTime} />
                  <Field label="종료시간" value={r.endTime} />
                  <Field label="통보상태" value={r.notifyStatusName} />

                  <Field label="라인" value={r.lineName} />
                  <Field label="공정" value={r.workstageName} highlight />
                  <Field label="설비" value={r.machineCode} />
                  <Field label="완료일" value={r.completeDate} />

                  <Field label="모델" value={r.modelName} />
                  <Field label="Item Code" value={r.itemCode} />
                  <Field label="Run No" value={r.runNo} />
                  <Field label="검사담당" value={r.inspectCharger} />

                  <Field label="검출위치" value={r.detectLocation} />
                  <Field label="위치정보" value={r.locationInfo} />
                  <Field label="등급" value={r.grade} />
                  <Field label="검사관리자" value={r.inspectManager} />

                  <Field label="불량코드" value={r.badReasonName} />
                  <Field label="불량설명" value={r.badDescription} />
                  <Field label="불량수량" value={r.inspectBadQty} />
                  <Field label="담당부서" value={r.departmentName} />

                  <Field label="자재업체" value={r.materialMaker} />
                  <Field label="검사수량" value={r.inspectQty} />
                </div>
                {/* 텍스트 영역 */}
                {(r.countermeasure !== "-" || r.comments !== "-" || r.qcComments !== "-") && (
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                    {r.countermeasure !== "-" && (
                      <div>
                        <span className="text-xs text-gray-500">대책서</span>
                        <p className="text-sm text-gray-200 mt-0.5">{r.countermeasure}</p>
                      </div>
                    )}
                    {r.comments !== "-" && (
                      <div>
                        <span className="text-xs text-gray-500">Comments</span>
                        <p className="text-sm text-gray-200 mt-0.5">{r.comments}</p>
                      </div>
                    )}
                    {r.qcComments !== "-" && (
                      <div>
                        <span className="text-xs text-gray-500">QC Comments</span>
                        <p className="text-sm text-gray-200 mt-0.5">{r.qcComments}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-700 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700">닫기</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
