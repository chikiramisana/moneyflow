"use client";

import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { getYearMonth, addMonths, formatYearMonthLabel } from "@/lib/format";
import { getActualPayDate } from "@/lib/holidays";
import type { MonthlyIncome } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { ChevronLeft, ChevronRight, Wallet, CalendarDays, Gift, Home, MoreHorizontal } from "lucide-react";

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">수입 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">매월 수입을 입력하고 관리하세요.</p>
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

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            월급
          </CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            매달 5일 입금 (실제 입금일: {formatDate(salaryPayDate)})
          </p>
        </CardHeader>
        <CardContent>
          <Label className="text-xs">월급 금액</Label>
          <AmountInput value={salary} onChange={(v) => updateField("salary", v)} placeholder="월급을 입력하세요" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Gift className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            상여
          </CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            매달 말일 입금 (실제 입금일: {formatDate(bonusPayDate)})
          </p>
        </CardHeader>
        <CardContent>
          <Label className="text-xs">상여 금액</Label>
          <AmountInput value={bonus} onChange={(v) => updateField("bonus", v)} placeholder="상여를 입력하세요" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Home className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            월세 지원금
          </CardTitle>
          <p className="text-xs text-muted-foreground">불규칙 지급 (해당 월에만 입력)</p>
        </CardHeader>
        <CardContent>
          <Label className="text-xs">지원금 금액</Label>
          <AmountInput value={rentSubsidy} onChange={(v) => updateField("rentSubsidy", v)} placeholder="0" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <MoreHorizontal className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            기타 수입
          </CardTitle>
          <p className="text-xs text-muted-foreground">복지포인트, 떡값, 타결금 등</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">금액</Label>
            <AmountInput value={otherIncome} onChange={(v) => updateField("otherIncome", v)} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs">메모</Label>
            <Input
              value={otherIncomeMemo}
              onChange={(e) => updateField("otherIncomeMemo", e.target.value)}
              placeholder="수입 내역을 메모하세요"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">이달 총 수입</span>
            <span className="text-2xl font-bold tabular-nums">{total.toLocaleString("ko-KR")}원</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
