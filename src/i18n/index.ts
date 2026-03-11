/**
 * @file src/i18n/index.ts
 * @description i18n 모듈 진입점 - 외부에서 import 편의를 위한 re-export
 */

export { LocaleProvider, useLocale, translateDetail, LOCALE_LABELS, LOCALE_DATE_MAP } from "./LocaleContext";
export type { Locale } from "./LocaleContext";
export type { TranslationKeys } from "./locales/ko";
