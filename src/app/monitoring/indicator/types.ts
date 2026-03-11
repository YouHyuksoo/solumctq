/**
 * @file src/app/monitoring/indicator/types.ts
 * @description 지표 모니터링 타입 정의
 *
 * 초보자 가이드:
 * - 모델(ITEM_CODE)별 × 공정별 주간 불량 비교 데이터 구조
 * - 전전주/전주/금주 3주치 NG 건수 + 비율 표시용
 */

/** 대상 공정 키 */
export type IndicatorProcessKey =
  | "ICT" | "HIPOT" | "FT" | "BURNIN" | "ATE" | "IMAGE" | "SET";

/** 공정별 3주 불량 데이터 */
export interface WeeklyNgData {
  weekBefore: number;
  lastWeek: number;
  thisWeek: number;
}

/** 모델별 데이터 */
export interface IndicatorModelData {
  itemCode: string;
  processes: Partial<Record<IndicatorProcessKey, WeeklyNgData>>;
}

/** 주간 범위 */
export interface WeekRange {
  start: string;
  end: string;
}

/** API 응답 */
export interface IndicatorResponse {
  models: IndicatorModelData[];
  weekRanges: {
    weekBefore: WeekRange;
    lastWeek: WeekRange;
    thisWeek: WeekRange;
  };
  thisWeekDays: number;
  lastUpdated: string;
}
