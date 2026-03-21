/**
 * @file src/app/monitoring/quality-dashboard/components/DashboardSidebar.tsx
 * @description 대시보드 사이드바 — 차트 설정 컨트롤 패널
 *
 * 초보자 가이드:
 * 1. 레이아웃, 차트 높이, 색상 팔레트, 차트 토글 제어
 * 2. 프리셋으로 빠른 구성 전환
 */

"use client";

import type { DashboardSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const PRESETS: Record<string, Partial<DashboardSettings>> = {
  default: { ...DEFAULT_SETTINGS },
  manager: { layout: "2x2+1", chartHeight: 220, palette: "rainbow", showProcess: true, showBadCode: true, showLine: false, showRepair: true, showHourly: true, showModel: false, showSummary: true },
  line: { layout: "2x3", chartHeight: 200, palette: "cool", showProcess: true, showBadCode: false, showLine: true, showRepair: false, showHourly: true, showModel: true, showSummary: true },
  quality: { layout: "3x2", chartHeight: 180, palette: "warm", showProcess: true, showBadCode: true, showLine: true, showRepair: true, showHourly: false, showModel: false, showSummary: true },
};

interface Props {
  settings: DashboardSettings;
  onChange: (s: DashboardSettings) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function DashboardSidebar({ settings, onChange, onRefresh, loading }: Props) {
  const set = (patch: Partial<DashboardSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="w-[260px] min-w-[260px] bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto flex flex-col gap-3">
      <div>
        <h2 className="text-xs text-blue-400 uppercase tracking-wider font-bold">Dashboard</h2>
        <p className="text-[10px] text-gray-500 mt-1">차트 구성 설정</p>
      </div>

      <button onClick={onRefresh} disabled={loading}
        className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold disabled:opacity-50 transition-colors">
        {loading ? "로딩 중..." : "데이터 새로고침"}
      </button>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">프리셋</label>
        <div className="flex flex-wrap gap-1">
          {Object.entries({ default: "기본", manager: "관리자", line: "라인분석", quality: "품질집중" }).map(([k, v]) => (
            <button key={k} onClick={() => set(PRESETS[k] as DashboardSettings)}
              className="px-2 py-1 text-[10px] border border-gray-600 rounded bg-gray-900 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">레이아웃</label>
        <select value={settings.layout} onChange={e => set({ layout: e.target.value as DashboardSettings["layout"] })}
          className="w-full bg-gray-900 text-gray-200 border border-gray-600 rounded px-2 py-1 text-xs">
          <option value="2x3">2열 x 3행</option>
          <option value="3x2">3열 x 2행</option>
          <option value="2x2+1">2열 + 풀하단</option>
        </select>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">
          차트 높이 <span className="text-blue-400 font-mono float-right">{settings.chartHeight}px</span>
        </label>
        <input type="range" min={120} max={350} value={settings.chartHeight}
          onChange={e => set({ chartHeight: Number(e.target.value) })}
          className="w-full accent-blue-500" />
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">색상 팔레트</label>
        <select value={settings.palette} onChange={e => set({ palette: e.target.value as DashboardSettings["palette"] })}
          className="w-full bg-gray-900 text-gray-200 border border-gray-600 rounded px-2 py-1 text-xs">
          <option value="blue">블루</option>
          <option value="rainbow">레인보우</option>
          <option value="warm">웜톤</option>
          <option value="cool">쿨톤</option>
        </select>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-2">표시할 차트</label>
        {([
          ["showSummary", "요약 카드"],
          ["showProcess", "공정별 불량"],
          ["showBadCode", "불량코드 TOP10"],
          ["showLine", "라인별 불량"],
          ["showRepair", "수리완료율"],
          ["showModel", "모델별 불량"],
          ["showHourly", "시간대별 분포"],
        ] as [keyof DashboardSettings, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 mt-1 cursor-pointer">
            <input type="checkbox" checked={settings[key] as boolean}
              onChange={e => set({ [key]: e.target.checked })}
              className="accent-blue-500" />
            <span className="text-[11px] text-gray-300">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
