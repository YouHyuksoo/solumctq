# 종합분석 대시보드 설계서

## 1. 목적

8개 이상점 모니터링 데이터를 현재 시점 기준으로 한 화면에 종합 요약하고, 이상이 있는 라인/공정을 상세 보고서 형태로 제공한다.

## 2. 데이터 소스

새 API 없이 기존 8개 API를 프론트에서 `Promise.all`로 병렬 호출하여 집계한다.

| # | API | 등급 |
|---|-----|------|
| 1 | `/api/ctq/repeatability` | A |
| 2 | `/api/ctq/non-consecutive` | B |
| 3 | `/api/ctq/accident` | A/B |
| 4 | `/api/ctq/material` | A/C |
| 5 | `/api/ctq/open-short` | B |
| 6 | `/api/ctq/indicator` | C |
| 7 | `/api/ctq/fpy` | A |
| 8 | `/api/ctq/equipment` | C |

- `useLineFilter()` 연동: `selectedLines` 배열을 `?lines=LINE1,LINE2,...` 쿼리 파라미터로 8개 API 모두 동일하게 전달
- 자동 갱신 없음, 수동 새로고침 버튼
- 조회 시점 타임스탬프 표시

## 3. 페이지 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  헤더: MonitoringNav + HeaderActions                 │
├─────────────────────────────────────────────────────┤
│  ■ 요약 대시보드 (상단)                               │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  │반복성 │비연속 │사고성 │원자재 │공용  │지표  │FPY  │설비  │
│  │ A:2  │ B:1  │ OK   │ A:1  │ B:3  │ C:5  │ A:1  │ OK   │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
│  전체 현황: A급 4건 | B급 4건 | C급 5건 | 정상 12건      │
├─────────────────────────────────────────────────────┤
│  ■ 상세 보고서 (하단, 스크롤)                          │
│                                                     │
│  1. 반복성 (연속불량)                                  │
│     LINE-01: FT A급 - Location L001 연속 2건          │
│     LINE-03: ATE A급 - Location L005 연속 3건         │
│                                                     │
│  2. 비연속 불량                                       │
│     LINE-02: FT B급 - Location L002 비연속 2건         │
│                                                     │
│  (이상 없는 항목은 "이상 없음" 한 줄로 표시)              │
└─────────────────────────────────────────────────────┘
```

### 3.1 요약 카드 (8개)

- 각 모니터링별 1개 카드
- 카드 내용: 모니터링명, 최고 등급 배지, **이상 라인 수** (overallGrade가 "OK"가 아닌 라인 수)
- 카드 색상: 최고 등급에 따라 (A=빨강 테두리, B=주황, C=보라, OK=초록)
- 클릭 시 하단 해당 섹션으로 smooth 스크롤 + 해당 섹션 헤더 강조 애니메이션

### 3.2 전체 현황 바

- 8개 모니터링의 **라인별 최고 등급** 기준 합산
  - A급 N건: overallGrade="A"인 라인 총 수 (중복 라인은 최고 등급 1회만)
  - B급 N건, C급 N건, 정상 N건
- 등급별 색상 배지로 표시

### 3.3 상세 보고서 (8개 섹션)

섹션 순서: 요약 카드 순서와 동일 (반복성 → 비연속 → 사고성 → 원자재 → 공용 → 지표 → FPY → 설비)

각 섹션 구조:
- 섹션 번호 + 모니터링명 + 최고 등급 배지
- **이상이 있는 라인만** 테이블로 표시 (overallGrade !== "OK")
  - 반복성/비연속/사고성/원자재/공용: 라인명 | 공정 | 등급 | NG건수(process.ngCount) | 상세(process.detail)
- 이상 없으면 "이상 없음" 한 줄 표시

### 3.4 FPY/설비/지표 섹션 차이

- FPY: 라인명 | 공정 | 직행율(%) | 전일 대비(증감)
  - overallGrade="A"인 라인만 (직행율 90% 미만)
- 설비: 라인명 | 공정 | 정지시간(분) | 등급
  - overallGrade !== "OK" 라인만
- 지표: 모델(itemCode) | 공정 | 전주 건수 | 금주 건수 | 증감율(%)
  - 등급 C 이상만

## 4. 파일 구조

| 파일 | 역할 | 예상 줄 수 |
|------|------|-----------|
| `src/app/monitoring/analysis/page.tsx` | 페이지 셸 + 요약 대시보드 | ~200 |
| `src/app/monitoring/analysis/components/SummaryCards.tsx` | 8개 요약 카드 | ~100 |
| `src/app/monitoring/analysis/components/DetailReport.tsx` | 상세 보고서 8섹션 | ~200 |
| `src/app/monitoring/analysis/hooks/useAnalysis.ts` | 8개 API 병렬 호출 + 집계 | ~150 |
| `src/app/monitoring/analysis/types.ts` | 종합분석 전용 타입 | ~50 |

### useAnalysis.ts 집계 로직

```
1. Promise.all로 8개 API 호출 (각 API에 동일한 lines 파라미터 전달)
2. 각 응답에서 lines 배열 추출
3. 모니터링별 요약 생성:
   - highestGrade: 해당 모니터링의 라인 중 최고 등급
   - abnormalCount: overallGrade !== "OK"인 라인 수
   - abnormalLines: 이상 라인 배열 (보고서용)
4. 전체 현황 집계:
   - 8개 모니터링 × N개 라인에서 (라인코드, 최고등급) 기준 중복 제거 후 등급별 카운트
5. 정렬: 각 모니터링의 이상 라인은 등급순(A→B→C) → 라인명순
```

## 5. 기존 파일 수정

| 파일 | 변경 |
|------|------|
| `src/app/page.tsx` | 종합분석 카드 추가 (9번째) |
| `src/app/monitoring/components/MonitoringNav.tsx` | 종합분석 탭 추가 |
| `src/i18n/locales/ko.ts` | 종합분석 관련 번역 키 추가 |
| `src/i18n/locales/en.ts` | 동일 |
| `src/i18n/locales/vi.ts` | 동일 |
| `src/app/monitoring/components/manualData.ts` | 종합분석 매뉴얼 데이터 추가 |

### 필수 다국어 키

```
nav.analysis: "종합분석" / "Analysis" / "Phân tích"
pages.analysis.title: "종합분석" / "Comprehensive Analysis" / "Phân tích tổng hợp"
pages.analysis.noIssues: "이상 없음" / "No Issues" / "Không có vấn đề"
pages.analysis.overallStatus: "전체 현황" / "Overall Status" / "Tình trạng chung"
pages.analysis.abnormalLines: "이상 라인" / "Abnormal Lines" / "Line bất thường"
pages.analysis.reportTime: "분석 시점" / "Report Time" / "Thời gian phân tích"
pages.home.analysisDesc: "8개 모니터링 종합 분석 보고" / "Comprehensive analysis of all 8 monitors" / "Phân tích tổng hợp 8 giám sát"
```

## 6. 에러/엣지 케이스 처리

| 상황 | 처리 |
|------|------|
| 로딩 중 | 요약 카드 8개 스켈레톤 + 보고서 영역 스피너 |
| API 일부 실패 | 실패한 모니터링 카드에 "조회 실패" 표시, 나머지는 정상 렌더링 |
| 전체 실패 | 에러 메시지 배너 + 재시도 버튼 |
| 데이터 없음 (선택 라인 0건) | "이상 없음" 빈 상태 |
| API 타임아웃 | fetch에 10초 AbortController 타임아웃 적용 |

## 7. 다크 테마

- 기존 모니터링 페이지와 동일한 다크 테마 (gray-900/950 계열)
- 요약 카드: `bg-gray-900/70 border-2` + 등급별 border 색상
- 보고서 섹션: `bg-gray-900/50` 배경, 테이블 `border-gray-800`

## 8. 기술 구현

- 라우트: `/monitoring/analysis`
- `useLineFilter()` 컨텍스트 공유 (기존 layout.tsx의 LineFilterProvider 내부)
- 수동 새로고침만 (자동 갱신/롤링 없음)
- 로딩 중 스켈레톤 또는 스피너 표시
