"use client";

import { useState } from "react";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthSummary, calculateTotalDebt, calculateNetWorth, getFixedExpenseKRW } from "@/lib/calculate";
import { getYearMonth, addMonths, formatYearMonthLabel, parseYearMonth } from "@/lib/format";
import { getActualPayDate } from "@/lib/holidays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/currency-display";
import { SpecialEventsManager } from "@/components/special-events-manager";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Wallet, Home, Landmark, CreditCard, Zap,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

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

  const totalDebt = calculateTotalDebt(data);
  const netWorth = calculateNetWorth(data, cumulativeRemaining);

  const income = data.income.find((i) => i.yearMonth === currentMonth);
  const salaryDate = getActualPayDate(year, month, 5);
  const bonusDate = getActualPayDate(year, month, 0);
  const formatDay = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

  const activeExpenses = data.fixedExpenses.filter((e) => e.enabled && !e.disabledMonths.includes(currentMonth));
  const activeSpecialEvents = data.specialEvents.filter((evt) => {
    const cur = parseYearMonth(currentMonth);
    const start = parseYearMonth(evt.startMonth);
    const end = parseYearMonth(evt.endMonth);
    const curVal = cur.year * 12 + cur.month;
    return curVal >= start.year * 12 + start.month && curVal <= end.year * 12 + end.month;
  });
  const cardInst = data.cardInstallments.find((c) => c.yearMonth === currentMonth);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  const statCards = [
    {
      label: "총 수입",
      value: summary.totalIncome,
      icon: ArrowUpRight,
      color: "bg-primary text-primary-foreground",
      iconBg: "bg-white/20",
      sub: "이번 달 예상 수입",
    },
    {
      label: "총 지출",
      value: summary.totalFixedExpenses,
      icon: ArrowDownRight,
      color: "bg-white dark:bg-card border",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-foreground",
      sub: "고정 지출 합계",
    },
    {
      label: "대출 상환",
      value: summary.totalLoanPayments,
      icon: Landmark,
      color: "bg-white dark:bg-card border",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-foreground",
      sub: `대출 ${data.loans.filter((l) => l.balance > 0).length}건`,
    },
    {
      label: "이달 잔여금",
      value: summary.remaining,
      icon: summary.remaining >= 0 ? TrendingUp : TrendingDown,
      color: "bg-white dark:bg-card border",
      iconBg: summary.remaining >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30",
      textColor: "text-foreground",
      sub: summary.remaining >= 0 ? "흑자" : "적자",
      showSign: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">매월 수입과 지출을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-xl px-1 py-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold px-3 min-w-[100px] text-center">{formatYearMonthLabel(currentMonth)}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`rounded-2xl p-5 ${stat.color} transition-shadow hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium ${i === 0 ? "text-white/80" : "text-muted-foreground"}`}>{stat.label}</span>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${i === 0 ? "text-white" : ""}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${i === 0 ? "" : stat.textColor}`}>
              {stat.showSign && stat.value !== 0 ? (stat.value > 0 ? "+" : "-") : ""}
              {fmt(stat.value)}
              <span className="text-sm font-normal ml-0.5">원</span>
            </p>
            <p className={`text-[11px] mt-1.5 ${i === 0 ? "text-white/60" : "text-muted-foreground"}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 수입 상세 */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                수입 상세
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Row label={`월급 (${formatDay(salaryDate)})`} amount={income?.salary ?? 0} />
              <Row label={`상여 (${formatDay(bonusDate)})`} amount={income?.bonus ?? 0} />
              <Row label="월세 지원" amount={income?.rentSubsidy ?? 0} />
              <Row label="기타 수입" amount={income?.otherIncome ?? 0} />
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">수입 합계</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{fmt(summary.totalIncome)}원</span>
              </div>
            </CardContent>
          </Card>

          {/* 고정 지출 */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Home className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                고정 지출
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {activeExpenses.map((exp) => {
                const krw = getFixedExpenseKRW(exp.amount, exp.currency, exchangeRate);
                return <Row key={exp.id} label={exp.name} amount={-krw} />;
              })}
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">지출 합계</span>
                <span className="text-base font-bold text-red-600 dark:text-red-400">-{fmt(summary.totalFixedExpenses)}원</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* 대출 상환 */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Landmark className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                대출 상환
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.loans.filter((l) => l.balance > 0).map((loan) => (
                <Row key={loan.id} label={`${loan.name}`} amount={-loan.monthlyPayment} sublabel={`${loan.paymentDay}일`} />
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">상환 합계</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">-{fmt(summary.totalLoanPayments)}원</span>
              </div>
            </CardContent>
          </Card>

          {/* 카드 결제 */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                </div>
                카드 결제
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardInst ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{cardInst.paymentDay}일 결제</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">-{fmt(cardInst.expectedAmount)}원</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">예정 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 특별 이벤트 */}
          {activeSpecialEvents.length > 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  특별 이벤트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {activeSpecialEvents.map((evt) => (
                  <Row key={evt.id} label={evt.name} amount={evt.type === "income" ? evt.amount : -evt.amount} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* 종합 요약 */}
          <Card className="rounded-2xl shadow-sm border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  {summary.remaining >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  이달 잔여금
                </span>
                <CurrencyDisplay amount={summary.remaining} className="text-lg font-bold" />
              </div>
              <Separator />
              <SummaryRow label="누적 잔여금" value={cumulativeRemaining} />
              <SummaryRow label="총 부채" value={-totalDebt} negative />
              <SummaryRow label="순자산" value={netWorth} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 특별 이벤트 관리 */}
      <SpecialEventsManager />
    </div>
  );
}

function Row({ label, amount, sublabel }: { label: string; amount: number; sublabel?: string }) {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString("ko-KR");
  const isNeg = amount < 0;
  const isPos = amount > 0;

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{label}</span>
        {sublabel && <span className="text-[11px] text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5">{sublabel}</span>}
      </div>
      <span className={`font-mono tabular-nums font-medium ${isNeg ? "text-red-600 dark:text-red-400" : isPos ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
        {isNeg ? "-" : isPos ? "+" : ""}{formatted}원
      </span>
    </div>
  );
}

function SummaryRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  const abs = Math.abs(Math.round(value));
  const formatted = abs.toLocaleString("ko-KR");
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums font-semibold ${negative ? "text-red-600 dark:text-red-400" : value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {value < 0 ? "-" : value > 0 ? "+" : ""}{formatted}원
      </span>
    </div>
  );
}
