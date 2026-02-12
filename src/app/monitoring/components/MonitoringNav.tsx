/**
 * @file src/app/monitoring/components/MonitoringNav.tsx
 * @description CTQ 모니터링 상단 네비게이션 탭
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/monitoring/repeatability", label: "반복성연속" },
  { href: "/monitoring/non-consecutive", label: "반복성동일" },
  { href: "/monitoring/accident", label: "사고성" },
  { href: "/monitoring/material", label: "원자재동일부품" },
  { href: "/monitoring/open-short", label: "원자재공용부품" },
];

export default function MonitoringNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 bg-gray-900/60 rounded-lg p-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
