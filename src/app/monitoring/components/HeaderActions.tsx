/**
 * @file src/app/monitoring/components/HeaderActions.tsx
 * @description 헤더 우측 액션 버튼 — 매뉴얼 + 언어 전환
 *
 * 초보자 가이드:
 * 1. 모든 모니터링 페이지 헤더 오른쪽 끝에 배치
 * 2. 매뉴얼 아이콘: 클릭 시 SystemManual 모달 열림
 * 3. 언어 아이콘: LanguageSelector 드롭다운
 */

"use client";

import { useState } from "react";
import SystemManual from "./HelpModal";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLocale } from "@/i18n";

export default function HeaderActions() {
  const { t } = useLocale();
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 ml-3">
        <button
          onClick={() => setManualOpen(true)}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title={t("manual.btnLabel") as string}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
        <LanguageSelector />
      </div>
      <SystemManual open={manualOpen} onClose={() => setManualOpen(false)} />
    </>
  );
}
