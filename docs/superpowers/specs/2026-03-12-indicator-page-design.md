# 지표(Indicator) 페이지 설계

## 개요
MonitoringNav에 "지표" 탭을 추가하여 모델(ITEM_CODE) × 공정 매트릭스 테이블로 전전주/전주/금주 불량 건수를 비교 표시하는 페이지.

## 요구사항
- 행: 모델(ITEM_CODE) — 해당 기간 불량 1건 이상인 모델만 표시
- 열: 7개 공정 × 3컬럼(전전주/전주/금주)
- 주 시작: 월요일
- 비율 색상: 200%↑ 빨강(C급), 100~199% 노랑, 100%↓ 초록, 0→0 회색
- 갱신: 페이지 진입 시 1회 조회 + 수동 새로고침 버튼
- 라인 필터: 기존 LineFilterContext 공유
- i18n: 한국어/영어/베트남어 3개 언어 지원
- 정렬: 총 불량 건수(3주 합산) 내림차순
- 빈 데이터: "해당 기간 불량 데이터가 없습니다" 메시지 표시

## 데이터 흐름

### API: GET /api/ctq/indicator

**쿼리 로직:**
1. 현재 날짜 기준 3주치 월~일 범위 계산 (월요일 시작)
2. 7개 RAW 테이블 **병렬** 조회:
   - `RAW.PID = IP_PRODUCT_2D_BARCODE.SERIAL_NO` JOIN으로 ITEM_CODE 취득
   - NG 필터: 각 테이블의 resultCol 기준 `NOT IN ('PASS','GOOD','OK')`
   - `LINE_CODE IN (...)` 라인 필터 적용 (RAW 테이블에 LINE_CODE 직접 존재)
   - ITEM_CODE + 주차별 GROUP BY COUNT
3. 불량 1건 이상인 ITEM_CODE만 반환

**공정 테이블 매핑:**

| 공정 | 테이블 | 날짜컬럼 | PID컬럼 | 결과컬럼 | 날짜타입 |
|------|--------|----------|---------|----------|----------|
| ICT | IQ_MACHINE_ICT_SERVER_DATA_RAW | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| Hi-Pot | IQ_MACHINE_HIPOT_POWER_DATA_RAW | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| FT | IQ_MACHINE_FT1_SMPS_DATA_RAW | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| Burn-In | IQ_MACHINE_BURNIN_DATA_RAW | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| ATE | IQ_MACHINE_ATE_SERVER_DATA_RAW | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| IMAGE | IQ_MACHINE_INSPECT_DATA_PBA_FT | INSPECT_DATE | PID | INSPECT_RESULT | varchar |
| SET | IQ_MACHINE_INSPECT_DATA_PBA_TVSET | INSPECT_DATE | PID | INSPECT_RESULT | varchar |

**응답 구조:**
```ts
{
  models: [{
    itemCode: string,
    processes: {
      [processKey: string]: {
        weekBefore: number,  // 전전주 불량 건수
        lastWeek: number,    // 전주 불량 건수
        thisWeek: number,    // 금주 불량 건수
      }
    }
  }],
  weekRanges: {
    weekBefore: { start: string, end: string },
    lastWeek: { start: string, end: string },
    thisWeek: { start: string, end: string },
  },
  thisWeekDays: number,  // 금주 경과 일수 (1~7)
  lastUpdated: string
}
```

## UI 구성

### 테이블 레이아웃 (B형식)
```
| 모델     | ----ICT---- | ---Hi-Pot--- | ----FT---- | ... |
|          | 전전주 | 전주 | 금주 | 전전주 | 전주 | 금주 | ... |
|----------|--------|------|------|--------|------|------|-----|
| SLM-A100 |   3    | 2(67%) | 5(250%) | 0 | 0 | 0 | ... |
| SLM-B200 |   1    | 4(400%) | 9(225%) | 1 | 2(200%) | 1(50%) | ... |
```

- 전전주: 기준값 (색상 없음, 흰색)
- 전주: 전전주 대비 비율 표시 + 색상
- 금주: 전주 대비 비율 표시 + 색상
- 금주 헤더에 "(N일차)" 표시 (불완전 주 안내)

### 비율 표시 규칙
| 조건 | 표시 | 색상 |
|------|------|------|
| 이전주 N → 현주 M (N>0) | M건 (M/N×100%) | 비율에 따른 색상 |
| 0 → 0 | 0 | 회색(#888) |
| 0 → N (신규 발생) | N건 (신규) | 빨강(#f87171) |
| N → 0 (불량 해소) | 0 (0%) | 초록(#4ade80) |

### 색상 규칙
| 비율 범위 | 색상 | 의미 |
|-----------|------|------|
| 200%↑ | 빨강(#f87171) | C급 기준 초과 |
| 100~199% | 노랑(#facc15) | 증가 |
| 100% 미만 | 초록(#4ade80) | 감소 |
| 0→0 | 회색(#888) | 데이터 없음 |
| 0→N (신규) | 빨강(#f87171) | 신규 불량 발생 |

### 기능
- 수동 새로고침 버튼
- 기존 라인 필터 공유
- MonitoringNav에 "지표" 탭 추가 (tooltipKey, statusKey 포함)

## 파일 구조
```
src/app/monitoring/indicator/
  page.tsx                        — 페이지 컴포넌트
  types.ts                        — 타입 정의
  hooks/useIndicator.ts           — 데이터 fetch 훅
  components/IndicatorTable.tsx   — 테이블 컴포넌트
src/app/api/ctq/indicator/route.ts — API 라우트
```

## 수정 대상 기존 파일
- `src/app/monitoring/components/MonitoringNav.tsx` — "지표" 탭 추가 (tooltipKey, statusKey 포함)
- `src/i18n/locales/ko.ts` — 지표 관련 번역 키 추가
- `src/i18n/locales/en.ts` — 영어 번역
- `src/i18n/locales/vi.ts` — 베트남어 번역

## 주간 범위 계산 로직
```
현재 날짜에서 가장 가까운 이전 월요일 = 금주 시작
금주 시작 - 7일 = 전주 시작
전주 시작 - 7일 = 전전주 시작
각 주는 월요일 00:00 ~ 다음 월요일 00:00
금주만 월요일 00:00 ~ 현재 시각
thisWeekDays = (현재 요일 - 월요일 + 7) % 7 + 1 (월=1, 화=2, ..., 일=7)
```

## 참고: 다크 모드
프로젝트 전체가 다크 테마 기반 (bg-gray-950). 별도 라이트 모드 지원 불필요.
