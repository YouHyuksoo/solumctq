/**
 * @file src/app/monitoring/analysis/components/SummaryCards.tsx
 * @description 종합분석 요약 카드 8개 + 전체 현황 바
 *
 * 초보자 가이드:
 * 1. 8개 모니터링별 요약 카드 (최고등급 + 이상라인 수)
 * 2. 카드 클릭 → 해당 보고서 섹션으로 smooth 스크롤
 * 3. 전체 현황 바: A/B/C/OK 건수 합산
 */

"use client";

import { useLocale } from "@/i18n";
import type { MonitorSummary, OverallStatus, MonitorKey } from "../types";

const MONITOR_LABELS: Record<string, Record<MonitorKey, string>> = {
  ko: { repeatability: "반복성", nonConsecutive: "비연속", accident: "사고성", material: "원자재", openShort: "공용부품", indicator: "지표", fpy: "FPY", equipment: "설비" },
  en: { repeatability: "Repeat", nonConsecutive: "Non-Consec.", accident: "Accident", material: "Material", openShort: "Open/Short", indicator: "Indicator", fpy: "FPY", equipment: "Equipment" },
  vi: { repeatability: "Lặp lại", nonConsecutive: "Không LT", accident: "Sự cố", material: "Nguyên liệu", openShort: "Open/Short", indicator: "Chỉ số", fpy: "FPY", equipment: "Thiết bị" },
};

const GRADE_BADGE: Record<string, string> = {
  A: "bg-red-600",
  B: "bg-orange-600",
  C: "bg-purple-600",
  OK: "bg-green-700",
};

interface Props {
  summaries: MonitorSummary[];
  overall: OverallStatus;
}

export default function SummaryCards({ summaries, overall }: Props) {
  const { locale } = useLocale();
  const l = (locale === "ko" || locale === "en" || locale === "vi") ? locale : "ko";
  const labels = MONITOR_LABELS[l] ?? MONITOR_LABELS.ko;

  const scrollTo = (key: MonitorKey) => {
    document.getElementById(`report-${key}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {summaries.map((s) => {
          const badge = GRADE_BADGE[s.highestGrade] ?? GRADE_BADGE.OK;
          return (
            <button key={s.key} onClick={() => scrollTo(s.key)}
              className="rounded-lg border border-gray-700 bg-gray-900/70 p-3 text-center hover:bg-gray-800/70 transition-colors">
              <div className="text-xs text-gray-400 mb-1">{labels[s.key]}</div>
              {s.error ? (
                <span className="text-[10px] text-red-400">ERR</span>
              ) : (
                <>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold text-white ${badge}`}>
                    {s.highestGrade}
                  </span>
                  {s.abnormalCount > 0 && (
                    <div className="text-[10px] text-gray-500 mt-1">{s.abnormalCount} lines</div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg text-sm">
        <span className="text-gray-400 font-medium">
          {l === "en" ? "Overall:" : l === "vi" ? "Tổng:" : "전체 현황:"}
        </span>
        {overall.gradeA > 0 && <Badge color="bg-red-600" label="A" count={overall.gradeA} />}
        {overall.gradeB > 0 && <Badge color="bg-orange-600" label="B" count={overall.gradeB} />}
        {overall.gradeC > 0 && <Badge color="bg-purple-600" label="C" count={overall.gradeC} />}
        {overall.gradeA === 0 && overall.gradeB === 0 && overall.gradeC === 0 && (
          <span className="text-green-400 text-xs font-bold">
            {l === "en" ? "All Normal" : l === "vi" ? "Tất cả bình thường" : "전체 정상"}
          </span>
        )}
      </div>
    </div>
  );
}

function Badge({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold text-white ${color}`}>{label}</span>
      <span className="text-white text-xs">{count}건</span>
    </div>
  );
}
