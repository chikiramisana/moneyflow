"use client";

import { useState, useMemo } from "react";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthSummary, calculateTotalDebt } from "@/lib/calculate";
import { getYearMonth, addMonths, formatYearMonthLabel } from "@/lib/format";
import type { FinancialData, SpecialEvent } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { FlaskConical, Calculator } from "lucide-react";

function cloneData(data: FinancialData): FinancialData {
  return JSON.parse(JSON.stringify(data));
}

function simulateCashFlow(data: FinancialData, startYM: string, months: number) {
  const results: Array<{ yearMonth: string; remaining: number; cumulative: number; debt: number }> = [];
  let cumulative = 0;

  for (let i = 0; i < months; i++) {
    const ym = addMonths(startYM, i);
    const summary = calculateMonthSummary(data, ym);
    cumulative += summary.remaining;
    results.push({
      yearMonth: ym,
      remaining: summary.remaining,
      cumulative,
      debt: calculateTotalDebt(data),
    });
  }
  return results;
}

export default function SimulationPage() {
  const { data } = useFinancialData();

  // 시나리오 1: 타결금/떡값 시뮬레이션
  const [bonusAmount, setBonusAmount] = useState(10000000);
  const [bonusMonth, setBonusMonth] = useState("2026-08");

  // 시나리오 2: 퇴직 시뮬레이션
  const [retireMonth, setRetireMonth] = useState("2026-09");
  const [severancePay, setSeverancePay] = useState(8000000);
  const [unemploymentBenefit, setUnemploymentBenefit] = useState(1950000);

  // 시나리오 3: 투자 시뮬레이션
  const [investAmount, setInvestAmount] = useState(1000000);

  const currentYM = getYearMonth();
  const currentDebt = calculateTotalDebt(data);

  // 시나리오 1: 타결금 시뮬레이션
  const bonusSimulation = useMemo(() => {
    const simData = cloneData(data);
    const existingEvent = simData.specialEvents.find((e) => e.name === "타결금");
    if (existingEvent) {
      existingEvent.amount = bonusAmount;
      existingEvent.startMonth = bonusMonth;
      existingEvent.endMonth = bonusMonth;
    } else {
      simData.specialEvents.push({
        id: uuid(),
        name: "타결금 (시뮬레이션)",
        amount: bonusAmount,
        type: "income",
        isRecurring: false,
        startMonth: bonusMonth,
        endMonth: bonusMonth,
      });
    }
    return simulateCashFlow(simData, currentYM, 12);
  }, [data, bonusAmount, bonusMonth, currentYM]);

  // 시나리오 2: 퇴직 시뮬레이션
  const retireSimulation = useMemo(() => {
    const simData = cloneData(data);
    // 퇴직 후에는 급여가 없어지므로 퇴직월 이후 수입 삭제
    const retireEvents: SpecialEvent[] = [
      {
        id: uuid(),
        name: "퇴직금",
        amount: severancePay,
        type: "income",
        isRecurring: false,
        startMonth: retireMonth,
        endMonth: retireMonth,
      },
      {
        id: uuid(),
        name: "실업급여",
        amount: unemploymentBenefit,
        type: "income",
        isRecurring: true,
        startMonth: addMonths(retireMonth, 1),
        endMonth: addMonths(retireMonth, 5),
      },
    ];
    simData.specialEvents = [...simData.specialEvents, ...retireEvents];

    for (let i = 0; i < 12; i++) {
      const ym = addMonths(retireMonth, i + 1);
      const existing = simData.income.findIndex((inc) => inc.yearMonth === ym);
      if (existing >= 0) {
        simData.income[existing] = { ...simData.income[existing], salary: 0, bonus: 0 };
      }
    }

    return simulateCashFlow(simData, currentYM, 12);
  }, [data, retireMonth, severancePay, unemploymentBenefit, currentYM]);

  // 시나리오 3: 투자 후 비상금 계산
  const baseFlow = useMemo(() => simulateCashFlow(data, currentYM, 6), [data, currentYM]);
  const sixMonthCumulative = baseFlow.length > 0 ? baseFlow[baseFlow.length - 1].cumulative : 0;
  const afterInvestment = sixMonthCumulative - investAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6" />
        <h2 className="text-2xl font-bold">시뮬레이션</h2>
      </div>

      <Tabs defaultValue="bonus">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bonus">타결금/보너스</TabsTrigger>
          <TabsTrigger value="retire">퇴직 시나리오</TabsTrigger>
          <TabsTrigger value="invest">투자 시나리오</TabsTrigger>
        </TabsList>

        {/* 타결금 시나리오 */}
        <TabsContent value="bonus">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">타결금/보너스 시뮬레이션</CardTitle>
              <CardDescription>특정 월에 추가 수입이 들어올 때의 캐시플로우를 예측합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>수령 월</Label>
                  <Input value={bonusMonth} onChange={(e) => setBonusMonth(e.target.value)} placeholder="2026-08" />
                </div>
                <div className="space-y-2">
                  <Label>금액</Label>
                  <AmountInput value={bonusAmount} onChange={setBonusAmount} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">12개월 캐시플로우 예측</h4>
                {bonusSimulation.map((m) => (
                  <div key={m.yearMonth} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-24">{formatYearMonthLabel(m.yearMonth)}</span>
                    <CurrencyDisplay amount={m.remaining} className="w-32 text-right" />
                    <div className="text-right w-32">
                      <span className="text-xs text-muted-foreground">누적 </span>
                      <CurrencyDisplay amount={m.cumulative} className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">12개월 후 누적 잔여금</p>
                  <CurrencyDisplay
                    amount={bonusSimulation[bonusSimulation.length - 1]?.cumulative ?? 0}
                    className="text-xl font-bold"
                  />
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">현재 총 부채</p>
                  <CurrencyDisplay
                    amount={-currentDebt}
                    showSign={false}
                    className="text-xl font-bold text-red-600 dark:text-red-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 퇴직 시나리오 */}
        <TabsContent value="retire">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">퇴직 시나리오</CardTitle>
              <CardDescription>퇴직 후 퇴직금 + 실업급여를 반영한 캐시플로우를 예측합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>퇴직 월</Label>
                  <Input value={retireMonth} onChange={(e) => setRetireMonth(e.target.value)} placeholder="2026-09" />
                </div>
                <div className="space-y-2">
                  <Label>퇴직금</Label>
                  <AmountInput value={severancePay} onChange={setSeverancePay} />
                </div>
                <div className="space-y-2">
                  <Label>실업급여 (월)</Label>
                  <AmountInput value={unemploymentBenefit} onChange={setUnemploymentBenefit} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">12개월 캐시플로우 예측</h4>
                {retireSimulation.map((m) => {
                  const isAfterRetire = m.yearMonth > retireMonth;
                  return (
                    <div key={m.yearMonth} className={`flex items-center justify-between text-sm ${isAfterRetire ? "opacity-80" : ""}`}>
                      <span className="text-muted-foreground w-24">
                        {formatYearMonthLabel(m.yearMonth)}
                        {m.yearMonth === retireMonth && " *"}
                      </span>
                      <CurrencyDisplay amount={m.remaining} className="w-32 text-right" />
                      <div className="text-right w-32">
                        <span className="text-xs text-muted-foreground">누적 </span>
                        <CurrencyDisplay amount={m.cumulative} className="text-xs" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 투자 시나리오 */}
        <TabsContent value="invest">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                투자 시나리오
              </CardTitle>
              <CardDescription>투자 후 남는 비상금을 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>투자 금액</Label>
                <AmountInput value={investAmount} onChange={setInvestAmount} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-lg bg-muted space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">6개월 누적 잔여금 (예상)</span>
                    <CurrencyDisplay amount={sixMonthCumulative} className="font-semibold" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">투자 금액</span>
                    <CurrencyDisplay amount={-investAmount} className="font-semibold" />
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">투자 후 비상금</span>
                    <CurrencyDisplay
                      amount={afterInvestment}
                      className={`text-xl font-bold ${afterInvestment < 0 ? "text-red-600 dark:text-red-400" : ""}`}
                    />
                  </div>
                  {afterInvestment < 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      비상금이 부족합니다. 투자 금액을 줄이는 것을 권장합니다.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
