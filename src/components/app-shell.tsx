"use client";

import { FinancialProvider } from "@/lib/storage";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { AssetSummaryBar } from "@/components/asset-summary-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <FinancialProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <MobileNav />
            <AssetSummaryBar />
            <main className="flex-1 px-4 md:px-6 pb-6 overflow-auto">{children}</main>
          </div>
        </div>
      </FinancialProvider>
    </ThemeProvider>
  );
}
