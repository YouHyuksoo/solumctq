/**
 * @file src/app/monitoring/components/HelpModal.tsx
 * @description 시스템 매뉴얼 모달 — 좌측 사이드바 + 중앙 문서형 스크롤 레이아웃
 *
 * 초보자 가이드:
 * 1. MonitoringNav의 매뉴얼 버튼에서 열림
 * 2. 좌측 사이드바: 9개 페이지 목록 (시스템개요 + 8개 모니터링)
 * 3. 중앙 영역: 선택 페이지의 섹션을 번호 매김하여 렌더링
 * 4. manualData.ts에서 콘텐츠 데이터 import
 */

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n";
import {
  MANUAL_PAGES,
  MANUAL_DATA,
  type ManualPageKey,
  type ManualPageData,
} from "./manualData";

/** 사이드바 라벨 (다국어) */
const SIDEBAR_LABELS: Record<string, Record<ManualPageKey, string>> = {
  ko: { system: "시스템 개요", repeatability: "반복성 (연속)", nonConsecutive: "비연속 불량", accident: "사고성", material: "원자재", openShort: "공용부품", indicator: "지표", fpy: "FPY", equipment: "설비" },
  en: { system: "Overview", repeatability: "Repeat", nonConsecutive: "Non-Consec.", accident: "Accident", material: "Material", openShort: "Open/Short", indicator: "Indicator", fpy: "FPY", equipment: "Equipment" },
  vi: { system: "Tổng quan", repeatability: "Lặp lại", nonConsecutive: "Không liên tiếp", accident: "Sự cố", material: "Nguyên liệu", openShort: "Open/Short", indicator: "Chỉ số", fpy: "FPY", equipment: "Thiết bị" },
};

const SECTION_TITLES: Record<string, string[]> = {
  ko: ["개요", "대상 공정", "판정 기준", "상태 색상", "데이터 흐름", "기간/갱신", "비고"],
  en: ["Overview", "Target Process", "Criteria", "Status Colors", "Data Flow", "Period/Refresh", "Notes"],
  vi: ["Tổng quan", "Công đoạn", "Tiêu chí", "Màu trạng thái", "Luồng dữ liệu", "Thời gian", "Ghi chú"],
};

export default function SystemManual({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useLocale();
  const [activePage, setActivePage] = useState<ManualPageKey>("system");
  const l = (locale === "ko" || locale === "en" || locale === "vi") ? locale : "ko";
  const data = MANUAL_DATA[l]?.[activePage];
  const labels = SIDEBAR_LABELS[l] ?? SIDEBAR_LABELS.ko;
  const secTitles = SECTION_TITLES[l] ?? SECTION_TITLES.ko;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {l === "en" ? "System Manual" : l === "vi" ? "Hướng dẫn hệ thống" : "시스템 사용 설명서"}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문: 사이드바 + 콘텐츠 */}
        <div className="flex flex-1 min-h-0">
          {/* 사이드바 */}
          <nav className="w-[200px] shrink-0 border-r border-gray-800 py-2 overflow-y-auto">
            {MANUAL_PAGES.map((p) => (
              <button key={p.key} onClick={() => setActivePage(p.key)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  activePage === p.key ? "bg-blue-900/50 text-blue-300 border-l-2 border-blue-400" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border-l-2 border-transparent"
                }`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                </svg>
                {labels[p.key]}
              </button>
            ))}
          </nav>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {data && (activePage === "system"
              ? <SystemOverview data={data} secTitles={secTitles} />
              : <MonitoringPage data={data} secTitles={secTitles} />
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-gray-800 text-right shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700">
            {l === "en" ? "Close" : l === "vi" ? "Đóng" : "닫기"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** 번호 매긴 섹션 헤더 */
function SH({ num, title }: { num: number; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-2 pb-1 border-b border-gray-800">
      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{num}</span>
      {title}
    </h3>
  );
}

/** 시스템 개요 페이지 */
function SystemOverview({ data, secTitles }: { data: ManualPageData; secTitles: string[] }) {
  return (
    <>
      <h2 className="text-xl font-bold text-white mb-4">{data.title}</h2>
      {/* 1. 시스템 소개 */}
      <section><SH num={1} title={secTitles[0]} /><p className="text-sm text-gray-300 leading-relaxed">{data.overview}</p></section>
      {/* 2. 등급 체계 */}
      {data.grades && (
        <section>
          <SH num={2} title={secTitles[2]} />
          <table className="w-full text-xs border border-gray-800 rounded overflow-hidden">
            <thead><tr className="bg-gray-800/80 text-gray-300">
              <th className="px-3 py-2 text-left">{secTitles[2] === "Criteria" ? "Grade" : secTitles[2] === "Tiêu chí" ? "Cấp" : "등급"}</th>
              <th className="px-3 py-2 text-left">{secTitles[2] === "Criteria" ? "Meaning" : secTitles[2] === "Tiêu chí" ? "Ý nghĩa" : "의미"}</th>
              <th className="px-3 py-2 text-left">{secTitles[2] === "Criteria" ? "Action" : secTitles[2] === "Tiêu chí" ? "Hành động" : "조치"}</th>
            </tr></thead>
            <tbody>{data.grades.map((g, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-3 py-2"><span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold ${g.color}`}>{g.grade}</span></td>
                <td className="px-3 py-2 text-gray-300">{g.meaning}</td>
                <td className="px-3 py-2 text-gray-400">{g.action}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}
      {/* 3. 근무 시간 */}
      {data.period && <section><SH num={3} title={secTitles[5]} /><p className="text-sm text-gray-300">{data.period}</p></section>}
      {/* 4. 사용 방법 */}
      {data.howToUse && (
        <section>
          <SH num={4} title={secTitles[2] === "Criteria" ? "How to Use" : secTitles[2] === "Tiêu chí" ? "Cách sử dụng" : "사용 방법"} />
          <ul className="space-y-1">{data.howToUse.map((s, i) => <li key={i} className="text-sm text-gray-300">{s}</li>)}</ul>
        </section>
      )}
      {/* 5. 언어 전환 */}
      {data.langInfo && <section><SH num={5} title={secTitles[2] === "Criteria" ? "Language" : secTitles[2] === "Tiêu chí" ? "Ngôn ngữ" : "언어 전환"} /><p className="text-sm text-gray-300">{data.langInfo}</p></section>}
    </>
  );
}

/** 모니터링 페이지 (공통 7개 섹션) */
function MonitoringPage({ data, secTitles }: { data: ManualPageData; secTitles: string[] }) {
  let num = 0;
  return (
    <>
      <h2 className="text-xl font-bold text-white mb-4">{data.title}</h2>
      {/* 1. 개요 */}
      <section><SH num={++num} title={secTitles[0]} /><p className="text-sm text-gray-300 leading-relaxed">{data.overview}</p></section>
      {/* 2. 대상 공정 */}
      {data.processes && data.processes.length > 0 && (
        <section>
          <SH num={++num} title={secTitles[1]} />
          <table className="w-full text-xs border border-gray-800 rounded overflow-hidden">
            <thead><tr className="bg-gray-800/80 text-gray-300">
              <th className="px-3 py-1.5 text-left">Process</th><th className="px-3 py-1.5 text-left">RAW Table</th><th className="px-3 py-1.5 text-left">PID/Barcode</th>
            </tr></thead>
            <tbody>{data.processes.map((p, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-3 py-1.5 text-blue-300 font-medium">{p.name}</td>
                <td className="px-3 py-1.5 text-gray-400 font-mono text-[11px]">{p.table}</td>
                <td className="px-3 py-1.5 text-gray-400">{p.pidCol}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}
      {/* 3. 판정 기준 */}
      {data.criteria && data.criteria.length > 0 && (
        <section>
          <SH num={++num} title={secTitles[2]} />
          <table className="w-full text-xs border border-gray-800 rounded overflow-hidden">
            <thead><tr className="bg-gray-800/80 text-gray-300">
              <th className="px-3 py-1.5 text-left w-20">{secTitles[2] === "Criteria" ? "Grade" : secTitles[2] === "Tiêu chí" ? "Cấp" : "등급"}</th>
              <th className="px-3 py-1.5 text-left">{secTitles[2] === "Criteria" ? "Condition" : secTitles[2] === "Tiêu chí" ? "Điều kiện" : "조건"}</th>
              <th className="px-3 py-1.5 text-left w-24">{secTitles[2] === "Criteria" ? "Action" : secTitles[2] === "Tiêu chí" ? "Hành động" : "조치"}</th>
            </tr></thead>
            <tbody>{data.criteria.map((c, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-3 py-1.5"><span className={`inline-block px-2 py-0.5 rounded text-white text-xs font-bold ${c.gradeColor}`}>{c.grade}</span></td>
                <td className="px-3 py-1.5 text-gray-300">{c.condition}</td>
                <td className="px-3 py-1.5 text-gray-400">{c.action}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}
      {/* 4. 상태 색상 */}
      {data.statusColors && data.statusColors.length > 0 && (
        <section>
          <SH num={++num} title={secTitles[3]} />
          <ul className="space-y-1.5">{data.statusColors.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span className={`w-3 h-3 rounded-full shrink-0 ${s.color}`} />{s.label}
            </li>
          ))}</ul>
        </section>
      )}
      {/* 5. 데이터 흐름 */}
      {data.dataFlow && data.dataFlow.length > 0 && (
        <section>
          <SH num={++num} title={secTitles[4]} />
          <ol className="space-y-1">{data.dataFlow.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-500 shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}</ol>
        </section>
      )}
      {/* 6. 기간/갱신 */}
      {(data.period || data.refresh) && (
        <section>
          <SH num={++num} title={secTitles[5]} />
          {data.period && <p className="text-sm text-gray-300">{data.period}</p>}
          {data.refresh && <p className="text-sm text-gray-400 mt-1">{data.refresh}</p>}
        </section>
      )}
      {/* 7. 비고 */}
      {data.notes && data.notes.length > 0 && (
        <section>
          <SH num={++num} title={secTitles[6]} />
          <ul className="space-y-1">{data.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="text-gray-600 mt-0.5">•</span>{n}
            </li>
          ))}</ul>
        </section>
      )}
    </>
  );
}
