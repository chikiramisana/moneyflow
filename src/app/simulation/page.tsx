"use client";

import { useState, useMemo } from "react";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthSummary, calculateTotalDebt } from "@/lib/calculate";
import { getYearMonth, addMonths, formatYearMonthLabel } from "@/lib/format";
import type { FinancialData, SpecialEvent } from "@/lib/types";
import { v4 as uuid } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { motion } from "framer-motion";
import { FlaskConical, Calculator } from "lucide-react";

const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

function cloneData(data: FinancialData): FinancialData { return JSON.parse(JSON.stringify(data)); }

function simulateCashFlow(data: FinancialData, startYM: string, months: number) {
  const results: Array<{ yearMonth: string; remaining: number; cumulative: number; debt: number }> = [];
  let cumulative = 0;
  for (let i = 0; i < months; i++) {
    const ym = addMonths(startYM, i);
    const summary = calculateMonthSummary(data, ym);
    cumulative += summary.remaining;
    results.push({ yearMonth: ym, remaining: summary.remaining, cumulative, debt: calculateTotalDebt(data) });
  }
  return results;
}

export default function SimulationPage() {
  const { data } = useFinancialData();
  const [bonusAmount, setBonusAmount] = useState(10000000);
  const [bonusMonth, setBonusMonth] = useState("2026-08");
  const [retireMonth, setRetireMonth] = useState("2026-09");
  const [severancePay, setSeverancePay] = useState(8000000);
  const [unemploymentBenefit, setUnemploymentBenefit] = useState(1950000);
  const [investAmount, setInvestAmount] = useState(1000000);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");
  const currentYM = getYearMonth();
  const currentDebt = calculateTotalDebt(data);

  const bonusSimulation = useMemo(() => {
    const simData = cloneData(data);
    const existingEvent = simData.specialEvents.find((e) => e.name === "타결금");
    if (existingEvent) { existingEvent.amount = bonusAmount; existingEvent.startMonth = bonusMonth; existingEvent.endMonth = bonusMonth; }
    else { simData.specialEvents.push({ id: uuid(), name: "타결금 (시뮬레이션)", amount: bonusAmount, type: "income", isRecurring: false, startMonth: bonusMonth, endMonth: bonusMonth }); }
    return simulateCashFlow(simData, currentYM, 12);
  }, [data, bonusAmount, bonusMonth, currentYM]);

  const retireSimulation = useMemo(() => {
    const simData = cloneData(data);
    const retireEvents: SpecialEvent[] = [
      { id: uuid(), name: "퇴직금", amount: severancePay, type: "income", isRecurring: false, startMonth: retireMonth, endMonth: retireMonth },
      { id: uuid(), name: "실업급여", amount: unemploymentBenefit, type: "income", isRecurring: true, startMonth: addMonths(retireMonth, 1), endMonth: addMonths(retireMonth, 5) },
    ];
    simData.specialEvents = [...simData.specialEvents, ...retireEvents];
    for (let i = 0; i < 12; i++) { const ym2 = addMonths(retireMonth, i + 1); const existing = simData.income.findIndex((inc) => inc.yearMonth === ym2); if (existing >= 0) { simData.income[existing] = { ...simData.income[existing], salary: 0, bonus: 0 }; } }
    return simulateCashFlow(simData, currentYM, 12);
  }, [data, retireMonth, severancePay, unemploymentBenefit, currentYM]);

  const baseFlow = useMemo(() => simulateCashFlow(data, currentYM, 6), [data, currentYM]);
  const sixMonthCumulative = baseFlow.length > 0 ? baseFlow[baseFlow.length - 1].cumulative : 0;
  const afterInvestment = sixMonthCumulative - investAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center"><FlaskConical className="h-5 w-5 text-foreground/70" /></div>
        <h2 className="text-lg font-bold">시뮬레이션</h2>
      </div>

      <Tabs defaultValue="bonus">
        <TabsList className="rounded-[14px] border-2 border-foreground p-1 w-full grid grid-cols-3">
          <TabsTrigger value="bonus" className="rounded-[10px] data-[state=active]:bg-[#d4f943] data-[state=active]:text-[#1a1a1a]">타결금/보너스</TabsTrigger>
          <TabsTrigger value="retire" className="rounded-[10px] data-[state=active]:bg-[#d4f943] data-[state=active]:text-[#1a1a1a]">퇴직 시나리오</TabsTrigger>
          <TabsTrigger value="invest" className="rounded-[10px] data-[state=active]:bg-[#d4f943] data-[state=active]:text-[#1a1a1a]">투자 시나리오</TabsTrigger>
        </TabsList>

        <TabsContent value="bonus">
          <motion.div {...anim}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
              <h3 className="text-sm font-bold">타결금/보너스 시뮬레이션</h3>
              <p className="text-[11px] text-muted-foreground">특정 월에 추가 수입이 들어올 때의 캐시플로우를 예측합니다.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">수령 월</Label><Input value={bonusMonth} onChange={(e) => setBonusMonth(e.target.value)} placeholder="2026-08" className="rounded-[10px]" /></div>
                <div className="space-y-1"><Label className="text-xs">금액</Label><AmountInput value={bonusAmount} onChange={setBonusAmount} /></div>
              </div>
              <div className="h-px bg-foreground/10" />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">12개월 캐시플로우</h4>
                {bonusSimulation.map((m) => (
                  <div key={m.yearMonth} className="flex items-center justify-between text-sm rounded-[10px] bg-muted/30 px-3 py-1.5">
                    <span className="text-muted-foreground text-xs w-20">{formatYearMonthLabel(m.yearMonth)}</span>
                    <CurrencyDisplay amount={m.remaining} className="w-28 text-right text-xs" />
                    <div className="text-right w-28"><span className="text-[10px] text-muted-foreground">누적 </span><CurrencyDisplay amount={m.cumulative} className="text-[10px]" /></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[14px] bg-[#d4f943] p-4 text-center border-2 border-[#1a1a1a]">
                  <p className="text-[10px] text-[#1a1a1a]/60 mb-1">12개월 후 누적</p>
                  <p className="text-xl font-extrabold text-[#1a1a1a] tabular-nums">{fmt(bonusSimulation[bonusSimulation.length - 1]?.cumulative ?? 0)}원</p>
                </div>
                <div className="rounded-[14px] bg-[#1a1a1a] p-4 text-center border-2 border-[#1a1a1a]">
                  <p className="text-[10px] text-white/50 mb-1">현재 총 부채</p>
                  <p className="text-xl font-extrabold text-[#d4f943] tabular-nums">{fmt(currentDebt)}원</p>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="retire">
          <motion.div {...anim}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
              <h3 className="text-sm font-bold">퇴직 시나리오</h3>
              <p className="text-[11px] text-muted-foreground">퇴직 후 퇴직금 + 실업급여를 반영한 캐시플로우를 예측합니다.</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">퇴직 월</Label><Input value={retireMonth} onChange={(e) => setRetireMonth(e.target.value)} placeholder="2026-09" className="rounded-[10px]" /></div>
                <div className="space-y-1"><Label className="text-xs">퇴직금</Label><AmountInput value={severancePay} onChange={setSeverancePay} /></div>
                <div className="space-y-1"><Label className="text-xs">실업급여 (월)</Label><AmountInput value={unemploymentBenefit} onChange={setUnemploymentBenefit} /></div>
              </div>
              <div className="h-px bg-foreground/10" />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">12개월 캐시플로우</h4>
                {retireSimulation.map((m) => {
                  const isAfterRetire = m.yearMonth > retireMonth;
                  return (
                    <div key={m.yearMonth} className={`flex items-center justify-between text-sm rounded-[10px] px-3 py-1.5 ${isAfterRetire ? "bg-red-50 dark:bg-red-900/10" : "bg-muted/30"}`}>
                      <span className="text-muted-foreground text-xs w-20">{formatYearMonthLabel(m.yearMonth)}{m.yearMonth === retireMonth ? " ★" : ""}</span>
                      <CurrencyDisplay amount={m.remaining} className="w-28 text-right text-xs" />
                      <div className="text-right w-28"><span className="text-[10px] text-muted-foreground">누적 </span><CurrencyDisplay amount={m.cumulative} className="text-[10px]" /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="invest">
          <motion.div {...anim}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-bold">투자 시나리오</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">투자 후 남는 비상금을 확인합니다.</p>
              <div className="space-y-1"><Label className="text-xs">투자 금액</Label><AmountInput value={investAmount} onChange={setInvestAmount} /></div>
              <div className="h-px bg-foreground/10" />
              <div className="rounded-[14px] bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">6개월 누적 잔여금</span><CurrencyDisplay amount={sixMonthCumulative} className="font-semibold" /></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">투자 금액</span><CurrencyDisplay amount={-investAmount} className="font-semibold" /></div>
                <div className="h-px bg-foreground/10" />
                <div className="flex justify-between">
                  <span className="font-bold">투자 후 비상금</span>
                  <span className={`text-xl font-extrabold tabular-nums ${afterInvestment < 0 ? "text-red-500" : "text-[#d4f943]"}`}>{afterInvestment < 0 ? "-" : ""}{fmt(afterInvestment)}원</span>
                </div>
                {afterInvestment < 0 && <p className="text-xs text-red-500">비상금이 부족합니다. 투자 금액을 줄이는 것을 권장합니다.</p>}
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
