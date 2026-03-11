/**
 * @file src/app/page.tsx
 * @description CTQ 모니터링 랜딩 페이지 - 각 모니터링 화면으로 이동하는 카드 메뉴
 */

"use client";

import Link from "next/link";
import { useLocale } from "@/i18n";
import LanguageSelector from "./components/LanguageSelector";

export default function Home() {
  const { t } = useLocale();

  const MENU_ITEMS = [
    {
      href: "/monitoring/repeatability",
      title: t("nav.repeatability") as string,
      description: t("pages.home.repeatDesc") as string,
      icon: "🔴",
      accent: "border-red-500 hover:bg-red-950/40",
      badge: t("grade.a") as string,
      badgeColor: "bg-red-600",
    },
    {
      href: "/monitoring/non-consecutive",
      title: t("nav.nonConsecutive") as string,
      description: t("pages.home.nonConsDesc") as string,
      icon: "🟠",
      accent: "border-orange-500 hover:bg-orange-950/40",
      badge: t("grade.b") as string,
      badgeColor: "bg-orange-600",
    },
    {
      href: "/monitoring/accident",
      title: t("nav.accident") as string,
      description: t("pages.home.accidentDesc") as string,
      icon: "⚡",
      accent: "border-yellow-500 hover:bg-yellow-950/40",
      badge: `${t("grade.a") as string}/${t("grade.b") as string}`,
      badgeColor: "bg-yellow-600",
    },
    {
      href: "/monitoring/material",
      title: t("nav.material") as string,
      description: t("pages.home.materialDesc") as string,
      icon: "📦",
      accent: "border-purple-500 hover:bg-purple-950/40",
      badge: `${t("grade.a") as string}/${t("grade.c") as string}`,
      badgeColor: "bg-purple-600",
    },
    {
      href: "/monitoring/open-short",
      title: t("nav.openShort") as string,
      description: t("pages.home.openShortDesc") as string,
      icon: "🔌",
      accent: "border-cyan-500 hover:bg-cyan-950/40",
      badge: t("grade.b") as string,
      badgeColor: "bg-cyan-600",
    },
    {
      href: "/monitoring/indicator",
      title: t("nav.indicator") as string,
      description: t("pages.home.indicatorDesc") as string,
      icon: "📊",
      accent: "border-emerald-500 hover:bg-emerald-950/40",
      badge: t("grade.c") as string,
      badgeColor: "bg-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">{t("common.ctqMonitoring") as string}</h1>
        <p className="text-gray-400">{t("common.qualitySystem") as string}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] w-full">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group block rounded-xl border-2 bg-gray-900/60 p-6 transition-all duration-200 ${item.accent} hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{item.icon}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
            <h2 className="text-lg font-bold mb-2 group-hover:text-white text-gray-100">
              {item.title}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
