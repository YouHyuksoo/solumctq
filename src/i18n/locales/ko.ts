/**
 * @file src/i18n/locales/ko.ts
 * @description 한국어 번역 파일 (기본 언어)
 *
 * 초보자 가이드:
 * 1. 키를 추가할 때 en.ts, vi.ts에도 동일한 키를 추가해야 함
 * 2. 중첩 객체로 카테고리 분류 (common, nav, pages 등)
 */

const ko = {
  /* ── 공통 ── */
  common: {
    ctqMonitoring: "이상점 모니터링 (SOLUM Vietnam)",
    qualitySystem: "품질 관리 실시간 모니터링 시스템",
    loading: "로딩 중...",
    dataLoading: "데이터 로딩 중...",
    dataError: "데이터 조회 오류",
    noActiveLines: "활성 라인이 없습니다.",
    noMatchingData: "현재 조건에 해당하는 불량 데이터가 없습니다.",
    refresh: "갱신",
    line: "Line",
  },

  /* ── 등급 ── */
  grade: {
    a: "A급",
    b: "B급",
    c: "C급",
    lineStop: "Line Stop",
    shipmentStop: "출하중지",
    qualityImprove: "불량개선",
    warning: "Warning",
    running: "Running",
    ok: "정상",
  },

  /* ── 네비게이션 ── */
  nav: {
    goHome: "주 메뉴로 이동",
    lineFilter: "라인 필터",
    lineFilterCount: "개 선택",
    lineSelect: "라인선택",
    repeatability: "반복성연속",
    nonConsecutive: "반복성동일",
    accident: "사고성",
    material: "원자재동일부품",
    openShort: "원자재공용부품",
    indicator: "지표",
    fpy: "직행율",
    equipment: "설비이상",
    analysis: "종합분석",
  },

  /* ── 네비 툴팁 ── */
  navTooltip: {
    criteria: "판정 기준",
    statusGuide: "상태 표시 안내",
    repeatability: [
      "공정: FT#1, ATE, IMAGE, SET검사",
      "조건: 동일 Location 연속 NG 2건+",
      "판정: A급 (Line Stop)",
      "테이블: 각 공정 RAW + IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~ 익일 08:00",
      "※ 수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
    ],
    repeatabilityStatus: [
      "NG(노란색): 불량 발생했으나 연속 동일위치 아님",
      "A급(붉은색): 연속 동일위치 불량 → Line Stop 필요",
    ],
    nonConsecutive: [
      "공정: FT#1, ATE, IMAGE, SET검사",
      "조건: 동일 Location 2건+ (비연속)",
      "판정: B급 (출하중지), A급 제외",
      "테이블: 각 공정 RAW + IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~ 익일 08:00",
      "※ 수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
    ],
    nonConsecutiveStatus: [
      "NG(노란색): 불량 발생했으나 동일위치 반복 아님",
      "B급(주황색): 동일위치 비연속 2건+ → 출하중지",
    ],
    accident: [
      "공정: HIPOT, BURN-IN, ATE",
      "HIPOT: NG 1건+ → A급 (Line Stop)",
      "BURNIN/ATE: 2건+ → A급, 1건 → B급",
      "테이블: 각 공정 RAW 테이블",
      "기간: 당일 08:00 ~ 익일 08:00",
    ],
    accidentStatus: [
      "NG(노란색): 불량 발생했으나 판정 기준 미달",
      "A급(붉은색): HIPOT 1건+ 또는 기타 2건+ → Line Stop",
      "B급(주황색): BURNIN/ATE 1건 발생 → 출하중지",
    ],
    material: [
      "대상: 동일 DEFECT_ITEM_CODE (부품)",
      "A급: 동일 부품 일 3건+ NG",
      "C급: 동일 부품 90일 누적 3건+",
      "테이블: IP_PRODUCT_WORK_QC",
      "기간: A급=당일, C급=90일 누적",
      "※ 수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
    ],
    materialStatus: [
      "NG(노란색): 동일 부품 불량이나 기준 미달",
      "A급(붉은색): 동일 부품 일 3건+ → Line Stop",
      "C급(보라색): 90일 누적 3건+ → 불량개선 필요",
    ],
    openShort: [
      "공정: ICT (W090, W430)",
      "대상: OPEN(B2020) / SHORT(B2030)",
      "판정: 동일 불량코드 일 2건+ → B급",
      "테이블: IP_PRODUCT_WORK_QC",
      "기간: 당일 08:00 ~",
      "※ 수리이력(IP_PRODUCT_WORK_QC)에 등록된 데이터 기준 최종 판정",
    ],
    openShortStatus: [
      "NG(노란색): Open/Short 불량이나 기준 미달",
      "B급(주황색): 동일 불량코드 일 2건+ → 출하중지",
    ],
    indicator: [
      "대상: 모든 공정 (ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET)",
      "내용: 모델별/공정별 주간 불량 건수 비교",
      "기준: 전주 대비 2배 이상 → C급 (불량개선)",
      "주기: 주간 (월요일~일요일)",
    ],
    indicatorStatus: [
      "빨강: 전주 대비 200%↑ 또는 신규 불량 (C급)",
      "노랑: 전주 대비 100~199% (증가)",
      "초록: 전주 대비 100% 미만 (감소)",
      "회색: 불량 없음 (0→0)",
    ],
    fpy: [
      "대상: 모든 공정 (ICT, Hi-Pot, FT, Burn-In, ATE, IMAGE, SET)",
      "내용: 라인별/공정별 당일 직행율",
      "기준: 직행율 90% 미만 → A급 (Line Stop)",
      "기간: 당일 08:00 ~",
    ],
    fpyStatus: [
      "빨강: 직행율 90% 미만 (A급 Line Stop)",
      "노랑: 직행율 90~95%",
      "초록: 직행율 95% 이상",
    ],
    equipment: [
      "대상: 라인별 공정별 설비 정지시간",
      "테이블: IP_LINE_DAILY_OPERATION_HIST",
      "기준: 일 정지시간 60분 이상 → C급",
      "기간: 당일 (F_GET_WORK_ACTUAL_DATE)",
    ],
    equipmentStatus: [
      "빨강: 60분 이상 정지 (C급 불량개선)",
      "노랑: 정지 발생 (60분 미만)",
      "회색: 정지 없음",
    ],
  },

  /* ── 테이블 헤더 ── */
  table: {
    process: "공정",
    status: "상태",
    lastInspect: "최근 검사",
    ngCount: "NG",
    pending: "대기",
    gradeCol: "등급",
    component: "부품",
    type: "유형",
    count: "건수",
    dailyNg: "일 NG",
    cumNg: "90일 NG",
    consecutiveNg: "동일위치 연속 NG",
    sameLocationNg: "동일위치 비연속 NG",
    sameComponent: "동일부품",
    sameBadCode: "동일불량코드",
    noDefectsToday: "금일 불량 없음",
    noDefects: "불량 없음",
    consecutive: "연속불량",
    consecutiveFmt: "연속불량:{count}회({loc})",
    sameLoc: "동일위치",
    sameLocFmt: "동일위치:{count}건({loc})",
    ngGradeFmt: "NG {count}건 ({grade})",
    recentNgDetail: "최근 NG 상세",
    ngDetail: "NG 상세",
    ngAll: "NG 전체",
    time: "시간",
    model: "품목",
    category: "구분",
    location: "위치",
    defectPart: "불량부품",
    repair: "수리",
    handling: "처리",
    badReason: "불량코드",
    inspectResult: "검사결과",
    receipt: "입고",
    repairLabel: "수리",
    ofTotal: "건 중",
    totalCount: "총",
    cases: "건",
    searching: "조회 중...",
    searchFailed: "조회 실패",
    noNgData: "NG 데이터가 없습니다",
    showing: "건 표시 (최대 200건)",
    close: "닫기",
  },

  /* ── 페이지별 ── */
  pages: {
    home: {
      repeatDesc: "A급 연속불량 모니터링. 동일 PID에서 연속 NG 발생 시 라인별 등급 표시.",
      nonConsDesc: "B급 비연속불량 모니터링. 동일 위치 반복 NG를 라인별로 추적 표시.",
      accidentDesc: "HIPOT / BURNIN / ATE 공정 사고성 불량. 공정별 기준 건수 초과 시 등급 판정.",
      materialDesc: "전체 6공정 원자재 주기별점검. 일 3건+ A급, 90일 누적 3건+ C급 불량개선.",
      openShortDesc: "ICT 공정 공용부품 Open/Short 불량. 동일 부품 1일 누적 2건+ B급 출하중지.",
      indicatorDesc: "모델별/공정별 주간 불량률 증가 지표. 전전주→전주→금주 비교.",
      fpyDesc: "라인별/공정별 당일 직행율 모니터링. 90% 미만 시 A급.",
      equipmentDesc: "라인별/공정별 일일 설비 정지시간 모니터링. 60분 이상 정지 시 C급.",
      analysisDesc: "8개 모니터링 종합 분석 보고",
    },
    monitoring: {
      title: "이상점 모니터링",
      subtitle: "반복성 / 사고성",
      gradeALabel: "A급 (Line Stop)",
      gradeBLabel: "B급 (출하중지)",
      okLabel: "정상",
    },
    accident: {
      title: "이상점 모니터링",
      gradeALabel: "A급 (Line Stop)",
      gradeBLabel: "B급 (출하중지)",
    },
    repeatability: {
      title: "CTQ 반복성 모니터링",
      gradeALabel: "A급 (Line Stop)",
      okLabel: "정상",
    },
    nonConsecutive: {
      title: "CTQ 반복성 모니터링",
      gradeBLabel: "B급 (출하중지)",
      okLabel: "정상",
    },
    openShort: {
      title: "CTQ 공용부품 Open/Short",
      gradeBLabel: "B급 (출하중지)",
      noData: "금일 Open/Short 불량이 없습니다.",
    },
    material: {
      title: "CTQ 원자재 동일부품",
      gradeALabel: "A급 (Line Stop)",
      gradeCLabel: "C급 (불량개선)",
    },
    indicator: {
      title: "CTQ 지표 모니터링",
      weekBefore: "전전주",
      lastWeek: "전주",
      thisWeek: "금주",
      thisWeekDays: "일차",
      model: "모델",
      noData: "해당 기간 불량 데이터가 없습니다.",
      newDefect: "신규",
      refreshBtn: "새로고침",
    },
    fpy: {
      title: "직행율 모니터링",
      gradeALabel: "A급 (Line Stop)",
      gradeDesc: "직행율 90% 미만 → Line Stop",
      noData: "현재 조건에 해당하는 검사 데이터가 없습니다.",
    },
    equipment: {
      title: "CTQ 설비이상 모니터링",
      noData: "현재 조건에 해당하는 설비이상 데이터가 없습니다.",
      minuteUnit: "분",
      gradeDesc: "일 정지시간 60분 이상 → 불량개선",
      tableDesc: "테이블: IP_LINE_DAILY_OPERATION_HIST",
      periodDesc: "기간: 당일 (F_GET_WORK_ACTUAL_DATE)",
    },
    analysis: {
      title: "종합분석",
      noIssues: "이상 없음",
      overallStatus: "전체 현황",
      abnormalLines: "이상 라인",
      reportTime: "분석 시점",
      fetchError: "조회 실패",
      section: "상세 보고서",
    },
  },

  /* ── 설정 패널 ── */
  settings: {
    title: "설정",
    dataInterval: "데이터 갱신 주기",
    screenRolling: "화면 롤링",
    rollingInterval: "롤링 전환 주기",
    sec10: "10초",
    sec30: "30초",
    sec60: "60초",
    sec120: "120초",
    sec5: "5초",
    sec15: "15초",
  },

  /* ── 라인 선택 모달 ── */
  lineSelect: {
    title: "모니터링 라인 선택",
    forcedDesc: "모니터링할 라인을 1개 이상 선택해주세요",
    selectedCount: "개 라인 선택됨",
    selectAll: "전체선택",
    deselectAll: "전체해제",
    loadingLines: "라인 목록 로딩 중...",
    cancel: "취소",
    apply: "적용",
  },
  /* ── 시스템 매뉴얼 ── */
  manual: {
    title: "시스템 사용 설명서",
    btnLabel: "매뉴얼",
    overview: "시스템 개요",
    overviewDesc: "CTQ 이상점 모니터링 시스템은 베트남 공장 생산라인의 품질 이상을 실시간으로 감지하여 등급별 대응을 지원합니다.",
    shiftTime: "시프트: 08:00 ~ 익일 08:00 (베트남 현지시간 기준)",
    gradeSystem: "등급 체계",
    gradeADesc: "A급 (Line Stop): 즉시 라인 정지 필요. 붉은색 표시.",
    gradeBDesc: "B급 (출하중지): 주의 필요. 주황색 표시.",
    gradeCDesc: "C급 (불량개선): 개선 조치 필요. 보라색 표시.",
    menuGuide: "메뉴별 기능 안내",
    criteriaLabel: "판정 기준",
    statusLabel: "상태 색상",
    howToUse: "사용 방법",
    howToUse1: "1. 상단 탭에서 모니터링 메뉴 선택",
    howToUse2: "2. [라인선택] 버튼으로 모니터링할 라인 지정",
    howToUse3: "3. 카드/테이블에서 라인별 상태 확인",
    howToUse4: "4. 등급이 표시된 항목은 즉시 조치 필요",
    howToUse5: "5. 새로고침 버튼 또는 자동 갱신으로 최신 데이터 확인",
    langSwitch: "언어 전환: 상단 언어 버튼으로 한국어/English/Tiếng Việt 전환 가능",
  },
} as const;

/** 재귀적 번역 구조 타입 - 문자열 리터럴 대신 string/string[] 사용 */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends readonly string[]
    ? readonly string[]
    : T[K] extends string
      ? string
      : T[K] extends object
        ? DeepStringify<T[K]>
        : T[K];
};

export type TranslationKeys = DeepStringify<typeof ko>;
export default ko;
