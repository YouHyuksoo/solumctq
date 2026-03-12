/**
 * @file src/i18n/LocaleContext.tsx
 * @description 다국어 Context Provider - localStorage 기반 언어 전환
 *
 * 초보자 가이드:
 * 1. **LocaleProvider**: 앱 전체를 감싸서 언어 상태 공유
 * 2. **useLocale()**: 현재 언어, t() 함수, setLocale() 제공
 * 3. **localStorage**: "ctq-locale" 키에 선택 언어 저장
 * 4. **t() 함수**: 중첩 키를 점(.) 구분으로 접근 (예: t("common.loading"))
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import ko from "./locales/ko";
import en from "./locales/en";
import vi from "./locales/vi";
import type { TranslationKeys } from "./locales/ko";

export type Locale = "ko" | "en" | "vi";

const LOCALES: Record<Locale, TranslationKeys> = { ko, en, vi };
const STORAGE_KEY = "ctq-locale";
const DEFAULT_LOCALE: Locale = "ko";

/** 언어별 toLocaleTimeString에 사용할 locale 문자열 */
export const LOCALE_DATE_MAP: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  vi: "vi-VN",
};

/** 언어 표시 라벨 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  vi: "Tiếng Việt",
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string | readonly string[];
  dateLocale: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && saved in LOCALES) {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string | readonly string[] => {
      const keys = key.split(".");
      let value: unknown = LOCALES[locale];
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // fallback: 키 자체를 반환
        }
      }
      return value as string | readonly string[];
    },
    [locale]
  );

  const dateLocale = LOCALE_DATE_MAP[locale];

  const value = useMemo(
    () => ({ locale, setLocale, t, dateLocale }),
    [locale, setLocale, t, dateLocale]
  );

  if (!mounted) return null;

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/**
 * API에서 내려오는 코드형 detail 문자열을 현재 언어로 번역
 * 예: "consecutive:2(LOC1)" → "연속불량:2회(LOC1)"
 */
export function translateDetail(detail: string | null, t: (key: string) => string | readonly string[]): string | null {
  if (!detail) return null;

  // consecutive:2(LOC_CODE)
  const consMatch = detail.match(/^consecutive:(\d+)\((.+)\)$/);
  if (consMatch) {
    return (t("table.consecutiveFmt") as string)
      .replace("{count}", consMatch[1])
      .replace("{loc}", consMatch[2]);
  }

  // consecutive(LOC_CODE) - monitoring route format
  const consSimple = detail.match(/^consecutive\((.+)\)$/);
  if (consSimple) {
    return `${t("table.consecutive") as string}(${consSimple[1]})`;
  }

  // sameLoc:3(LOC_CODE)
  const sameMatch = detail.match(/^sameLoc:(\d+)\((.+)\)$/);
  if (sameMatch) {
    return (t("table.sameLocFmt") as string)
      .replace("{count}", sameMatch[1])
      .replace("{loc}", sameMatch[2]);
  }

  // NG:5(A) or NG:5(B)
  const ngMatch = detail.match(/^NG:(\d+)\(([AB])\)$/);
  if (ngMatch) {
    const gradeLabel = t(`grade.${ngMatch[2].toLowerCase()}`) as string;
    return (t("table.ngGradeFmt") as string)
      .replace("{count}", ngMatch[1])
      .replace("{grade}", gradeLabel);
  }

  // NG:5 (monitoring route)
  const ngSimple = detail.match(/^NG:(\d+)$/);
  if (ngSimple) {
    return `NG:${ngSimple[1]}`;
  }

  // combined details with " / "
  if (detail.includes(" / ")) {
    return detail.split(" / ").map(d => translateDetail(d, t) ?? d).join(" / ");
  }

  return detail;
}
