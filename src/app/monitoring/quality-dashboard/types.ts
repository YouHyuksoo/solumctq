/**
 * @file src/app/monitoring/quality-dashboard/types.ts
 * @description 품질 분석 대시보드 타입 정의
 *
 * 초보자 가이드:
 * 1. IP_PRODUCT_WORK_QC 데이터를 다양한 차트 형태로 집계한 결과
 * 2. 공정별/불량코드별/라인별/모델별/시간대별 집계 + 수리완료율
 */

export interface ChartItem {
  name: string;
  count: number;
}

export interface RepairStats {
  total: number;
  repaired: number;
  pending: number;
}

export interface SummaryData {
  totalDefects: number;
  repairRate: number;
  topProcess: string;
  topBadCode: string;
}

export interface QualityDashboardResponse {
  process: ChartItem[];
  badCode: ChartItem[];
  line: ChartItem[];
  model: ChartItem[];
  hourly: ChartItem[];
  repair: RepairStats;
  summary: SummaryData;
  lastUpdated: string;
}

export interface DashboardSettings {
  layout: "2x3" | "3x2" | "2x2+1";
  chartHeight: number;
  palette: "blue" | "rainbow" | "warm" | "cool";
  showProcess: boolean;
  showBadCode: boolean;
  showLine: boolean;
  showRepair: boolean;
  showHourly: boolean;
  showModel: boolean;
  showSummary: boolean;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  layout: "2x3",
  chartHeight: 200,
  palette: "blue",
  showProcess: true,
  showBadCode: true,
  showLine: true,
  showRepair: true,
  showHourly: true,
  showModel: true,
  showSummary: true,
};

export const PALETTES: Record<string, string[]> = {
  blue: ["#3b82f6","#60a5fa","#93c5fd","#2563eb","#1d4ed8","#1e40af","#dbeafe","#bfdbfe","#7dd3fc","#38bdf8"],
  rainbow: ["#f87171","#fb923c","#facc15","#4ade80","#60a5fa","#a78bfa","#f472b6","#34d399","#38bdf8","#c084fc"],
  warm: ["#f87171","#fb923c","#facc15","#fbbf24","#f59e0b","#d97706","#fca5a5","#fdba74","#fde68a","#fef08a"],
  cool: ["#6ee7b7","#34d399","#2dd4bf","#22d3ee","#38bdf8","#60a5fa","#818cf8","#a78bfa","#67e8f9","#5eead4"],
};
