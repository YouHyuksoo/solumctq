/**
 * @file src/app/monitoring/analysis/components/DetailReport.tsx
 * @description 종합분석 상세 보고서 — 8개 모니터링 섹션별 이상 라인 테이블
 *
 * 초보자 가이드:
 * 1. 8개 섹션이 순서대로 렌더링 (반복성 → 설비)
 * 2. 각 섹션에 id="report-{key}"로 스크롤 앵커 제공
 * 3. 이상 라인만 테이블 표시, 없으면 "이상 없음"
 */

"use client";

import { useLocale } from "@/i18n";
import type { MonitorSummary, MonitorKey, AbnormalLine } from "../types";

const SECTION_ORDER: MonitorKey[] = [
  "repeatability", "nonConsecutive", "accident", "material",
  "openShort", "indicator", "fpy", "equipment",
];

const MONITOR_NAMES: Record<string, Record<MonitorKey, string>> = {
  ko: { repeatability: "반복성 (연속불량)", nonConsecutive: "비연속 불량", accident: "사고성 불량", material: "원자재 (동일부품)", openShort: "공용부품 (Open/Short)", indicator: "지표 (Indicator)", fpy: "FPY (직행율)", equipment: "설비 이상" },
  en: { repeatability: "Repeatability (Consecutive)", nonConsecutive: "Non-Consecutive", accident: "Accidental Defects", material: "Material (Same Component)", openShort: "Common Parts (Open/Short)", indicator: "Indicator", fpy: "FPY (First Pass Yield)", equipment: "Equipment Anomaly" },
  vi: { repeatability: "Lặp lại (Liên tiếp)", nonConsecutive: "Không liên tiếp", accident: "Lỗi sự cố", material: "Nguyên vật liệu", openShort: "Linh kiện chung (Open/Short)", indicator: "Chỉ số (Indicator)", fpy: "FPY (Tỷ lệ đạt)", equipment: "Bất thường thiết bị" },
};

const GRADE_BADGE: Record<string, string> = {
  A: "bg-red-600",
  B: "bg-orange-600",
  C: "bg-purple-600",
  OK: "bg-green-700",
};

interface Props {
  summaries: MonitorSummary[];
}

export default function DetailReport({ summaries }: Props) {
  const { locale, t } = useLocale();
  const l = (locale === "ko" || locale === "en" || locale === "vi") ? locale : "ko";
  const names = MONITOR_NAMES[l] ?? MONITOR_NAMES.ko;
  const noIssues = t("pages.analysis.noIssues") as string;

  const summaryMap = new Map(summaries.map((s) => [s.key, s]));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {t("pages.analysis.section") as string}
      </h2>

      {SECTION_ORDER.map((key, idx) => {
        const s = summaryMap.get(key);
        if (!s) return null;
        const badgeClass = GRADE_BADGE[s.highestGrade] ?? GRADE_BADGE.OK;

        return (
          <section key={key} id={`report-${key}`} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {idx + 1}
              </span>
              <span className="text-sm font-bold text-white">{names[key]}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${badgeClass}`}>
                {s.highestGrade}
              </span>
              {s.error && <span className="text-xs text-red-400 ml-auto">{t("pages.analysis.fetchError") as string}</span>}
            </div>

            <div className="px-4 py-3">
              {s.error ? (
                <p className="text-sm text-red-400">{s.error}</p>
              ) : s.abnormalLines.length === 0 ? (
                <p className="text-sm text-green-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {noIssues}
                </p>
              ) : key === "indicator" ? (
                <IndicatorMatrix lines={s.abnormalLines} />
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-1.5 px-2">Line</th>
                      <th className="text-left py-1.5 px-2">{l === "en" ? "Process" : l === "vi" ? "Công đoạn" : "공정"}</th>
                      <th className="text-left py-1.5 px-2">{l === "en" ? "Grade" : l === "vi" ? "Cấp" : "등급"}</th>
                      <th className="text-right py-1.5 px-2">{l === "en" ? "Count" : l === "vi" ? "Số lượng" : "건수"}</th>
                      <th className="text-left py-1.5 px-2">{l === "en" ? "Detail" : l === "vi" ? "Chi tiết" : "상세"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.abnormalLines.map((line, li) =>
                      line.details.length > 0 ? (
                        line.details.map((d, di) => (
                          <tr key={`${li}-${di}`} className="border-b border-gray-800/50">
                            {di === 0 && (
                              <td className="py-1.5 px-2 text-gray-300 font-medium" rowSpan={line.details.length}>
                                {line.lineName}
                              </td>
                            )}
                            <td className="py-1.5 px-2 text-gray-400">{d.process}</td>
                            <td className="py-1.5 px-2">
                              <span className={`px-1 py-0.5 rounded text-[10px] font-bold text-white ${GRADE_BADGE[d.grade] ?? "bg-gray-600"}`}>
                                {d.grade}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right text-gray-300">{d.ngCount.toLocaleString()}</td>
                            <td className="py-1.5 px-2 text-gray-500 text-[11px]">{d.detail}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key={li} className="border-b border-gray-800/50">
                          <td className="py-1.5 px-2 text-gray-300 font-medium">{line.lineName}</td>
                          <td className="py-1.5 px-2 text-gray-400">-</td>
                          <td className="py-1.5 px-2">
                            <span className={`px-1 py-0.5 rounded text-[10px] font-bold text-white ${GRADE_BADGE[line.grade] ?? "bg-gray-600"}`}>
                              {line.grade}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-gray-300">-</td>
                          <td className="py-1.5 px-2 text-gray-500">-</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const IND_PROCESSES = ["ICT", "HIPOT", "FT", "BURNIN", "ATE"];

/** 지표 전용 매트릭스 테이블: 모델(행) × 공정(열) */
function IndicatorMatrix({ lines }: { lines: AbnormalLine[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800">
          <th className="text-left py-1.5 px-2">{lines.length > 0 ? "Model" : ""}</th>
          {IND_PROCESSES.map((p) => (
            <th key={p} className="text-center py-1.5 px-2">{p} <span className="text-gray-600">PPM</span></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, li) => {
          const detailMap = new Map(line.details.map((d) => [d.process, d]));
          return (
            <tr key={li} className="border-b border-gray-800/50">
              <td className="py-1.5 px-2 text-gray-300 font-medium whitespace-nowrap">{line.lineName}</td>
              {IND_PROCESSES.map((p) => {
                const d = detailMap.get(p);
                return (
                  <td key={p} className={`py-1.5 px-2 text-center ${d ? "text-red-400 font-bold" : "text-gray-700"}`}>
                    {d ? `${d.ngCount.toLocaleString()} ${d.detail}` : "-"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
