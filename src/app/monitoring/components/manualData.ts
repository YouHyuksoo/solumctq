/**
 * @file src/app/monitoring/components/manualData.ts
 * @description 시스템 매뉴얼 콘텐츠 데이터 — 9개 페이지 × 7섹션 × 3개 언어
 *
 * 초보자 가이드:
 * 1. ManualPageData: 각 모니터링 페이지의 통일된 섹션 구조
 * 2. MANUAL_PAGES: 사이드바 메뉴 정의 (key + label)
 * 3. MANUAL_DATA: 언어별 전체 콘텐츠 (ko/en/vi)
 */

export interface ProcessInfo {
  name: string;
  table: string;
  pidCol: string;
}

export interface CriteriaRow {
  grade: string;
  gradeColor: string;
  condition: string;
  action: string;
}

export interface StatusColor {
  color: string;
  label: string;
}

export interface ManualPageData {
  title: string;
  overview: string;
  processes?: ProcessInfo[];
  criteria?: CriteriaRow[];
  statusColors?: StatusColor[];
  dataFlow?: string[];
  period?: string;
  refresh?: string;
  notes?: string[];
  /** 시스템 개요 전용 필드 */
  grades?: { grade: string; color: string; meaning: string; action: string }[];
  howToUse?: string[];
  langInfo?: string;
}

export type ManualPageKey =
  | "system"
  | "repeatability"
  | "nonConsecutive"
  | "accident"
  | "material"
  | "openShort"
  | "indicator"
  | "fpy"
  | "equipment";

export const MANUAL_PAGES: { key: ManualPageKey; icon: string }[] = [
  { key: "system", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "repeatability", icon: "M4 4v5h5M20 20v-5h-5" },
  { key: "nonConsecutive", icon: "M17 11h1a3 3 0 010 6h-1m-8 0H6a3 3 0 010-6h1" },
  { key: "accident", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" },
  { key: "material", icon: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" },
  { key: "openShort", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  { key: "indicator", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" },
  { key: "fpy", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" },
  { key: "equipment", icon: "M11.42 15.17l-5.1 5.1a2.121 2.121 0 01-3-3l5.1-5.1" },
];

type LangData = Record<ManualPageKey, ManualPageData>;

const ko: LangData = {
  system: {
    title: "시스템 개요",
    overview: "CTQ 이상점 모니터링 시스템은 Solum Vietnam 생산라인의 품질 이상을 실시간으로 감지하고 등급별 조치를 안내합니다. 각 모니터링 화면은 30초마다 자동 갱신되며, 10초 롤링으로 전체 라인을 순회합니다.",
    grades: [
      { grade: "A급", color: "bg-red-600", meaning: "Line Stop", action: "즉시 라인 정지 및 원인 조사" },
      { grade: "B급", color: "bg-orange-500", meaning: "출하중지", action: "해당 제품 출하 보류" },
      { grade: "C급", color: "bg-purple-500", meaning: "불량개선", action: "개선 조치 필요 (모니터링)" },
    ],
    howToUse: [
      "1. 상단 네비게이션에서 모니터링 항목을 선택합니다.",
      "2. 라인 필터 버튼으로 확인할 라인을 선택합니다.",
      "3. 카드의 색상과 등급으로 이상 여부를 확인합니다.",
      "4. NG 건수를 클릭하면 상세 내역을 확인할 수 있습니다.",
      "5. 설정 패널에서 갱신 주기와 롤링을 조절할 수 있습니다.",
    ],
    period: "근무 시간: 당일 08:00 ~ 익일 08:00 (베트남 시간 기준)",
    langInfo: "우측 상단의 KO/EN/VI 버튼으로 언어를 전환할 수 있습니다.",
  },
  repeatability: {
    title: "반복성 (연속불량)",
    overview: "FT#1, ATE, IMAGE, SET 검사 공정에서 동일 위치(Location)에 연속으로 NG가 발생하는지 감지합니다. 연속 동일위치 불량은 설비/지그 이상 가능성이 높아 즉시 라인 정지가 필요합니다.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "A급", gradeColor: "bg-red-600", condition: "동일 Location 연속 NG 2건 이상", action: "Line Stop" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "A급 — 연속 동일위치 불량 (Line Stop)" },
      { color: "bg-yellow-500", label: "NG — 불량 발생 (연속 아님)" },
      { color: "bg-green-500", label: "정상 — 불량 없음" },
    ],
    dataFlow: [
      "각 공정 RAW 테이블에서 NG 레코드 추출",
      "IP_PRODUCT_2D_BARCODE JOIN → 품목(ITEM_CODE) '*' 제외",
      "IP_PRODUCT_WORK_QC JOIN → 수리이력의 LOCATION_CODE 취득",
      "LAG 윈도우 함수로 시간순 연속 동일 Location 감지",
      "연속 2건+ 발견 시 A급 판정",
    ],
    period: "당일 08:00 ~ 익일 08:00",
    refresh: "30초 자동 갱신, 10초 롤링",
    notes: [
      "수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
      "QC_CONFIRM_YN='Y' (확인 완료) 건은 집계 제외",
    ],
  },
  nonConsecutive: {
    title: "비연속 불량",
    overview: "동일 위치(Location)에서 2건 이상 NG가 발생했으나 연속은 아닌 경우를 감지합니다. 반복성(A급) 해당 Location은 자동 제외됩니다.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "B급", gradeColor: "bg-orange-500", condition: "동일 Location 비연속 NG 2건 이상 (A급 제외)", action: "출하중지" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "B급 — 동일위치 비연속 반복 (출하중지)" },
      { color: "bg-yellow-500", label: "NG — 불량 발생 (반복 아님)" },
      { color: "bg-green-500", label: "정상 — 불량 없음" },
    ],
    dataFlow: [
      "각 공정 RAW 테이블에서 NG 레코드 추출",
      "IP_PRODUCT_2D_BARCODE JOIN → 품목(ITEM_CODE) '*' 제외",
      "IP_PRODUCT_WORK_QC JOIN → LOCATION_CODE 기준 그룹핑",
      "동일 Location 2건+ 중 연속(A급) Location 제외",
      "남은 Location이 있으면 B급 판정",
    ],
    period: "당일 08:00 ~ 익일 08:00",
    refresh: "30초 자동 갱신, 10초 롤링",
    notes: [
      "수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
      "반복성(A급)에 해당하는 Location은 자동 제외",
    ],
  },
  accident: {
    title: "사고성 불량",
    overview: "HIPOT, BURN-IN, ATE 공정에서 발생하는 사고성 불량을 감지합니다. HIPOT은 감전 위험, BURN-IN/ATE는 제품 손상 위험이 높아 즉시 조치가 필요합니다.",
    processes: [
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
    ],
    criteria: [
      { grade: "A급", gradeColor: "bg-red-600", condition: "HIPOT: NG 1건 이상", action: "Line Stop" },
      { grade: "A급", gradeColor: "bg-red-600", condition: "BURNIN/ATE: NG 2건 이상", action: "Line Stop" },
      { grade: "B급", gradeColor: "bg-orange-500", condition: "BURNIN/ATE: NG 1건", action: "출하중지" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "A급 — 사고성 불량 (Line Stop)" },
      { color: "bg-orange-500", label: "B급 — 사고성 주의 (출하중지)" },
      { color: "bg-yellow-500", label: "NG — 불량 발생 (기준 미달)" },
      { color: "bg-green-500", label: "정상 — 불량 없음" },
    ],
    dataFlow: [
      "각 공정 RAW 테이블에서 NG 레코드 추출",
      "IP_PRODUCT_2D_BARCODE JOIN → 품목(ITEM_CODE) '*' 제외",
      "라인별 NG 건수 집계",
      "공정별 임계값(HIPOT:1, 기타:2/1)으로 등급 판정",
    ],
    period: "당일 08:00 ~ 익일 08:00",
    refresh: "30초 자동 갱신, 10초 롤링",
    notes: ["QC_CONFIRM_YN='Y' (확인 완료) 건은 집계 제외"],
  },
  material: {
    title: "원자재 (동일부품)",
    overview: "동일 부품(DEFECT_ITEM_CODE)에서 반복적으로 불량이 발생하는지 감지합니다. 부품 자체의 품질 문제 또는 공급업체 이슈를 조기에 발견합니다.",
    criteria: [
      { grade: "A급", gradeColor: "bg-red-600", condition: "동일 부품 당일 NG 3건 이상", action: "Line Stop" },
      { grade: "C급", gradeColor: "bg-purple-500", condition: "동일 부품 90일 누적 NG 3건 이상", action: "불량개선" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "A급 — 동일 부품 일 3건+ (Line Stop)" },
      { color: "bg-purple-500", label: "C급 — 90일 누적 3건+ (불량개선)" },
      { color: "bg-yellow-500", label: "NG — 동일 부품 불량 (기준 미달)" },
      { color: "bg-green-500", label: "정상 — 불량 없음" },
    ],
    dataFlow: [
      "IP_PRODUCT_WORK_QC 테이블에서 수리이력 조회",
      "DEFECT_ITEM_CODE 기준 그룹핑",
      "당일 3건+ → A급, 90일 누적 3건+ → C급",
    ],
    period: "A급: 당일 08:00~, C급: 90일 누적",
    refresh: "30초 자동 갱신, 10초 롤링",
    notes: [
      "수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
      "DEFECT_ITEM_CODE가 동일한 부품 기준으로 집계",
    ],
  },
  openShort: {
    title: "공용부품 (Open/Short)",
    overview: "ICT 공정에서 발생하는 Open/Short 불량을 감지합니다. 동일 불량코드가 반복되면 특정 부품이나 납땜 공정에 문제가 있을 수 있습니다.",
    processes: [
      { name: "ICT", table: "IP_PRODUCT_WORK_QC", pidCol: "SERIAL_NO" },
    ],
    criteria: [
      { grade: "B급", gradeColor: "bg-orange-500", condition: "동일 불량코드(OPEN/SHORT) 당일 2건 이상", action: "출하중지" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "B급 — 동일 불량코드 반복 (출하중지)" },
      { color: "bg-yellow-500", label: "NG — Open/Short 불량 (기준 미달)" },
      { color: "bg-green-500", label: "정상 — 불량 없음" },
    ],
    dataFlow: [
      "IP_PRODUCT_WORK_QC에서 ICT 공정 수리이력 조회",
      "BAD_REASON_CODE 기준: OPEN(B2020) / SHORT(B2030)",
      "동일 불량코드 + 동일 DEFECT_ITEM_CODE 일 2건+ → B급",
    ],
    period: "당일 08:00 ~",
    refresh: "30초 자동 갱신, 10초 롤링",
    notes: [
      "수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
      "WORKSTAGE: W090, W430 대상",
    ],
  },
  indicator: {
    title: "지표 (Indicator)",
    overview: "모델(ITEM_CODE)별 × 공정별 주간 불량 건수를 전전주/전주/금주 3주치로 비교합니다. 전주 대비 급증한 불량을 조기에 발견합니다.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "C급", gradeColor: "bg-purple-500", condition: "전주 대비 200% 이상 또는 신규 불량", action: "불량개선" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "전주 대비 200%+ 또는 신규 (C급)" },
      { color: "bg-yellow-500", label: "전주 대비 100~199% (증가)" },
      { color: "bg-green-500", label: "전주 대비 100% 미만 (감소)" },
      { color: "bg-gray-500", label: "불량 없음 (0→0)" },
    ],
    dataFlow: [
      "7개 공정 RAW 테이블에서 3주치 NG 집계",
      "IP_PRODUCT_2D_BARCODE JOIN → ITEM_CODE(모델) 취득",
      "CASE WHEN으로 전전주/전주/금주 분류",
      "전주 대비 2배 이상 → C급 판정",
    ],
    period: "주간 (월요일~일요일 기준)",
    notes: ["월요일을 주의 시작으로 계산"],
  },
  fpy: {
    title: "FPY (직행율)",
    overview: "라인별 × 공정별 직행율(First Pass Yield)을 모니터링합니다. 직행율 = 최초검사 PASS 제품수 / 고유 제품수 × 100. 재검사는 제외하고 최초 검사 결과만 반영합니다.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "A급", gradeColor: "bg-red-600", condition: "당일 직행율 90% 미만", action: "Line Stop" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "직행율 90% 미만 (A급 Line Stop)" },
      { color: "bg-yellow-500", label: "직행율 90~95%" },
      { color: "bg-green-500", label: "직행율 95% 이상" },
    ],
    dataFlow: [
      "각 공정 RAW 테이블에서 검사 데이터 추출",
      "ROW_NUMBER()로 제품별 최초 검사만 필터 (RN=1)",
      "PASS 건수 / 전체 건수 × 100 = 직행율",
      "90% 미만 시 A급 판정",
    ],
    period: "전일/당일 비교 (전일 08:00~08:00, 당일 10:00~익일 08:00)",
    notes: ["재검사(2회차 이상) 결과는 직행율 계산에 포함되지 않음"],
  },
  equipment: {
    title: "설비 이상",
    overview: "라인별 공정별 설비 정지시간을 모니터링합니다. 장시간 설비 정지는 생산성 저하의 원인이 되므로 개선이 필요합니다.",
    processes: [
      { name: "ICT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "HI-POT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "FT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "BURN-IN", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "ATE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "IMAGE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "SET", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
    ],
    criteria: [
      { grade: "C급", gradeColor: "bg-purple-500", condition: "일 정지시간 60분 이상", action: "불량개선" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "60분 이상 정지 (C급 불량개선)" },
      { color: "bg-yellow-500", label: "정지 발생 (60분 미만)" },
      { color: "bg-gray-500", label: "정지 없음" },
    ],
    dataFlow: [
      "IP_LINE_DAILY_OPERATION_HIST에서 정지 이력 조회",
      "LINE_STATUS_CODE 기준 공정별 매핑",
      "정지시간(분) 합산 → 60분 이상 시 C급",
    ],
    period: "당일 (F_GET_WORK_ACTUAL_DATE 기준)",
    notes: ["LINE_STATUS_CODE로 공정 구분"],
  },
};

const en: LangData = {
  system: {
    title: "System Overview",
    overview: "The CTQ Anomaly Monitoring System detects quality anomalies on Solum Vietnam production lines in real-time and guides grade-based actions. Each monitoring screen auto-refreshes every 30 seconds with 10-second rolling across all lines.",
    grades: [
      { grade: "Grade A", color: "bg-red-600", meaning: "Line Stop", action: "Immediately stop line and investigate" },
      { grade: "Grade B", color: "bg-orange-500", meaning: "Ship Hold", action: "Hold shipment of affected products" },
      { grade: "Grade C", color: "bg-purple-500", meaning: "Improve", action: "Improvement action required (monitoring)" },
    ],
    howToUse: [
      "1. Select a monitoring item from the top navigation.",
      "2. Use the line filter button to select lines to monitor.",
      "3. Check card colors and grades for anomalies.",
      "4. Click NG count for detailed records.",
      "5. Adjust refresh interval and rolling in Settings panel.",
    ],
    period: "Shift: Today 08:00 ~ Next day 08:00 (Vietnam time)",
    langInfo: "Switch language with KO/EN/VI buttons in the top right.",
  },
  repeatability: {
    title: "Repeatability (Consecutive)",
    overview: "Detects consecutive NG at the same location in FT#1, ATE, IMAGE, SET inspection processes. Consecutive same-location defects likely indicate equipment/jig issues requiring immediate line stop.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Grade A", gradeColor: "bg-red-600", condition: "Same Location consecutive NG 2+", action: "Line Stop" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Grade A — Consecutive same location (Line Stop)" },
      { color: "bg-yellow-500", label: "NG — Defect occurred (not consecutive)" },
      { color: "bg-green-500", label: "Normal — No defects" },
    ],
    dataFlow: [
      "Extract NG records from each process RAW table",
      "JOIN IP_PRODUCT_2D_BARCODE → Exclude ITEM_CODE '*'",
      "JOIN IP_PRODUCT_WORK_QC → Get LOCATION_CODE from repair history",
      "LAG window function detects consecutive same location",
      "2+ consecutive found → Grade A",
    ],
    period: "Today 08:00 ~ Next day 08:00",
    refresh: "30s auto-refresh, 10s rolling",
    notes: [
      "Final judgment based on repair history (IP_PRODUCT_WORK_QC) data",
      "QC_CONFIRM_YN='Y' (confirmed) records excluded",
    ],
  },
  nonConsecutive: {
    title: "Non-Consecutive Defects",
    overview: "Detects same location with 2+ NG but not consecutive. Locations already flagged as Grade A (repeatability) are automatically excluded.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Grade B", gradeColor: "bg-orange-500", condition: "Same Location non-consecutive NG 2+ (excl. Grade A)", action: "Ship Hold" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "Grade B — Same location repeated (Ship Hold)" },
      { color: "bg-yellow-500", label: "NG — Defect occurred (no repeat)" },
      { color: "bg-green-500", label: "Normal — No defects" },
    ],
    dataFlow: [
      "Extract NG records from each process RAW table",
      "JOIN IP_PRODUCT_2D_BARCODE → Exclude ITEM_CODE '*'",
      "JOIN IP_PRODUCT_WORK_QC → Group by LOCATION_CODE",
      "Exclude consecutive (Grade A) locations",
      "Remaining locations with 2+ → Grade B",
    ],
    period: "Today 08:00 ~ Next day 08:00",
    refresh: "30s auto-refresh, 10s rolling",
    notes: [
      "Final judgment based on repair history (IP_PRODUCT_WORK_QC) data",
      "Grade A locations automatically excluded",
    ],
  },
  accident: {
    title: "Accidental Defects",
    overview: "Detects accidental defects in HIPOT, BURN-IN, ATE processes. HIPOT has electrocution risk, BURN-IN/ATE have product damage risk requiring immediate action.",
    processes: [
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
    ],
    criteria: [
      { grade: "Grade A", gradeColor: "bg-red-600", condition: "HIPOT: NG 1+", action: "Line Stop" },
      { grade: "Grade A", gradeColor: "bg-red-600", condition: "BURNIN/ATE: NG 2+", action: "Line Stop" },
      { grade: "Grade B", gradeColor: "bg-orange-500", condition: "BURNIN/ATE: NG 1", action: "Ship Hold" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Grade A — Accidental defect (Line Stop)" },
      { color: "bg-orange-500", label: "Grade B — Caution (Ship Hold)" },
      { color: "bg-yellow-500", label: "NG — Defect below criteria" },
      { color: "bg-green-500", label: "Normal — No defects" },
    ],
    dataFlow: [
      "Extract NG records from each process RAW table",
      "JOIN IP_PRODUCT_2D_BARCODE → Exclude ITEM_CODE '*'",
      "Aggregate NG count per line",
      "Grade by threshold (HIPOT:1, others:2/1)",
    ],
    period: "Today 08:00 ~ Next day 08:00",
    refresh: "30s auto-refresh, 10s rolling",
    notes: ["QC_CONFIRM_YN='Y' (confirmed) records excluded"],
  },
  material: {
    title: "Material (Same Component)",
    overview: "Detects repeated defects on the same component (DEFECT_ITEM_CODE). Early detection of component quality or supplier issues.",
    criteria: [
      { grade: "Grade A", gradeColor: "bg-red-600", condition: "Same component daily NG 3+", action: "Line Stop" },
      { grade: "Grade C", gradeColor: "bg-purple-500", condition: "Same component 90-day cumulative NG 3+", action: "Improve" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Grade A — Same component daily 3+ (Line Stop)" },
      { color: "bg-purple-500", label: "Grade C — 90-day cumulative 3+ (Improve)" },
      { color: "bg-yellow-500", label: "NG — Same component defect (below criteria)" },
      { color: "bg-green-500", label: "Normal — No defects" },
    ],
    dataFlow: [
      "Query repair history from IP_PRODUCT_WORK_QC",
      "Group by DEFECT_ITEM_CODE",
      "Daily 3+ → Grade A, 90-day cumulative 3+ → Grade C",
    ],
    period: "Grade A: daily 08:00~, Grade C: 90-day cumulative",
    refresh: "30s auto-refresh, 10s rolling",
    notes: [
      "Final judgment based on repair history (IP_PRODUCT_WORK_QC) data",
      "Aggregated by identical DEFECT_ITEM_CODE",
    ],
  },
  openShort: {
    title: "Common Parts (Open/Short)",
    overview: "Detects Open/Short defects in ICT process. Repeated same defect codes may indicate specific component or soldering issues.",
    processes: [
      { name: "ICT", table: "IP_PRODUCT_WORK_QC", pidCol: "SERIAL_NO" },
    ],
    criteria: [
      { grade: "Grade B", gradeColor: "bg-orange-500", condition: "Same defect code (OPEN/SHORT) daily 2+", action: "Ship Hold" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "Grade B — Same defect code repeated (Ship Hold)" },
      { color: "bg-yellow-500", label: "NG — Open/Short defect (below criteria)" },
      { color: "bg-green-500", label: "Normal — No defects" },
    ],
    dataFlow: [
      "Query ICT repair history from IP_PRODUCT_WORK_QC",
      "BAD_REASON_CODE: OPEN(B2020) / SHORT(B2030)",
      "Same defect code + same DEFECT_ITEM_CODE daily 2+ → Grade B",
    ],
    period: "Today 08:00 ~",
    refresh: "30s auto-refresh, 10s rolling",
    notes: [
      "Final judgment based on repair history (IP_PRODUCT_WORK_QC) data",
      "Workstage: W090, W430",
    ],
  },
  indicator: {
    title: "Indicator",
    overview: "Compares weekly NG counts by model (ITEM_CODE) × process across 3 weeks (2 weeks ago / last week / this week). Early detection of sudden defect increases.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Grade C", gradeColor: "bg-purple-500", condition: "200%+ vs previous week or new defect", action: "Improve" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "200%+ vs previous week or new (Grade C)" },
      { color: "bg-yellow-500", label: "100~199% vs previous week (increase)" },
      { color: "bg-green-500", label: "Under 100% vs previous week (decrease)" },
      { color: "bg-gray-500", label: "No defects (0→0)" },
    ],
    dataFlow: [
      "Aggregate 3-week NG from 7 process RAW tables",
      "JOIN IP_PRODUCT_2D_BARCODE → Get ITEM_CODE (model)",
      "CASE WHEN classifies into 3 weeks",
      "2x or more vs previous week → Grade C",
    ],
    period: "Weekly (Monday to Sunday)",
    notes: ["Monday is start of week"],
  },
  fpy: {
    title: "FPY (First Pass Yield)",
    overview: "Monitors first pass yield by line × process. FPY = First-inspection PASS products / Unique products × 100. Re-inspections are excluded, only first inspection results count.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Grade A", gradeColor: "bg-red-600", condition: "Daily FPY below 90%", action: "Line Stop" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "FPY below 90% (Grade A Line Stop)" },
      { color: "bg-yellow-500", label: "FPY 90~95%" },
      { color: "bg-green-500", label: "FPY 95% or above" },
    ],
    dataFlow: [
      "Extract inspection data from each process RAW table",
      "ROW_NUMBER() filters first inspection per product (RN=1)",
      "PASS count / Total count × 100 = FPY",
      "Below 90% → Grade A",
    ],
    period: "Yesterday/Today comparison (Yesterday 08:00~08:00, Today 10:00~Next 08:00)",
    notes: ["Re-inspection (2nd+ attempt) results are not included in FPY calculation"],
  },
  equipment: {
    title: "Equipment Anomaly",
    overview: "Monitors equipment stop time per line and process. Extended equipment downtime causes productivity loss and requires improvement action.",
    processes: [
      { name: "ICT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "HI-POT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "FT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "BURN-IN", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "ATE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "IMAGE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "SET", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
    ],
    criteria: [
      { grade: "Grade C", gradeColor: "bg-purple-500", condition: "Daily stop time 60min+", action: "Improve" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "60min+ stop (Grade C Improve)" },
      { color: "bg-yellow-500", label: "Stop occurred (under 60min)" },
      { color: "bg-gray-500", label: "No stop" },
    ],
    dataFlow: [
      "Query stop history from IP_LINE_DAILY_OPERATION_HIST",
      "Map to process by LINE_STATUS_CODE",
      "Sum stop time (min) → 60min+ is Grade C",
    ],
    period: "Today (F_GET_WORK_ACTUAL_DATE)",
    notes: ["Process identified by LINE_STATUS_CODE"],
  },
};

const vi: LangData = {
  system: {
    title: "Tổng quan hệ thống",
    overview: "Hệ thống giám sát bất thường CTQ phát hiện các bất thường chất lượng trên dây chuyền sản xuất Solum Vietnam theo thời gian thực và hướng dẫn hành động theo cấp độ. Mỗi màn hình tự động làm mới 30 giây, cuộn 10 giây qua tất cả các line.",
    grades: [
      { grade: "Cấp A", color: "bg-red-600", meaning: "Dừng Line", action: "Dừng line ngay và điều tra nguyên nhân" },
      { grade: "Cấp B", color: "bg-orange-500", meaning: "Tạm dừng XK", action: "Tạm giữ sản phẩm liên quan" },
      { grade: "Cấp C", color: "bg-purple-500", meaning: "Cải thiện", action: "Cần hành động cải thiện (giám sát)" },
    ],
    howToUse: [
      "1. Chọn mục giám sát từ thanh điều hướng trên cùng.",
      "2. Dùng nút bộ lọc line để chọn line cần theo dõi.",
      "3. Kiểm tra màu sắc và cấp độ thẻ để phát hiện bất thường.",
      "4. Nhấp vào số NG để xem chi tiết.",
      "5. Điều chỉnh tần suất làm mới và cuộn trong bảng Cài đặt.",
    ],
    period: "Ca làm việc: Hôm nay 08:00 ~ Ngày mai 08:00 (giờ Việt Nam)",
    langInfo: "Chuyển ngôn ngữ bằng nút KO/EN/VI ở góc trên bên phải.",
  },
  repeatability: {
    title: "Lặp lại (Liên tiếp)",
    overview: "Phát hiện NG liên tiếp tại cùng vị trí (Location) trong các công đoạn kiểm tra FT#1, ATE, IMAGE, SET. Lỗi liên tiếp cùng vị trí có khả năng cao là do thiết bị/jig cần dừng line ngay.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Cấp A", gradeColor: "bg-red-600", condition: "Cùng Location NG liên tiếp 2+", action: "Dừng Line" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Cấp A — Lỗi liên tiếp cùng vị trí (Dừng Line)" },
      { color: "bg-yellow-500", label: "NG — Có lỗi (không liên tiếp)" },
      { color: "bg-green-500", label: "Bình thường — Không có lỗi" },
    ],
    dataFlow: [
      "Trích xuất bản ghi NG từ bảng RAW mỗi công đoạn",
      "JOIN IP_PRODUCT_2D_BARCODE → Loại trừ ITEM_CODE '*'",
      "JOIN IP_PRODUCT_WORK_QC → Lấy LOCATION_CODE từ lịch sử sửa chữa",
      "Hàm cửa sổ LAG phát hiện cùng vị trí liên tiếp",
      "Phát hiện 2+ liên tiếp → Cấp A",
    ],
    period: "Hôm nay 08:00 ~ Ngày mai 08:00",
    refresh: "Tự động làm mới 30s, cuộn 10s",
    notes: [
      "Đánh giá cuối cùng dựa trên dữ liệu lịch sử sửa chữa (IP_PRODUCT_WORK_QC)",
      "Bản ghi QC_CONFIRM_YN='Y' (đã xác nhận) được loại trừ",
    ],
  },
  nonConsecutive: {
    title: "Lỗi không liên tiếp",
    overview: "Phát hiện cùng vị trí có 2+ NG nhưng không liên tiếp. Các vị trí đã được đánh giá Cấp A (lặp lại) được tự động loại trừ.",
    processes: [
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Cấp B", gradeColor: "bg-orange-500", condition: "Cùng Location không liên tiếp NG 2+ (trừ Cấp A)", action: "Tạm dừng XK" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "Cấp B — Cùng vị trí lặp lại (Tạm dừng XK)" },
      { color: "bg-yellow-500", label: "NG — Có lỗi (không lặp)" },
      { color: "bg-green-500", label: "Bình thường — Không có lỗi" },
    ],
    dataFlow: [
      "Trích xuất bản ghi NG từ bảng RAW mỗi công đoạn",
      "JOIN IP_PRODUCT_2D_BARCODE → Loại trừ ITEM_CODE '*'",
      "JOIN IP_PRODUCT_WORK_QC → Nhóm theo LOCATION_CODE",
      "Loại trừ vị trí liên tiếp (Cấp A)",
      "Vị trí còn lại có 2+ → Cấp B",
    ],
    period: "Hôm nay 08:00 ~ Ngày mai 08:00",
    refresh: "Tự động làm mới 30s, cuộn 10s",
    notes: [
      "Đánh giá cuối cùng dựa trên dữ liệu lịch sử sửa chữa (IP_PRODUCT_WORK_QC)",
      "Vị trí Cấp A được tự động loại trừ",
    ],
  },
  accident: {
    title: "Lỗi sự cố",
    overview: "Phát hiện lỗi sự cố trong các công đoạn HIPOT, BURN-IN, ATE. HIPOT có nguy cơ điện giật, BURN-IN/ATE có nguy cơ hư hại sản phẩm cần xử lý ngay.",
    processes: [
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
    ],
    criteria: [
      { grade: "Cấp A", gradeColor: "bg-red-600", condition: "HIPOT: NG 1+", action: "Dừng Line" },
      { grade: "Cấp A", gradeColor: "bg-red-600", condition: "BURNIN/ATE: NG 2+", action: "Dừng Line" },
      { grade: "Cấp B", gradeColor: "bg-orange-500", condition: "BURNIN/ATE: NG 1", action: "Tạm dừng XK" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Cấp A — Lỗi sự cố (Dừng Line)" },
      { color: "bg-orange-500", label: "Cấp B — Cảnh giác (Tạm dừng XK)" },
      { color: "bg-yellow-500", label: "NG — Lỗi dưới tiêu chí" },
      { color: "bg-green-500", label: "Bình thường — Không có lỗi" },
    ],
    dataFlow: [
      "Trích xuất bản ghi NG từ bảng RAW mỗi công đoạn",
      "JOIN IP_PRODUCT_2D_BARCODE → Loại trừ ITEM_CODE '*'",
      "Tổng hợp số NG theo line",
      "Đánh giá theo ngưỡng (HIPOT:1, khác:2/1)",
    ],
    period: "Hôm nay 08:00 ~ Ngày mai 08:00",
    refresh: "Tự động làm mới 30s, cuộn 10s",
    notes: ["Bản ghi QC_CONFIRM_YN='Y' (đã xác nhận) được loại trừ"],
  },
  material: {
    title: "Nguyên vật liệu (Cùng linh kiện)",
    overview: "Phát hiện lỗi lặp trên cùng linh kiện (DEFECT_ITEM_CODE). Phát hiện sớm vấn đề chất lượng linh kiện hoặc nhà cung cấp.",
    criteria: [
      { grade: "Cấp A", gradeColor: "bg-red-600", condition: "Cùng linh kiện NG ngày 3+", action: "Dừng Line" },
      { grade: "Cấp C", gradeColor: "bg-purple-500", condition: "Cùng linh kiện tích lũy 90 ngày NG 3+", action: "Cải thiện" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Cấp A — Cùng linh kiện ngày 3+ (Dừng Line)" },
      { color: "bg-purple-500", label: "Cấp C — Tích lũy 90 ngày 3+ (Cải thiện)" },
      { color: "bg-yellow-500", label: "NG — Lỗi cùng linh kiện (dưới tiêu chí)" },
      { color: "bg-green-500", label: "Bình thường — Không có lỗi" },
    ],
    dataFlow: [
      "Truy vấn lịch sử sửa chữa từ IP_PRODUCT_WORK_QC",
      "Nhóm theo DEFECT_ITEM_CODE",
      "Ngày 3+ → Cấp A, Tích lũy 90 ngày 3+ → Cấp C",
    ],
    period: "Cấp A: trong ngày 08:00~, Cấp C: tích lũy 90 ngày",
    refresh: "Tự động làm mới 30s, cuộn 10s",
    notes: [
      "Đánh giá cuối cùng dựa trên dữ liệu lịch sử sửa chữa (IP_PRODUCT_WORK_QC)",
      "Tổng hợp theo DEFECT_ITEM_CODE giống nhau",
    ],
  },
  openShort: {
    title: "Linh kiện chung (Open/Short)",
    overview: "Phát hiện lỗi Open/Short trong công đoạn ICT. Mã lỗi giống nhau lặp lại có thể do vấn đề linh kiện hoặc hàn cụ thể.",
    processes: [
      { name: "ICT", table: "IP_PRODUCT_WORK_QC", pidCol: "SERIAL_NO" },
    ],
    criteria: [
      { grade: "Cấp B", gradeColor: "bg-orange-500", condition: "Cùng mã lỗi (OPEN/SHORT) ngày 2+", action: "Tạm dừng XK" },
    ],
    statusColors: [
      { color: "bg-orange-500", label: "Cấp B — Cùng mã lỗi lặp (Tạm dừng XK)" },
      { color: "bg-yellow-500", label: "NG — Lỗi Open/Short (dưới tiêu chí)" },
      { color: "bg-green-500", label: "Bình thường — Không có lỗi" },
    ],
    dataFlow: [
      "Truy vấn lịch sử sửa chữa ICT từ IP_PRODUCT_WORK_QC",
      "BAD_REASON_CODE: OPEN(B2020) / SHORT(B2030)",
      "Cùng mã lỗi + cùng DEFECT_ITEM_CODE ngày 2+ → Cấp B",
    ],
    period: "Hôm nay 08:00 ~",
    refresh: "Tự động làm mới 30s, cuộn 10s",
    notes: [
      "Đánh giá cuối cùng dựa trên dữ liệu lịch sử sửa chữa (IP_PRODUCT_WORK_QC)",
      "Workstage: W090, W430",
    ],
  },
  indicator: {
    title: "Chỉ số (Indicator)",
    overview: "So sánh số lượng NG hàng tuần theo model (ITEM_CODE) × công đoạn qua 3 tuần. Phát hiện sớm sự gia tăng đột biến lỗi.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Cấp C", gradeColor: "bg-purple-500", condition: "200%+ so với tuần trước hoặc lỗi mới", action: "Cải thiện" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "200%+ so với tuần trước hoặc mới (Cấp C)" },
      { color: "bg-yellow-500", label: "100~199% so với tuần trước (tăng)" },
      { color: "bg-green-500", label: "Dưới 100% so với tuần trước (giảm)" },
      { color: "bg-gray-500", label: "Không có lỗi (0→0)" },
    ],
    dataFlow: [
      "Tổng hợp NG 3 tuần từ 7 bảng RAW công đoạn",
      "JOIN IP_PRODUCT_2D_BARCODE → Lấy ITEM_CODE (model)",
      "CASE WHEN phân loại 3 tuần",
      "Gấp 2 lần trở lên so với tuần trước → Cấp C",
    ],
    period: "Hàng tuần (Thứ Hai ~ Chủ Nhật)",
    notes: ["Thứ Hai là ngày bắt đầu tuần"],
  },
  fpy: {
    title: "FPY (Tỷ lệ đạt lần đầu)",
    overview: "Giám sát tỷ lệ đạt lần đầu theo line × công đoạn. FPY = Sản phẩm PASS lần đầu / Tổng sản phẩm × 100. Kiểm tra lại không được tính, chỉ kết quả kiểm tra đầu tiên.",
    processes: [
      { name: "ICT", table: "IQ_MACHINE_ICT_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "HI-POT", table: "IQ_MACHINE_HIPOT_POWER_DATA_RAW", pidCol: "PID" },
      { name: "FT#1", table: "IQ_MACHINE_FT1_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "BURN-IN", table: "IQ_MACHINE_BURNIN_SMPS_DATA_RAW", pidCol: "PID" },
      { name: "ATE", table: "IQ_MACHINE_ATE_SERVER_DATA_RAW", pidCol: "PID" },
      { name: "IMAGE", table: "IQ_MACHINE_INSPECT_DATA_PBA_FT", pidCol: "BARCODE" },
      { name: "SET", table: "IQ_MACHINE_INSPECT_DATA_PBA_TVSET", pidCol: "BARCODE" },
    ],
    criteria: [
      { grade: "Cấp A", gradeColor: "bg-red-600", condition: "FPY trong ngày dưới 90%", action: "Dừng Line" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "FPY dưới 90% (Cấp A Dừng Line)" },
      { color: "bg-yellow-500", label: "FPY 90~95%" },
      { color: "bg-green-500", label: "FPY trên 95%" },
    ],
    dataFlow: [
      "Trích xuất dữ liệu kiểm tra từ bảng RAW mỗi công đoạn",
      "ROW_NUMBER() lọc kiểm tra đầu tiên mỗi sản phẩm (RN=1)",
      "Số PASS / Tổng × 100 = FPY",
      "Dưới 90% → Cấp A",
    ],
    period: "So sánh hôm qua/hôm nay (Hôm qua 08:00~08:00, Hôm nay 10:00~08:00 ngày sau)",
    notes: ["Kết quả kiểm tra lại (lần 2+) không tính vào FPY"],
  },
  equipment: {
    title: "Bất thường thiết bị",
    overview: "Giám sát thời gian dừng thiết bị theo line và công đoạn. Dừng thiết bị kéo dài gây giảm năng suất cần hành động cải thiện.",
    processes: [
      { name: "ICT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "HI-POT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "FT", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "BURN-IN", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "ATE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "IMAGE", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
      { name: "SET", table: "IP_LINE_DAILY_OPERATION_HIST", pidCol: "-" },
    ],
    criteria: [
      { grade: "Cấp C", gradeColor: "bg-purple-500", condition: "Dừng 60 phút+ trong ngày", action: "Cải thiện" },
    ],
    statusColors: [
      { color: "bg-red-500", label: "Dừng 60 phút+ (Cấp C Cải thiện)" },
      { color: "bg-yellow-500", label: "Có dừng (dưới 60 phút)" },
      { color: "bg-gray-500", label: "Không dừng" },
    ],
    dataFlow: [
      "Truy vấn lịch sử dừng từ IP_LINE_DAILY_OPERATION_HIST",
      "Ánh xạ công đoạn theo LINE_STATUS_CODE",
      "Tổng thời gian dừng (phút) → 60 phút+ là Cấp C",
    ],
    period: "Trong ngày (F_GET_WORK_ACTUAL_DATE)",
    notes: ["Công đoạn xác định bởi LINE_STATUS_CODE"],
  },
};

export const MANUAL_DATA: Record<string, LangData> = { ko, en, vi };
