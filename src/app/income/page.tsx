"use client";

import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { getYearMonth, addMonths, formatYearMonthLabel } from "@/lib/format";
import { getActualPayDate } from "@/lib/holidays";
import type { MonthlyIncome } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Wallet, CalendarDays, Gift, Home, MoreHorizontal } from "lucide-react";

const anim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

export default function IncomePage() {
  const { data, updateData } = useFinancialData();
  const [currentMonth, setCurrentMonth] = useState(getYearMonth());

  const currentIncome = data.income.find((i) => i.yearMonth === currentMonth);

  const salary = currentIncome?.salary ?? 0;
  const bonus = currentIncome?.bonus ?? 0;
  const rentSubsidy = currentIncome?.rentSubsidy ?? 0;
  const otherIncome = currentIncome?.otherIncome ?? 0;
  const otherIncomeMemo = currentIncome?.otherIncomeMemo ?? "";

  const total = salary + bonus + rentSubsidy + otherIncome;

  const updateField = useCallback(
    (field: keyof MonthlyIncome, value: number | string) => {
      updateData((prev) => {
        const incomes = [...prev.income];
        const idx = incomes.findIndex((i) => i.yearMonth === currentMonth);
        if (idx >= 0) {
          incomes[idx] = { ...incomes[idx], [field]: value };
        } else {
          incomes.push({
            id: uuid(),
            yearMonth: currentMonth,
            salary: 0, bonus: 0, rentSubsidy: 0, otherIncome: 0, otherIncomeMemo: "",
            [field]: value,
          });
        }
        return { ...prev, income: incomes };
      });
    },
    [currentMonth, updateData]
  );

  const [y, m] = currentMonth.split("-").map(Number);
  const salaryPayDate = getActualPayDate(y, m, 5);
  const bonusPayDate = getActualPayDate(y, m, 0);

  const formatDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  const fields = [
    { key: "salary" as const, label: "월급", icon: Wallet, iconBg: "bg-[#d4f943]", iconColor: "text-[#1a1a1a]", sub: `매달 5일 입금 (실제: ${formatDate(salaryPayDate)})`, value: salary },
    { key: "bonus" as const, label: "상여", icon: Gift, iconBg: "bg-[#1a1a1a] dark:bg-white/10", iconColor: "text-[#d4f943]", sub: `매달 말일 입금 (실제: ${formatDate(bonusPayDate)})`, value: bonus },
    { key: "rentSubsidy" as const, label: "월세 지원금", icon: Home, iconBg: "bg-muted", iconColor: "text-foreground/70", sub: "불규칙 지급 (해당 월에만 입력)", value: rentSubsidy },
    { key: "otherIncome" as const, label: "기타 수입", icon: MoreHorizontal, iconBg: "bg-muted", iconColor: "text-foreground/70", sub: "복지포인트, 떡값, 타결금 등", value: otherIncome },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">수입 관리</h2>
        <div className="flex items-center gap-2 rounded-[14px] border-2 border-foreground bg-card px-1 py-1">
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="h-7 w-7 flex items-center justify-center rounded-[10px] hover:bg-muted transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-bold px-2 min-w-[100px] text-center">{formatYearMonthLabel(currentMonth)}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-7 w-7 flex items-center justify-center rounded-[10px] hover:bg-muted transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {fields.map((f, i) => (
        <motion.div key={f.key} {...anim} transition={{ ...anim.transition, delay: i * 0.05 }}>
          <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-[14px] ${f.iconBg} flex items-center justify-center`}>
                <f.icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-bold">{f.label}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {f.sub}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{f.label} 금액</Label>
              <AmountInput value={f.value} onChange={(v) => updateField(f.key, v)} placeholder="0" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* 기타 수입 메모 */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.2 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
          <Label className="text-xs text-muted-foreground">기타 수입 메모</Label>
          <Input
            value={otherIncomeMemo}
            onChange={(e) => updateField("otherIncomeMemo", e.target.value)}
            placeholder="수입 내역을 메모하세요"
            className="mt-1 rounded-[10px]"
          />
        </div>
      </motion.div>

      {/* Total */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.25 }}>
        <div className="rounded-[20px] bg-[#d4f943] border-2 border-[#1a1a1a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-[#1a1a1a]">이달 총 수입</span>
            <span className="text-2xl font-extrabold text-[#1a1a1a] tabular-nums">{fmt(total)}<span className="text-sm font-bold ml-0.5">원</span></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
