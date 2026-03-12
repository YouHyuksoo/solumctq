/**
 * @file src/app/components/LanguageSelector.tsx
 * @description 언어 전환 드롭다운 - KO/EN/VI 선택
 *
 * 초보자 가이드:
 * 1. 현재 언어 코드(KO/EN/VI) 버튼을 클릭하면 드롭다운 표시
 * 2. 선택하면 localStorage에 저장 + 즉시 UI 반영
 * 3. MonitoringNav와 랜딩 페이지에서 공통 사용
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, LOCALE_LABELS } from "@/i18n";
import type { Locale } from "@/i18n";

const LOCALES: Locale[] = ["ko", "en", "vi"];

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
        title="Language"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {LOCALE_LABELS[locale]}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-xs font-medium text-left whitespace-nowrap transition-colors ${
                locale === loc
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
