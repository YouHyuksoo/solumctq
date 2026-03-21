/**
 * @file src/app/page.tsx
 * @description 이상점 모니터링 랜딩 페이지 - 각 모니터링 화면으로 이동하는 카드 메뉴
 */

"use client";

import Link from "next/link";
import { useLocale } from "@/i18n";
import LanguageSelector from "./components/LanguageSelector";

/** 심플 SVG 아이콘 컴포넌트 */
const Icons = {
  /** 반복성 - 새로고침/반복 */
  repeat: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.1 15A7 7 0 0118.9 9M18.9 9L20 4M18.9 15a7 7 0 01-13.8 0M5.1 9L4 20" />
    </svg>
  ),
  /** 비연속 - 끊긴 링크 */
  unlink: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 11h1a3 3 0 010 6h-1m-8 0H6a3 3 0 010-6h1m1-4l-1-1m10 0l1-1m-5-2V3m0 18v-2" />
    </svg>
  ),
  /** 사고성 - 경고 삼각형 */
  warning: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  /** 재질 - 큐브/박스 */
  cube: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  /** 오픈/숏 - 볼트/전기 */
  bolt: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  /** 인디케이터 - 차트바 */
  chart: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  /** FPY - 트렌드 상승 */
  trending: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  /** 설비 - 렌치 */
  wrench: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 5.1a2.121 2.121 0 01-3-3l5.1-5.1m0 0L15 4.5a3.5 3.5 0 014.95 4.95l-7.53 5.72z" />
    </svg>
  ),
  /** 종합분석 - 클립보드 체크 */
  clipboard: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

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
      icon: Icons.repeat,
      accent: "border-red-500 hover:bg-red-950/40",
      badge: t("grade.a") as string,
      badgeColor: "bg-red-600",
    },
    {
      href: "/monitoring/non-consecutive",
      title: t("nav.nonConsecutive") as string,
      description: t("pages.home.nonConsDesc") as string,
      icon: Icons.unlink,
      accent: "border-orange-500 hover:bg-orange-950/40",
      badge: t("grade.b") as string,
      badgeColor: "bg-orange-600",
    },
    {
      href: "/monitoring/accident",
      title: t("nav.accident") as string,
      description: t("pages.home.accidentDesc") as string,
      icon: Icons.warning,
      accent: "border-yellow-500 hover:bg-yellow-950/40",
      badge: `${t("grade.a") as string}/${t("grade.b") as string}`,
      badgeColor: "bg-yellow-600",
    },
    {
      href: "/monitoring/material",
      title: t("nav.material") as string,
      description: t("pages.home.materialDesc") as string,
      icon: Icons.cube,
      accent: "border-purple-500 hover:bg-purple-950/40",
      badge: `${t("grade.a") as string}/${t("grade.c") as string}`,
      badgeColor: "bg-purple-600",
    },
    {
      href: "/monitoring/open-short",
      title: t("nav.openShort") as string,
      description: t("pages.home.openShortDesc") as string,
      icon: Icons.bolt,
      accent: "border-cyan-500 hover:bg-cyan-950/40",
      badge: t("grade.b") as string,
      badgeColor: "bg-cyan-600",
    },
    {
      href: "/monitoring/indicator",
      title: t("nav.indicator") as string,
      description: t("pages.home.indicatorDesc") as string,
      icon: Icons.chart,
      accent: "border-emerald-500 hover:bg-emerald-950/40",
      badge: t("grade.c") as string,
      badgeColor: "bg-emerald-600",
    },
    {
      href: "/monitoring/fpy",
      title: t("nav.fpy") as string,
      description: t("pages.home.fpyDesc") as string,
      icon: Icons.trending,
      accent: "border-teal-500 hover:bg-teal-950/40",
      badge: t("grade.a") as string,
      badgeColor: "bg-teal-600",
    },
    {
      href: "/monitoring/equipment",
      title: t("nav.equipment") as string,
      description: t("pages.home.equipmentDesc") as string,
      icon: Icons.wrench,
      accent: "border-slate-500 hover:bg-slate-950/40",
      badge: t("grade.c") as string,
      badgeColor: "bg-slate-600",
    },
    {
      href: "/monitoring/repair-status",
      title: t("nav.repairStatus") as string,
      description: t("pages.home.repairStatusDesc") as string,
      icon: Icons.wrench,
      accent: "border-rose-500 hover:bg-rose-950/40",
      badge: "-",
      badgeColor: "bg-rose-600",
    },
    {
      href: "/monitoring/equipment-history",
      title: t("nav.equipmentHistory") as string,
      description: t("pages.home.equipmentHistoryDesc") as string,
      icon: Icons.clipboard,
      accent: "border-indigo-500 hover:bg-indigo-950/40",
      badge: "-",
      badgeColor: "bg-indigo-600",
    },
    {
      href: "/monitoring/analysis",
      title: t("nav.analysis") as string,
      description: t("pages.home.analysisDesc") as string,
      icon: Icons.clipboard,
      accent: "border-blue-500 hover:bg-blue-950/40",
      badge: "ALL",
      badgeColor: "bg-blue-600",
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
              <span className="text-gray-300 group-hover:text-white transition-colors">{item.icon}</span>
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
