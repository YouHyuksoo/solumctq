/**
 * @file src/app/monitoring/repair-status/types.ts
 * @description 수리상태 타입 정의
 *
 * 초보자 가이드:
 * 1. RepairStatusRow: IP_PRODUCT_WORK_QC 개별 불량 레코드
 * 2. RECEIPT_DEFICIT: 입고구분 (2=불량입고)
 * 3. REPAIR_RESULT_CODE: 수리결과코드
 * 4. QC_INSPECT_HANDLING: 검사처리결과
 */

export interface RepairStatusRow {
  qcDate: string;
  pid: string;
  lineCode: string;
  lineName: string;
  modelName: string;
  receiptDeficit: string;
  locationCode: string;
  repairResultCode: string;
  qcInspectHandling: string;
  defectItemCode: string;
  badReasonCode: string;
  badReasonName: string;
}

export interface RepairStatusResponse {
  rows: RepairStatusRow[];
  total: number;
  lastUpdated: string;
}
