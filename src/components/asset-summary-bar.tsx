"use client";

import { usePathname } from "next/navigation";
import { useFinancialData } from "@/lib/storage";
import { calculateTotalAssets, calculateTotalDebt, calculateNetWorth } from "@/lib/calculate";
import { ThemeToggle } from "@/components/theme-toggle";
import { RefreshCw } from "lucide-react";

const pageTitles: Record<string, { title: string; sub: string }> = {
  "/": { title: "Dashboard", sub: "Financial" },
  "/income": { title: "Income", sub: "수입 관리" },
  "/expenses": { title: "Expenses", sub: "지출 관리" },
  "/loans": { title: "Loans", sub: "대출 관리" },
  "/cards": { title: "Cards", sub: "카드 관리" },
  "/simulation": { title: "Simulation", sub: "시뮬레이션" },
  "/settings": { title: "Settings", sub: "설정" },
};

export function AssetSummaryBar() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: "Dashboard", sub: "Financial" };
  const { data } = useFinancialData();

  const totalAssets = calculateTotalAssets(data);
  const totalDebt = calculateTotalDebt(data);
  const netWorth = calculateNetWorth(data, 0);
  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  return (
    <div className="px-6 py-4 space-y-3">
      {/* Asset summary pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-card border-2 border-foreground px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-[#d4f943]" />
          <span className="text-[11px] text-muted-foreground">총 자산</span>
          <span className="text-xs font-bold tabular-nums">{fmt(totalAssets)}원</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-card border-2 border-foreground px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[11px] text-muted-foreground">총 부채</span>
          <span className="text-xs font-bold tabular-nums text-red-500">{fmt(totalDebt)}원</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-card border-2 border-foreground px-3 py-1">
          <div className={`h-2 w-2 rounded-full ${netWorth >= 0 ? "bg-[#d4f943]" : "bg-orange-500"}`} />
          <span className="text-[11px] text-muted-foreground">순자산</span>
          <span className={`text-xs font-bold tabular-nums ${netWorth >= 0 ? "" : "text-orange-500"}`}>
            {netWorth < 0 ? "-" : ""}{fmt(netWorth)}원
          </span>
        </div>
      </div>

      {/* Page title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{page.title}</h1>
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{page.sub}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center text-background text-xs font-bold">
            M
          </div>
        </div>
      </div>
    </div>
  );
}
