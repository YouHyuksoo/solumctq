/**
 * @file src/app/monitoring/open-short/types.ts
 * @description 공용부품 Open/Short 모니터링 타입 정의
 */

export type OpenShortDefectType = "OPEN" | "SHORT";
export type OpenShortGrade = "B" | "OK";

/** NG 상세 레코드 (툴팁용) */
export interface NgDetailRecord {
  time: string;
  pid: string;
  model: string;
  receiptDeficit: string;
  locationCode: string;
  repairResult: string;
  qcHandling: string;
  defectItem: string;
}

export interface OpenShortDefectItem {
  defectItem: string;
  defectType: OpenShortDefectType;
  badReasonCode: string;
  count: number;
  lastInspectTime: string;
  ngDetails: NgDetailRecord[];
}

export interface OpenShortLineCardData {
  lineCode: string;
  lineName: string;
  defects: OpenShortDefectItem[];
  overallGrade: OpenShortGrade;
}

export interface OpenShortResponse {
  lines: OpenShortLineCardData[];
  lastUpdated: string;
}
