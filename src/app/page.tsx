/**
 * @file src/app/page.tsx
 * @description 이상점 모니터링 랜딩 페이지 — Factory Control Room 컨셉
 *
 * 초보자 가이드:
 * 1. 상단: 시스템 브랜딩 + 등급 체계 시각화
 * 2. 중앙: 공장 품질 관제 대시보드 느낌의 히어로
 * 3. 하단: 바로가기 내비게이션 바
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n";
import LanguageSelector from "./components/LanguageSelector";
import AmbientCharts from "./components/AmbientCharts";

const SHORTCUTS = [
  { href: "/monitoring/repeatability", label: "반복성", color: "#ef4444" },
  { href: "/monitoring/non-consecutive", label: "비연속", color: "#f97316" },
  { href: "/monitoring/accident", label: "사고성", color: "#eab308" },
  { href: "/monitoring/material", label: "원자재", color: "#a855f7" },
  { href: "/monitoring/open-short", label: "Open/Short", color: "#06b6d4" },
  { href: "/monitoring/indicator", label: "지표", color: "#10b981" },
  { href: "/monitoring/fpy", label: "직행율", color: "#14b8a6" },
  { href: "/monitoring/equipment", label: "설비이상", color: "#64748b" },
  { href: "/monitoring/repair-status", label: "수리상태", color: "#f43f5e" },
  { href: "/monitoring/equipment-history", label: "설비이력", color: "#6366f1" },
  { href: "/monitoring/quality-dashboard", label: "품질분석", color: "#0ea5e9" },
  { href: "/monitoring/analysis", label: "종합분석", color: "#3b82f6" },
];

const GRADES = [
  { grade: "A", label: "Line Stop", desc: "즉시 라인 정지", color: "#ef4444", pulse: true },
  { grade: "B", label: "Ship Hold", desc: "출하 중지", color: "#f97316", pulse: false },
  { grade: "C", label: "Improve", desc: "불량 개선", color: "#a855f7", pulse: false },
];

export default function Home() {
  const { t } = useLocale();
  const [time, setTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const vn = new Date(utc + 7 * 3600000);
      setTime(vn.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#060a10] text-white overflow-hidden" style={{ position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;700&display=swap');
        .font-orbitron { font-family: 'Orbitron', monospace; }
        .font-noto { font-family: 'Noto Sans KR', sans-serif; }
        @keyframes gridScroll { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes scanline { 0% { top: -4px; } 100% { top: 100%; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 8px var(--c), 0 0 20px var(--c); } 50% { box-shadow: 0 0 16px var(--c), 0 0 40px var(--c); } }
        .grade-pulse { animation: glow 2s ease-in-out infinite; }
        .fade-in { animation: fadeInUp 0.6s ease-out both; }
        .sc-link { transition: all 0.2s; }
        .sc-link:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
      `}</style>

      {/* 배경 그리드 */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.04 }}>
        <div style={{
          position: "absolute", inset: "-40px",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "gridScroll 4s linear infinite",
        }} />
      </div>

      {/* 좌우 순환 차트 */}
      <AmbientCharts side="left" />
      <AmbientCharts side="right" />

      {/* 스캔라인 */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "4px",
          background: "linear-gradient(180deg, transparent, rgba(59,130,246,0.08), transparent)",
          animation: "scanline 3s linear infinite",
        }} />
      </div>

      {/* 상단 바 */}
      <div className="shrink-0 border-b border-gray-800/60 px-6 py-3 flex items-center justify-between" style={{ position: "relative", zIndex: 10 }}>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-orbitron text-[10px] text-gray-500 tracking-[0.3em] uppercase">System Online</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-orbitron text-xs text-gray-400 tracking-wider">
            VN UTC+7 {mounted ? time : "--:--:--"}
          </span>
          <LanguageSelector />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8" style={{ position: "relative", zIndex: 10 }}>
        {/* 시스템 타이틀 */}
        <div className="text-center fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="font-orbitron text-[10px] text-blue-400/60 tracking-[0.5em] uppercase mb-4">
            Solum Vietnam Manufacturing
          </div>
          <h1 className="font-orbitron text-4xl md:text-5xl font-black tracking-tight mb-3"
            style={{ background: "linear-gradient(135deg, #e2e8f0 0%, #60a5fa 50%, #e2e8f0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CTQ MONITORING
          </h1>
          <p className="font-noto text-sm text-gray-500 font-light tracking-wide">
            {t("common.qualitySystem") as string}
          </p>
        </div>

        {/* 등급 체계 인디케이터 */}
        <div className="flex items-center gap-8 mt-12 fade-in" style={{ animationDelay: "0.3s" }}>
          {GRADES.map((g) => (
            <div key={g.grade} className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${g.pulse ? "grade-pulse" : ""}`}
                style={{ borderColor: g.color, background: `${g.color}15`, "--c": g.color } as React.CSSProperties}
              >
                <span className="font-orbitron text-xl font-black" style={{ color: g.color }}>{g.grade}</span>
              </div>
              <div className="text-center">
                <div className="font-orbitron text-[10px] font-bold tracking-wider" style={{ color: g.color }}>{g.label}</div>
                <div className="font-noto text-[10px] text-gray-500 mt-0.5">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 들어가기 버튼 */}
        <Link href="/monitoring/repeatability"
          className="mt-10 px-8 py-3 rounded-lg border border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 hover:text-white font-orbitron text-sm tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 fade-in"
          style={{ animationDelay: "0.5s" }}>
          ENTER MONITORING
        </Link>

        {/* 공정 흐름 다이어그램 */}
        <div className="flex items-center gap-1 mt-8 fade-in" style={{ animationDelay: "0.6s" }}>
          {["ICT", "Hi-Pot", "FT", "Burn-In", "ATE", "IMAGE", "SET"].map((proc, i) => (
            <div key={proc} className="flex items-center">
              <div className="px-3 py-1.5 rounded border border-gray-700/50 bg-gray-900/40 backdrop-blur">
                <span className="font-orbitron text-[9px] text-gray-400 tracking-wider">{proc}</span>
              </div>
              {i < 6 && (
                <svg className="w-4 h-4 text-gray-700 mx-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 바로가기 */}
      <div className="shrink-0 border-t border-gray-800/60 px-4 py-3 fade-in" style={{ position: "relative", zIndex: 10, animationDelay: "0.7s" }}>
        <div className="flex items-center gap-1 justify-center flex-wrap max-w-[1400px] mx-auto">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href}
              className="sc-link flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-800/50 bg-gray-900/30 backdrop-blur group">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: s.color }} />
              <span className="font-noto text-[11px] text-gray-400 group-hover:text-gray-200 whitespace-nowrap transition-colors">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
