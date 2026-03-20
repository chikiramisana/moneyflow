"use client";

import { usePathname } from "next/navigation";
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

  return (
    <div className="px-6 py-4 flex items-center justify-between">
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
  );
}
