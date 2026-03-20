"use client";

import { useState } from "react";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthSummary, calculateTotalDebt, calculateNetWorth, calculateTotalAssets, getFixedExpenseKRW } from "@/lib/calculate";
import { getYearMonth, addMonths, parseYearMonth } from "@/lib/format";
import { CashflowChart } from "@/components/cashflow-chart";
import { SpecialEventsManager } from "@/components/special-events-manager";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Wallet, Landmark, CreditCard, TrendingUp, TrendingDown,
  Receipt, MoreHorizontal, Zap,
} from "lucide-react";

const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

function Badge({ value, positive }: { value: string; positive?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold
      ${positive ? "bg-[#d4f943] text-[#1a1a1a]" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"}`}>
      {value}
    </span>
  );
}

export default function DashboardPage() {
  const { data } = useFinancialData();
  const [currentMonth, setCurrentMonth] = useState(getYearMonth());

  const summary = calculateMonthSummary(data, currentMonth);
  const exchangeRate = data.settings.exchangeRate;
  const { year, month } = parseYearMonth(currentMonth);

  const startYM = "2026-03";
  let cumulativeRemaining = 0;
  let ym = startYM;
  while (ym <= currentMonth) {
    const s = calculateMonthSummary(data, ym);
    cumulativeRemaining += s.remaining;
    ym = addMonths(ym, 1);
  }

  const totalAssets = calculateTotalAssets(data);
  const totalDebt = calculateTotalDebt(data);
  const netWorth = calculateNetWorth(data, cumulativeRemaining);

  const prevSummary = calculateMonthSummary(data, addMonths(currentMonth, -1));
  const incomeChange = prevSummary.totalIncome > 0
    ? Math.round(((summary.totalIncome - prevSummary.totalIncome) / prevSummary.totalIncome) * 100)
    : 0;
  const expenseChange = prevSummary.totalFixedExpenses > 0
    ? Math.round(((summary.totalFixedExpenses - prevSummary.totalFixedExpenses) / prevSummary.totalFixedExpenses) * 100)
    : 0;
  const loanCount = data.loans.filter((l) => l.balance > 0).length;
  const remainingPct = summary.totalIncome > 0
    ? Math.round((summary.remaining / summary.totalIncome) * 100)
    : 0;

  const activeExpenses = data.fixedExpenses.filter((e) => e.enabled && !e.disabledMonths.includes(currentMonth));

  const activeSpecialEvents = data.specialEvents.filter((evt) => {
    const cur = parseYearMonth(currentMonth);
    const start = parseYearMonth(evt.startMonth);
    const end = parseYearMonth(evt.endMonth);
    const curVal = cur.year * 12 + cur.month;
    return curVal >= start.year * 12 + start.month && curVal <= end.year * 12 + end.month;
  });

  const debtRatio = totalAssets > 0 ? Math.round((totalDebt / (totalAssets + cumulativeRemaining)) * 100) : 0;

  const monthNames = ["", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="space-y-6">
      {/* Bills Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Bills</h2>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border-2 border-foreground bg-card px-1 py-1">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="h-7 w-7 flex items-center justify-center rounded-[10px] hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-bold px-2 min-w-[80px] text-center">
            {year}.{String(month).padStart(2, "0")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-[10px] hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Income (Lime/Yellow highlight) */}
        <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0 }}>
          <div className="rounded-[20px] bg-[#d4f943] border-2 border-[#1a1a1a] p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-[14px] bg-[#1a1a1a] flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#d4f943]" />
              </div>
              <Badge value={`${incomeChange >= 0 ? "+" : ""}${incomeChange}%`} positive={incomeChange >= 0} />
            </div>
            <p className="text-[11px] font-medium text-[#1a1a1a]/60 mb-1">총 수입</p>
            <p className="text-2xl font-extrabold text-[#1a1a1a] tabular-nums tracking-tight">
              {fmt(summary.totalIncome)}<span className="text-sm font-bold ml-0.5">원</span>
            </p>
            <p className="text-[10px] text-[#1a1a1a]/50 mt-2">
              {monthNames[month]} 예상 수입
            </p>
          </div>
        </motion.div>

        {/* Card 2 - Expenses */}
        <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.05 }}>
          <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center">
                <Receipt className="h-5 w-5 text-foreground/70" />
              </div>
              <Badge value={`${expenseChange >= 0 ? "+" : ""}${expenseChange}%`} positive={expenseChange <= 0} />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">총 지출</p>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight">
              {fmt(summary.totalFixedExpenses)}<span className="text-sm font-bold ml-0.5">원</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              고정 지출 {activeExpenses.length}건
            </p>
          </div>
        </motion.div>

        {/* Card 3 - Loan */}
        <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.1 }}>
          <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center">
                <Landmark className="h-5 w-5 text-foreground/70" />
              </div>
              <Badge value={`${loanCount}건`} positive />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">대출 상환</p>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight">
              {fmt(summary.totalLoanPayments)}<span className="text-sm font-bold ml-0.5">원</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              월 상환액
            </p>
          </div>
        </motion.div>

        {/* Card 4 - Remaining */}
        <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.15 }}>
          <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center">
                {summary.remaining >= 0
                  ? <TrendingUp className="h-5 w-5 text-foreground/70" />
                  : <TrendingDown className="h-5 w-5 text-red-500" />
                }
              </div>
              <Badge
                value={`${remainingPct >= 0 ? "+" : ""}${remainingPct}%`}
                positive={summary.remaining >= 0}
              />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">이달 잔여금</p>
            <p className="text-2xl font-extrabold tabular-nums tracking-tight">
              {summary.remaining < 0 ? "-" : ""}{fmt(summary.remaining)}<span className="text-sm font-bold ml-0.5">원</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              {summary.remaining >= 0 ? "흑자" : "적자"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Invoices Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Invoices</h2>
        <div className="flex items-center gap-1 rounded-[14px] border-2 border-foreground bg-card px-3 py-1.5">
          <span className="text-xs font-semibold">{monthNames[month]}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Donut-style gauge card */}
        <motion.div className="lg:col-span-3" {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.2 }}>
          <div className="rounded-[20px] bg-[#1a1a1a] dark:bg-[#111] border-2 border-[#1a1a1a] dark:border-[#333] p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <MoreHorizontal className="h-4 w-4 text-white/40" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Gauge */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#d4f943"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(100 - debtRatio) / 100 * 314} 314`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-white">{100 - debtRatio}%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-white/60" />
                </div>
                <span className="text-[11px] text-white/50">자산 건전성</span>
              </div>
              <p className="text-lg font-extrabold text-white tabular-nums">{fmt(totalAssets + cumulativeRemaining)}원</p>
              <p className="text-xs text-red-400 font-semibold mt-0.5 tabular-nums">{fmt(totalDebt)}원 부채</p>
            </div>
          </div>
        </motion.div>

        {/* Middle: Two stacked cards */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* 순자산 */}
          <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.25 }}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-muted flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">순자산</span>
                </div>
                <Badge value={`${netWorth >= 0 ? "+" : ""}${Math.round((netWorth / (totalAssets || 1)) * 100)}%`} positive={netWorth >= 0} />
              </div>
              <p className="text-xl font-extrabold tabular-nums tracking-tight mt-1">
                {netWorth < 0 ? "-" : ""}{fmt(netWorth)}<span className="text-sm font-bold ml-0.5">원</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">누적 잔여금 포함</p>
            </div>
          </motion.div>

          {/* 누적 잔여금 */}
          <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.3 }}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-[10px] bg-muted flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-foreground/70" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">누적 잔여금</span>
              </div>
              <p className="text-xl font-extrabold tabular-nums tracking-tight mt-1">
                {cumulativeRemaining < 0 ? "-" : ""}{fmt(cumulativeRemaining)}<span className="text-sm font-bold ml-0.5">원</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">시작점부터 합산</p>
            </div>
          </motion.div>
        </div>

        {/* Right: Bar chart + pending card */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.35 }}>
            <CashflowChart currentMonth={currentMonth} />
          </motion.div>

          {/* 카드 결제 / 특별 이벤트 */}
          <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.4 }}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-muted flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-foreground/70" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">카드 결제 예정</p>
                    <p className="text-lg font-extrabold tabular-nums">
                      {fmt(summary.totalCardPayments)}<span className="text-sm font-bold ml-0.5">원</span>
                    </p>
                  </div>
                </div>
                {activeSpecialEvents.length > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="h-3.5 w-3.5 text-[#d4f943]" />
                      <span className="text-[11px] text-muted-foreground">특별 이벤트 {activeSpecialEvents.length}건</span>
                    </div>
                    <p className="text-sm font-bold tabular-nums mt-0.5">
                      {fmt(summary.totalSpecialIncome - summary.totalSpecialExpenses)}<span className="text-xs ml-0.5">원</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Expenses breakdown */}
      <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.45 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">고정 지출 내역</h3>
            <span className="text-xs text-muted-foreground">{activeExpenses.length}건</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeExpenses.map((exp) => {
              const krw = getFixedExpenseKRW(exp.amount, exp.currency, exchangeRate);
              return (
                <div key={exp.id} className="flex items-center justify-between rounded-[14px] bg-muted/50 px-4 py-3">
                  <span className="text-sm text-foreground/80">{exp.name}</span>
                  <span className="text-sm font-bold tabular-nums">{fmt(krw)}원</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Loan breakdown */}
      {data.loans.filter((l) => l.balance > 0).length > 0 && (
        <motion.div {...cardMotion} transition={{ ...cardMotion.transition, delay: 0.5 }}>
          <div className="rounded-[20px] bg-card border-2 border-foreground p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">대출 상환 내역</h3>
              <span className="text-xs text-muted-foreground">{loanCount}건</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.loans.filter((l) => l.balance > 0).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between rounded-[14px] bg-muted/50 px-4 py-3">
                  <div>
                    <span className="text-sm text-foreground/80">{loan.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{loan.paymentDay}일</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{fmt(loan.monthlyPayment)}원</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">잔액 {fmt(loan.balance)}원</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <SpecialEventsManager />
    </div>
  );
}
