# 시스템 매뉴얼 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HelpModal을 좌측 사이드바 + 중앙 문서형 스크롤 레이아웃으로 전면 리디자인

**Architecture:** i18n의 navTooltip을 구조화된 manual 객체로 재구성하고, HelpModal.tsx를 사이드바+콘텐츠 레이아웃으로 리빌드. 콘텐츠 데이터가 많으므로 manualData.ts로 분리.

**Tech Stack:** React, TypeScript, Tailwind CSS, createPortal, i18n

---

## File Structure

| 파일 | 역할 | 작업 |
|------|------|------|
| `src/app/monitoring/components/HelpModal.tsx` | 모달 셸 + 사이드바 + 콘텐츠 렌더러 | 전면 리디자인 |
| `src/app/monitoring/components/manualData.ts` | 9개 페이지 × 7섹션 데이터 (다국어) | 신규 생성 |
| `src/i18n/locales/ko.ts` | 기존 navTooltip 유지 (다른 곳에서 참조) | 변경 없음 |
| `src/i18n/locales/en.ts` | 동일 | 변경 없음 |
| `src/i18n/locales/vi.ts` | 동일 | 변경 없음 |

> navTooltip은 MonitoringNav 툴팁에서도 사용되므로 삭제하지 않음. 매뉴얼 전용 데이터는 manualData.ts에 별도 관리.

---

## Task 1: manualData.ts 생성 (매뉴얼 콘텐츠 데이터)

**Files:**
- Create: `src/app/monitoring/components/manualData.ts`

- [ ] **Step 1:** 타입 정의 + 시스템개요 페이지 + 8개 모니터링 페이지 데이터를 ko/en/vi 3개 언어로 작성
- [ ] **Step 2:** 빌드 확인 (`npx next build`)

---

## Task 2: HelpModal.tsx 리디자인

**Files:**
- Modify: `src/app/monitoring/components/HelpModal.tsx` (전면 리라이트)

- [ ] **Step 1:** 사이드바 + 콘텐츠 영역 레이아웃 구현
  - 좌측 200px 사이드바: 9개 페이지 목록
  - 중앙 flex-1: 선택된 페이지의 섹션 렌더링
  - max-w-5xl, max-h-[90vh]

- [ ] **Step 2:** 콘텐츠 영역 섹션 렌더러 구현
  - 번호 매긴 섹션 (1~7)
  - 테이블 렌더러 (공정, 판정기준)
  - 상태 색상 dot 리스트
  - 데이터 흐름 스텝 리스트

- [ ] **Step 3:** 빌드 확인 + 브라우저 테스트

---

## Task 3: 최종 확인 + 커밋

- [ ] **Step 1:** 빌드 성공 확인
- [ ] **Step 2:** 기존 navTooltip 참조가 깨지지 않았는지 확인
- [ ] **Step 3:** 커밋
