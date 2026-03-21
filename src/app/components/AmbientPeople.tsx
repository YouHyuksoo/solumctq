/**
 * @file src/app/components/AmbientPeople.tsx
 * @description 랜딩 페이지 오른쪽 — 공장/사무 인물 SVG 일러스트 순환
 *
 * 초보자 가이드:
 * 1. 미니멀 SVG 실루엣: 생산라인 작업자, 검사원, 사무직원
 * 2. 4초마다 순환하며 페이드 전환
 */

"use client";

import { useState, useEffect } from "react";

function Worker() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-full">
      {/* 컨베이어 벨트 */}
      <rect x="10" y="85" width="140" height="6" rx="3" fill="#1e3a5f" opacity="0.5" />
      <rect x="30" y="78" width="18" height="12" rx="2" fill="#3b82f6" opacity="0.4" />
      <rect x="70" y="78" width="18" height="12" rx="2" fill="#60a5fa" opacity="0.3" />
      <rect x="110" y="78" width="18" height="12" rx="2" fill="#3b82f6" opacity="0.35">
        <animate attributeName="x" values="110;130;110" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* 사람 - 작업자 */}
      <circle cx="80" cy="35" r="8" fill="#94a3b8" opacity="0.6" />
      <rect x="74" y="44" width="12" height="20" rx="4" fill="#64748b" opacity="0.5" />
      {/* 팔 - 작업 중 */}
      <line x1="74" y1="50" x2="62" y2="62" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.5">
        <animate attributeName="y2" values="62;58;62" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="86" y1="50" x2="98" y2="60" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.5">
        <animate attributeName="y2" values="60;56;60" dur="2.5s" repeatCount="indefinite" />
      </line>
      {/* 다리 */}
      <line x1="77" y1="64" x2="74" y2="80" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="83" y1="64" x2="86" y2="80" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* 안전모 */}
      <path d="M72 32 Q80 22 88 32" fill="#facc15" opacity="0.4" />
      {/* 라벨 */}
      <text x="80" y="110" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="sans-serif">Production Line</text>
    </svg>
  );
}

function Inspector() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-full">
      {/* 검사대 */}
      <rect x="85" y="55" width="50" height="35" rx="3" fill="#1e293b" opacity="0.5" />
      <rect x="90" y="60" width="20" height="14" rx="2" fill="#3b82f6" opacity="0.3" />
      {/* 돋보기 효과 */}
      <circle cx="100" cy="67" r="6" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5">
        <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* 사람 - 검사원 */}
      <circle cx="60" cy="30" r="8" fill="#94a3b8" opacity="0.6" />
      <rect x="54" y="39" width="12" height="22" rx="4" fill="#475569" opacity="0.5" />
      {/* 팔 - 검사 중 */}
      <line x1="66" y1="45" x2="88" y2="55" stroke="#475569" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="54" y1="45" x2="42" y2="55" stroke="#475569" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* 클립보드 */}
      <rect x="36" y="50" width="12" height="16" rx="2" fill="#94a3b8" opacity="0.3" />
      <line x1="39" y1="55" x2="45" y2="55" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
      <line x1="39" y1="58" x2="45" y2="58" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
      <line x1="39" y1="61" x2="44" y2="61" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
      {/* 다리 */}
      <line x1="57" y1="61" x2="54" y2="80" stroke="#475569" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="63" y1="61" x2="66" y2="80" stroke="#475569" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* OK 마크 */}
      <circle cx="130" cy="65" r="8" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite" />
      </circle>
      <path d="M126 65 L129 68 L134 62" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <text x="80" y="110" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="sans-serif">Quality Inspection</text>
    </svg>
  );
}

function OfficeWorker() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-full">
      {/* 책상 */}
      <rect x="55" y="65" width="60" height="5" rx="2" fill="#1e3a5f" opacity="0.5" />
      <rect x="58" y="70" width="4" height="20" fill="#1e293b" opacity="0.4" />
      <rect x="108" y="70" width="4" height="20" fill="#1e293b" opacity="0.4" />
      {/* 모니터 */}
      <rect x="65" y="42" width="35" height="23" rx="2" fill="#0f172a" opacity="0.6" stroke="#334155" strokeWidth="1" />
      <rect x="68" y="45" width="29" height="16" rx="1" fill="#1e3a5f" opacity="0.4" />
      {/* 화면 차트 */}
      <rect x="70" y="48" width="5" height="10" fill="#3b82f6" opacity="0.4">
        <animate attributeName="height" values="10;7;10" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y" values="48;51;48" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="77" y="51" width="5" height="7" fill="#4ade80" opacity="0.4">
        <animate attributeName="height" values="7;10;7" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="51;48;51" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <rect x="84" y="49" width="5" height="9" fill="#facc15" opacity="0.4">
        <animate attributeName="height" values="9;5;9" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y" values="49;53;49" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="91" y="50" width="5" height="8" fill="#f87171" opacity="0.4" />
      {/* 사람 - 앉아있는 자세 */}
      <circle cx="85" cy="26" r="7" fill="#94a3b8" opacity="0.6" />
      <path d="M79 33 Q85 40 85 50 L85 65" fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
      {/* 팔 - 타이핑 */}
      <line x1="80" y1="40" x2="72" y2="55" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.4">
        <animate attributeName="x2" values="72;74;72" dur="0.8s" repeatCount="indefinite" />
      </line>
      <line x1="90" y1="40" x2="98" y2="55" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.4">
        <animate attributeName="x2" values="98;96;98" dur="0.6s" repeatCount="indefinite" />
      </line>
      {/* 커피잔 */}
      <rect x="115" y="58" width="8" height="7" rx="1" fill="#94a3b8" opacity="0.25" />
      <path d="M123 60 Q127 62 123 64" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.2" />
      <text x="80" y="110" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="sans-serif">Data Analysis</text>
    </svg>
  );
}

function TeamMeeting() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-full">
      {/* 화이트보드 */}
      <rect x="50" y="15" width="60" height="40" rx="3" fill="#0f172a" opacity="0.5" stroke="#334155" strokeWidth="1" />
      <line x1="58" y1="25" x2="90" y2="25" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
      <line x1="58" y1="31" x2="85" y2="31" stroke="#60a5fa" strokeWidth="1.5" opacity="0.3" />
      <line x1="58" y1="37" x2="78" y2="37" stroke="#4ade80" strokeWidth="1.5" opacity="0.3" />
      <line x1="58" y1="43" x2="72" y2="43" stroke="#facc15" strokeWidth="1.5" opacity="0.25" />
      {/* 사람들 - 3명 */}
      {[40, 80, 120].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={72} r={6} fill="#94a3b8" opacity={0.5 - i * 0.05} />
          <rect x={x - 5} y={79} width={10} height={14} rx={3} fill="#475569" opacity={0.4 - i * 0.05} />
        </g>
      ))}
      {/* 포인터 */}
      <line x1="80" y1="78" x2="75" y2="40" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
        <animate attributeName="x2" values="75;85;75" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" values="40;30;40" dur="3s" repeatCount="indefinite" />
      </line>
      <text x="80" y="110" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="sans-serif">Quality Meeting</text>
    </svg>
  );
}

const SCENES = [Worker, Inspector, OfficeWorker, TeamMeeting];

export default function AmbientPeople() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % SCENES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const visible = [0, 1, 2].map(offset => {
    const idx = (phase + offset) % SCENES.length;
    return { Scene: SCENES[idx], offset };
  });

  return (
    <div className="absolute top-0 bottom-0 right-0 w-[220px] pointer-events-none"
      style={{
        zIndex: 1, opacity: 0.6,
        mask: "linear-gradient(to left, black 30%, transparent 100%)",
        WebkitMask: "linear-gradient(to left, black 30%, transparent 100%)",
      }}>
      <div className="flex flex-col gap-4 p-4 h-full justify-center">
        {visible.map(({ Scene, offset }) => (
          <div key={offset} className="rounded-lg border border-gray-700/20 bg-gray-900/20 p-2"
            style={{ animation: `fadeInUp 0.8s ease-out ${offset * 0.3}s both` }}>
            <div className="h-[90px]">
              <Scene />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
