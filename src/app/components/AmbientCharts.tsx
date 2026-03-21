/**
 * @file src/app/components/AmbientCharts.tsx
 * @description 랜딩 페이지 좌우 흐릿한 순환 차트 애니메이션
 *
 * 초보자 가이드:
 * 1. SVG 기반 가짜 차트 (막대/꺾은선/도넛/영역) 4종 순환
 * 2. 흐릿하게 + 낮은 투명도로 배경 분위기 연출
 * 3. side="left"|"right"로 좌우 배치
 */

"use client";

import { useState, useEffect } from "react";

const COLORS = ["#3b82f6", "#60a5fa", "#4ade80", "#f87171", "#a78bfa", "#facc15", "#38bdf8"];

function BarChart({ seed }: { seed: number }) {
  const bars = Array.from({ length: 7 }, (_, i) => 20 + ((seed * 17 + i * 31) % 60));
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      {bars.map((h, i) => (
        <rect key={i} x={6 + i * 22} y={100 - h} width={16} height={h} rx={2} fill={COLORS[i]} opacity={0.7}>
          <animate attributeName="height" values={`${h};${h * 0.6};${h};${h * 1.2};${h}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${100 - h};${100 - h * 0.6};${100 - h};${100 - h * 1.2};${100 - h}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

function LineChart({ seed }: { seed: number }) {
  const pts = Array.from({ length: 8 }, (_, i) => ({ x: i * 22 + 5, y: 20 + ((seed * 13 + i * 23) % 55) }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${pts[pts.length - 1].x},95 L${pts[0].x},95 Z`;
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <path d={area} fill={COLORS[seed % COLORS.length]} opacity={0.15} />
      <path d={path} fill="none" stroke={COLORS[seed % COLORS.length]} strokeWidth={2} opacity={0.8}>
        <animate attributeName="d" values={`${path};${pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${Math.max(10, p.y + ((i * 7 + seed) % 20) - 10)}`).join(" ")};${path}`} dur="5s" repeatCount="indefinite" />
      </path>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={COLORS[seed % COLORS.length]} opacity={0.9}>
          <animate attributeName="cy" values={`${p.y};${Math.max(10, p.y + ((i * 7 + seed) % 20) - 10)};${p.y}`} dur="5s" repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function DonutChart({ seed }: { seed: number }) {
  const vals = [35 + (seed * 7 % 20), 25 + (seed * 3 % 15), 15 + (seed * 11 % 10)];
  const total = vals.reduce((a, b) => a + b, 0);
  let acc = 0;
  const cx = 80, cy = 50, r = 35, inner = 20;
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      {vals.map((v, i) => {
        const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += v;
        const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const large = (v / total) > 0.5 ? 1 : 0;
        const d = `M${cx + r * Math.cos(start)},${cy + r * Math.sin(start)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(end)},${cy + r * Math.sin(end)} L${cx + inner * Math.cos(end)},${cy + inner * Math.sin(end)} A${inner},${inner} 0 ${large} 0 ${cx + inner * Math.cos(start)},${cy + inner * Math.sin(start)} Z`;
        return <path key={i} d={d} fill={COLORS[(seed + i) % COLORS.length]} opacity={0.7} />;
      })}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize={11} fontFamily="Orbitron" opacity={0.6}>
        {Math.round(vals[0] / total * 100)}%
      </text>
    </svg>
  );
}

function AreaStacked({ seed }: { seed: number }) {
  const n = 8;
  const s1 = Array.from({ length: n }, (_, i) => 30 + ((seed * 19 + i * 13) % 30));
  const s2 = Array.from({ length: n }, (_, i) => s1[i] + 10 + ((seed * 7 + i * 11) % 20));
  const xStep = 160 / (n - 1);
  const mkPath = (arr: number[]) => arr.map((y, i) => `${i === 0 ? "M" : "L"}${i * xStep},${100 - y}`).join(" ");
  const mkArea = (arr: number[]) => `${mkPath(arr)} L${(n - 1) * xStep},100 L0,100 Z`;
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <path d={mkArea(s2)} fill={COLORS[(seed + 2) % COLORS.length]} opacity={0.2} />
      <path d={mkArea(s1)} fill={COLORS[(seed + 4) % COLORS.length]} opacity={0.25} />
      <path d={mkPath(s1)} fill="none" stroke={COLORS[(seed + 4) % COLORS.length]} strokeWidth={1.5} opacity={0.6} />
      <path d={mkPath(s2)} fill="none" stroke={COLORS[(seed + 2) % COLORS.length]} strokeWidth={1.5} opacity={0.6} />
    </svg>
  );
}

const CHART_TYPES = [BarChart, LineChart, DonutChart, AreaStacked];

interface Props {
  side: "left" | "right";
}

export default function AmbientCharts({ side }: Props) {
  const [phase, setPhase] = useState(side === "left" ? 0 : 2);

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 12), 4000);
    return () => clearInterval(id);
  }, []);

  const charts = [0, 1, 2].map(offset => {
    const idx = (phase + offset) % CHART_TYPES.length;
    const Chart = CHART_TYPES[idx];
    const seed = phase * 3 + offset + (side === "right" ? 50 : 0);
    return { Chart, seed, offset };
  });

  return (
    <div className={`absolute top-0 bottom-0 w-[220px] ${side === "left" ? "left-0" : "right-0"} pointer-events-none`}
      style={{ zIndex: 1, opacity: 0.6, mask: side === "left"
        ? "linear-gradient(to right, black 30%, transparent 100%)"
        : "linear-gradient(to left, black 30%, transparent 100%)",
        WebkitMask: side === "left"
        ? "linear-gradient(to right, black 30%, transparent 100%)"
        : "linear-gradient(to left, black 30%, transparent 100%)",
      }}>
      <div className="flex flex-col gap-6 p-4 h-full justify-center">
        {charts.map(({ Chart, seed, offset }) => (
          <div key={offset} className="rounded-lg border border-gray-700/30 bg-gray-900/30 p-3"
            style={{ animation: `fadeInUp 0.8s ease-out ${offset * 0.3}s both` }}>
            <div className="h-[80px]">
              <Chart seed={seed} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
