/**
 * @file src/app/monitoring/quality-dashboard/components/DashboardCharts.tsx
 * @description 대시보드 차트 영역 — Recharts 기반 10종 차트 + 요약 카드
 *
 * 초보자 가이드:
 * 1. 기본 6종 + 추가 4종 (불량부품/위치/수리공정/입고구분)
 * 2. 사이드바 설정에 따라 동적 표시
 */

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import type { QualityDashboardResponse, DashboardSettings, ChartItem } from "../types";
import { PALETTES } from "../types";

interface Props {
  data: QualityDashboardResponse;
  settings: DashboardSettings;
}

function ChartCard({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-xl p-4 ${fullWidth ? "col-span-full" : ""}`}>
      <h3 className="text-xs text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function VerticalBar({ data, h, colors }: { data: ChartItem[]; h: number; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }} />
        <Bar dataKey="count" name="건수">{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HorizontalBar({ data, h, colors }: { data: ChartItem[]; h: number; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#94a3b8", fontSize: 9 }} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }} />
        <Bar dataKey="count" name="건수">{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardCharts({ data, settings }: Props) {
  const colors = PALETTES[settings.palette] || PALETTES.blue;
  const h = settings.chartHeight;
  const gridCols = settings.layout === "3x2" ? "grid-cols-3" : "grid-cols-2";

  const charts: { key: string; show: boolean; title: string; el: React.ReactNode }[] = [
    { key: "process", show: settings.showProcess, title: "공정별 불량 건수",
      el: <VerticalBar data={data.process} h={h} colors={colors} /> },
    { key: "badCode", show: settings.showBadCode, title: "불량코드 TOP10",
      el: <HorizontalBar data={data.badCode} h={h} colors={colors} /> },
    { key: "line", show: settings.showLine, title: "라인별 불량 비교",
      el: <VerticalBar data={data.line} h={h} colors={colors} /> },
    { key: "repair", show: settings.showRepair, title: "수리완료율", el: (() => {
      const pieData = [{ name: "수리완료", value: data.repair.repaired }, { name: "미수리", value: data.repair.pending }];
      const rate = data.repair.total > 0 ? Math.round((data.repair.repaired / data.repair.total) * 100) : 0;
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={h * 0.22} outerRadius={h * 0.38} dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}>
              <Cell fill="#4ade80" /><Cell fill="#f87171" />
            </Pie>
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize={20} fontWeight="bold">{rate}%</text>
          </PieChart>
        </ResponsiveContainer>
      );
    })() },
    { key: "model", show: settings.showModel, title: "모델별 불량",
      el: <VerticalBar data={data.model} h={h} colors={colors} /> },
    { key: "hourly", show: settings.showHourly, title: "시간대별 불량 분포", el: (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data.hourly}><CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 9 }} /><YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }} />
          <Area type="monotone" dataKey="count" name="건수" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    ) },
    { key: "defectItem", show: settings.showDefectItem, title: "불량부품 TOP10",
      el: <HorizontalBar data={data.defectItem} h={h} colors={colors} /> },
    { key: "location", show: settings.showLocation, title: "불량위치 TOP10",
      el: <HorizontalBar data={data.location} h={h} colors={colors} /> },
    { key: "repairWs", show: settings.showRepairWorkstage, title: "수리공정별 불량",
      el: <VerticalBar data={data.repairWorkstage} h={h} colors={colors} /> },
    { key: "receipt", show: settings.showReceipt, title: "입고구분별 불량", el: (() => {
      const pieData = data.receipt.map(r => ({ name: r.name, value: r.count }));
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={h * 0.18} outerRadius={h * 0.38} dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}>
              {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    })() },
  ];

  const visible = charts.filter(c => c.show);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {settings.showSummary && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold font-mono text-red-400">{data.summary.totalDefects}</div>
            <div className="text-[10px] text-gray-500 mt-1">총 불량 건수</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold font-mono text-green-400">{data.summary.repairRate}%</div>
            <div className="text-[10px] text-gray-500 mt-1">수리완료율</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-lg font-extrabold font-mono text-blue-400">{data.summary.topProcess}</div>
            <div className="text-[10px] text-gray-500 mt-1">최다 불량 공정</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <div className="text-lg font-extrabold font-mono text-yellow-400">{data.summary.topBadCode}</div>
            <div className="text-[10px] text-gray-500 mt-1">최다 불량코드</div>
          </div>
        </div>
      )}
      <div className={`grid ${gridCols} gap-3`}>
        {visible.map((c, i) => {
          const isLast = settings.layout === "2x2+1" && i === visible.length - 1 && visible.length % 2 === 1;
          return (
            <ChartCard key={c.key} title={c.title} fullWidth={isLast}>
              {c.el}
            </ChartCard>
          );
        })}
      </div>
    </div>
  );
}
