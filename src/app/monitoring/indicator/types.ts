/**
 * @file src/app/monitoring/indicator/types.ts
 * @description 지표 모니터링 타입 정의
 *
 * 초보자 가이드:
 * - 모델(ITEM_CODE)별 × 공정별 주간/월간 불량 비교 데이터 구조
 * - 전전주/전주/금주 또는 전전월/전월/당월 3기간 NG 건수 + 비율 표시용
 * - period 파라미터로 주간/월간 전환 가능
 */

/** 점검주기 타입 */
export type PeriodType = "weekly" | "monthly";

/** 대상 공정 키 */
export type IndicatorProcessKey =
  | "ICT" | "HIPOT" | "FT" | "BURNIN" | "ATE";

/** 공정별 3기간 PPM 데이터 (주간/월간 공용) */
export interface WeeklyNgData {
  weekBefore: number;
  lastWeek: number;
  thisWeek: number;
  /** 각 기간별 검사 건수 (소량 모수 판별용) */
  weekBeforeTotal: number;
  lastWeekTotal: number;
  thisWeekTotal: number;
}

/** 모델별 데이터 */
export interface IndicatorModelData {
  itemCode: string;
  processes: Partial<Record<IndicatorProcessKey, WeeklyNgData>>;
}

/** 기간 범위 */
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
  period: PeriodType;
  thisWeekDays: number;
  lastUpdated: string;
}
