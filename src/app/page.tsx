/**
 * @file src/app/page.tsx
 * @description 이상점 모니터링 랜딩 페이지 - 각 모니터링 화면으로 이동하는 카드 메뉴
 */

"use client";

import Link from "next/link";
import { useLocale } from "@/i18n";
import LanguageSelector from "./components/LanguageSelector";

const ORB_CONFIGS = [
  { w: 700, h: 700, top: "-10%", left: "5%", bg: "radial-gradient(circle, rgba(239,68,68,0.6), rgba(168,85,247,0.4), transparent 70%)", dur: "12s", kf: "aurora1" },
  { w: 800, h: 800, top: "50%", left: "70%", bg: "radial-gradient(circle, rgba(59,130,246,0.55), rgba(16,185,129,0.4), transparent 70%)", dur: "15s", kf: "aurora2" },
  { w: 600, h: 600, top: "25%", left: "40%", bg: "radial-gradient(circle, rgba(250,204,21,0.5), rgba(244,114,182,0.35), transparent 70%)", dur: "10s", kf: "aurora3" },
];

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
    {
      href: "/monitoring/fpy",
      title: t("nav.fpy") as string,
      description: t("pages.home.fpyDesc") as string,
      icon: "📈",
      accent: "border-teal-500 hover:bg-teal-950/40",
      badge: t("grade.a") as string,
      badgeColor: "bg-teal-600",
    },
    {
      href: "/monitoring/equipment",
      title: t("nav.equipment") as string,
      description: t("pages.home.equipmentDesc") as string,
      icon: "🔧",
      accent: "border-slate-500 hover:bg-slate-950/40",
      badge: t("grade.c") as string,
      badgeColor: "bg-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* 키프레임 정의 */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(120px, -100px) scale(1.4); opacity: 0.9; }
          66% { transform: translate(-80px, 60px) scale(0.9); opacity: 0.5; }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          33% { transform: translate(-110px, 80px) scale(1.3); opacity: 0.85; }
          66% { transform: translate(90px, -50px) scale(0.85); opacity: 0.4; }
        }
        @keyframes aurora3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(60px, 80px) scale(1.5); opacity: 0.8; }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%) rotate(-15deg); }
          100% { transform: translateX(300%) rotate(-15deg); }
        }
      `}</style>

      {/* 오로라 구체들 */}
      {ORB_CONFIGS.map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: orb.w,
            height: orb.h,
            top: orb.top,
            left: orb.left,
            borderRadius: "50%",
            background: orb.bg,
            filter: "blur(100px)",
            pointerEvents: "none",
            animation: `${orb.kf} ${orb.dur} ease-in-out infinite`,
          }}
        />
      ))}

      {/* 스포트라이트 빛줄기 */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-50%",
            width: "25%",
            height: "200%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent)",
            animation: "sweep 6s ease-in-out infinite",
          }}
        />
      </div>

      <div className="absolute top-4 right-4" style={{ zIndex: 10 }}>
        <LanguageSelector />
      </div>
      <div className="text-center mb-12" style={{ position: "relative", zIndex: 10 }}>
        <h1
          className="text-5xl font-bold mb-3 bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(to right, #f87171, #facc15, #4ade80, #60a5fa, #a78bfa, #f472b6)" }}
        >
          {t("common.ctqMonitoring") as string}
        </h1>
        <p className="text-gray-400 text-lg">{t("common.qualitySystem") as string}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] w-full" style={{ position: "relative", zIndex: 10 }}>
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group block rounded-xl border-2 bg-gray-900/70 backdrop-blur-sm p-6 transition-all duration-200 ${item.accent} hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40`}
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
