"use client";

import { useFinancialData } from "@/lib/storage";
import { calculateTotalAssets, calculateTotalDebt, calculateNetWorth } from "@/lib/calculate";
import { ThemeToggle } from "@/components/theme-toggle";

export function AssetSummaryBar() {
  const { data } = useFinancialData();

  const totalAssets = calculateTotalAssets(data);
  const totalDebt = calculateTotalDebt(data);
  const netWorth = calculateNetWorth(data, 0);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  return (
    <div className="border-b bg-card px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">총 자산</span>
            <span className="text-sm font-bold">{fmt(totalAssets)}원</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">총 부채</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{fmt(totalDebt)}원</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${netWorth >= 0 ? "bg-blue-500" : "bg-orange-500"}`} />
            <span className="text-xs text-muted-foreground">순자산</span>
            <span className={`text-sm font-bold ${netWorth >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
              {netWorth < 0 ? "-" : ""}{fmt(netWorth)}원
            </span>
          </div>
        </div>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
