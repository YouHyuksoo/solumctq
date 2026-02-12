/**
 * @file src/app/page.tsx
 * @description CTQ 모니터링 랜딩 페이지 - 각 모니터링 화면으로 이동하는 카드 메뉴
 */

import Link from "next/link";

const MENU_ITEMS = [
  {
    href: "/monitoring/repeatability",
    title: "반복성연속",
    description: "A급 연속불량 모니터링. 동일 PID에서 연속 NG 발생 시 라인별 등급 표시.",
    icon: "🔴",
    accent: "border-red-500 hover:bg-red-950/40",
    badge: "A급",
    badgeColor: "bg-red-600",
  },
  {
    href: "/monitoring/non-consecutive",
    title: "반복성동일",
    description: "B급 비연속불량 모니터링. 동일 위치 반복 NG를 라인별로 추적 표시.",
    icon: "🟠",
    accent: "border-orange-500 hover:bg-orange-950/40",
    badge: "B급",
    badgeColor: "bg-orange-600",
  },
  {
    href: "/monitoring/accident",
    title: "사고성",
    description: "HIPOT / BURNIN / ATE 공정 사고성 불량. 공정별 기준 건수 초과 시 등급 판정.",
    icon: "⚡",
    accent: "border-yellow-500 hover:bg-yellow-950/40",
    badge: "A/B급",
    badgeColor: "bg-yellow-600",
  },
  {
    href: "/monitoring/material",
    title: "원자재동일부품",
    description: "전체 6공정 원자재 주기별점검. 일 3건+ A급, 90일 누적 3건+ C급 불량개선.",
    icon: "📦",
    accent: "border-purple-500 hover:bg-purple-950/40",
    badge: "A/C급",
    badgeColor: "bg-purple-600",
  },
  {
    href: "/monitoring/open-short",
    title: "원자재공용부품",
    description: "ICT 공정 공용부품 Open/Short 불량. 동일 부품 1일 누적 2건+ B급 출하중지.",
    icon: "🔌",
    accent: "border-cyan-500 hover:bg-cyan-950/40",
    badge: "B급",
    badgeColor: "bg-cyan-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">CTQ 모니터링</h1>
        <p className="text-gray-400">품질 관리 실시간 모니터링 시스템</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-[1400px] w-full">
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
