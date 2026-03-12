/**
 * @file src/app/monitoring/analysis/hooks/useAnalysis.ts
 * @description 종합분석 데이터 훅 — 8개 API 병렬 호출 + 집계
 *
 * 초보자 가이드:
 * 1. fetchAll() 호출 시 8개 모니터링 API를 Promise.allSettled로 병렬 호출
 * 2. 각 API 응답에서 이상 라인 추출 + 등급 집계
 * 3. 부분 실패 시 해당 모니터링만 에러 표시, 나머지 정상 렌더링
 */

import { useState, useCallback } from "react";
import type { MonitorKey, MonitorSummary, AnalysisData, OverallStatus, AbnormalLine, ProcessDetail } from "../types";

const API_ENDPOINTS: { key: MonitorKey; path: string }[] = [
  { key: "repeatability", path: "/api/ctq/repeatability" },
  { key: "nonConsecutive", path: "/api/ctq/non-consecutive" },
  { key: "accident", path: "/api/ctq/accident" },
  { key: "material", path: "/api/ctq/material" },
  { key: "openShort", path: "/api/ctq/open-short" },
  { key: "indicator", path: "/api/ctq/indicator" },
  { key: "fpy", path: "/api/ctq/fpy" },
  { key: "equipment", path: "/api/ctq/equipment" },
];

function gradePriority(g: string): number {
  if (g === "A") return 3;
  if (g === "B") return 2;
  if (g === "C") return 1;
  return 0;
}

function higherGrade(a: string, b: string): string {
  return gradePriority(a) >= gradePriority(b) ? a : b;
}

/** 일반 모니터링 (반복성/비연속/사고성/원자재/공용부품) 응답 파싱 */
function parseStandardResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    const grade = line.overallGrade ?? "OK";
    if (grade === "OK") continue;
    highest = higherGrade(highest, grade);

    const details: ProcessDetail[] = [];
    const procs = Array.isArray(line.processes) ? line.processes : [];
    for (const p of procs) {
      if (p.grade && p.grade !== "OK") {
        details.push({
          process: p.processLabel ?? p.process ?? "",
          grade: p.grade,
          ngCount: p.ngCount ?? 0,
          detail: p.detail ?? "",
        });
      }
    }
    abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade, details });
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** FPY 응답 파싱 — overallGrade="A" 라인만 */
function parseFpyResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    if (line.overallGrade !== "A") continue;
    highest = "A";
    const details: ProcessDetail[] = [];
    const procs = line.processes ?? {};
    for (const [key, val] of Object.entries(procs) as [string, any][]) {
      const today = val?.today;
      if (today && today.yield < 90) {
        details.push({ process: key, grade: "A", ngCount: today.ng ?? 0, detail: `${today.yield.toFixed(1)}%` });
      }
    }
    abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade: "A", details });
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** 설비 응답 파싱 — 공정별 60분+ 정지 = Grade C */
function parseEquipmentResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const lines = json.lines ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const line of lines) {
    const procs = line.processes ?? {};
    const details: ProcessDetail[] = [];

    for (const [key, val] of Object.entries(procs) as [string, any][]) {
      if (!val) continue;
      const mins = val.stopMinutes ?? 0;
      if (mins >= 60) {
        details.push({ process: key, grade: "C", ngCount: mins, detail: `${mins}분` });
      }
    }

    if (details.length > 0) {
      highest = higherGrade(highest, "C");
      abnormal.push({ lineName: line.lineName, lineCode: line.lineCode, grade: "C", details });
    }
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

/** 지표 응답 파싱 — 전주 대비 200%+ 또는 신규불량(0→N) = Grade C */
function parseIndicatorResponse(json: any): { highestGrade: string; abnormalLines: AbnormalLine[] } {
  const models = json.models ?? [];
  let highest = "OK";
  const abnormal: AbnormalLine[] = [];

  for (const model of models) {
    const procs = model.processes ?? {};
    const details: ProcessDetail[] = [];

    for (const [key, val] of Object.entries(procs) as [string, any][]) {
      if (!val) continue;
      const last = val.lastWeek ?? 0;
      const curr = val.thisWeek ?? 0;
      const isGradeC = (last === 0 && curr > 0) || (last > 0 && curr >= last * 2);
      if (isGradeC) {
        const rate = last > 0 ? Math.round((curr / last) * 100) : -1;
        details.push({
          process: key,
          grade: "C",
          ngCount: curr,
          detail: rate === -1 ? `신규 (0→${curr})` : `${rate}%`,
        });
      }
    }

    if (details.length > 0) {
      highest = higherGrade(highest, "C");
      abnormal.push({
        lineName: model.itemCode ?? "",
        lineCode: "",
        grade: "C",
        details,
      });
    }
  }

  return { highestGrade: highest, abnormalLines: abnormal };
}

function parseResponse(key: MonitorKey, json: any) {
  if (key === "fpy") return parseFpyResponse(json);
  if (key === "equipment") return parseEquipmentResponse(json);
  if (key === "indicator") return parseIndicatorResponse(json);
  return parseStandardResponse(json);
}

export function useAnalysis(selectedLines: string[] = []) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const linesParam = selectedLines.length > 0 ? `?lines=${selectedLines.join(",")}` : "";

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const results = await Promise.allSettled(
      API_ENDPOINTS.map(async ({ key, path }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${path}${linesParam}`, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          return { key, json };
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    const summaries: MonitorSummary[] = API_ENDPOINTS.map(({ key }, i) => {
      const result = results[i];
      if (result.status === "rejected") {
        return { key, highestGrade: "OK" as const, abnormalCount: 0, abnormalLines: [], error: String(result.reason) };
      }
      const { json } = result.value;
      const parsed = parseResponse(key, json);
      return {
        key,
        highestGrade: parsed.highestGrade as "A" | "B" | "C" | "OK",
        abnormalCount: parsed.abnormalLines.length,
        abnormalLines: parsed.abnormalLines,
      };
    });

    const overall: OverallStatus = { gradeA: 0, gradeB: 0, gradeC: 0, ok: 0 };
    for (const s of summaries) {
      if (s.error) continue;
      for (const line of s.abnormalLines) {
        if (line.grade === "A") overall.gradeA++;
        else if (line.grade === "B") overall.gradeB++;
        else if (line.grade === "C") overall.gradeC++;
      }
    }

    setData({ summaries, overall, lastUpdated: new Date().toISOString() });
    setLoading(false);
  }, [linesParam]);

  return { data, loading, fetchAll };
}
