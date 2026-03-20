"use client";

import { useMemo } from "react";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthSummary } from "@/lib/calculate";
import { addMonths, parseYearMonth } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  currentMonth: string;
}

export function CashflowChart({ currentMonth }: Props) {
  const { data } = useFinancialData();

  const chartData = useMemo(() => {
    const startYM = addMonths(currentMonth, -5);
    const points = [];

    for (let i = 0; i < 7; i++) {
      const ym = addMonths(startYM, i);
      const summary = calculateMonthSummary(data, ym);
      const { month } = parseYearMonth(ym);

      const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      points.push({
        name: monthNames[month],
        잔여금: Math.round(summary.remaining),
        isCurrent: ym === currentMonth,
      });
    }

    return points;
  }, [data, currentMonth]);

  const { month: curMonth, year: curYear } = parseYearMonth(currentMonth);
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatTick = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 10000000) return `${(v / 10000000).toFixed(1)}천만`;
    if (abs >= 10000) return `${(v / 10000).toFixed(0)}만`;
    return `${v}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload || !payload[0]) return null;
    const val = payload[0].value;
    return (
      <div className="rounded-xl bg-white dark:bg-card border-2 border-foreground px-3 py-2 shadow-lg text-xs">
        <p className="font-bold mb-0.5">{label}</p>
        <span className="font-mono tabular-nums font-semibold">
          {val < 0 ? "-" : ""}{Math.abs(val).toLocaleString("ko-KR")}원
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-[20px] bg-[#1a1a1a] dark:bg-[#111] p-5 border-2 border-[#1a1a1a] dark:border-[#333]">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/10 rounded-lg px-3 py-1.5">
          <span className="text-white text-xs font-semibold">{monthNames[curMonth]} {curYear}</span>
        </div>
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-white/40" />
          <div className="h-1 w-1 rounded-full bg-white/40" />
          <div className="h-1 w-1 rounded-full bg-white/40" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTick}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="잔여금" radius={[6, 6, 6, 6]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isCurrent ? "#d4f943" : "rgba(212,249,67,0.35)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
