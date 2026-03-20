"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Landmark,
  Receipt,
  FlaskConical,
  Settings,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainMenu = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/income", label: "수입 관리", icon: Wallet },
  { href: "/expenses", label: "지출 관리", icon: Receipt },
  { href: "/loans", label: "대출 관리", icon: Landmark },
  { href: "/cards", label: "카드 관리", icon: CreditCard },
];

const generalMenu = [
  { href: "/simulation", label: "시뮬레이션", icon: FlaskConical },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[260px] flex-col bg-sidebar min-h-screen">
      {/* Logo */}
      <div className="px-6 py-7">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <CircleDollarSign className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
            MoneyFlow
          </span>
        </Link>
      </div>

      {/* Main Menu */}
      <div className="px-4 mt-2">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          메뉴
        </p>
        <nav className="space-y-0.5">
          {mainMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* General Menu */}
      <div className="px-4 mt-6">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          일반
        </p>
        <nav className="space-y-0.5">
          {generalMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Bottom info */}
      <div className="px-6 py-5">
        <div className="rounded-xl bg-sidebar-accent/50 p-4">
          <p className="text-[11px] text-sidebar-foreground/50 mb-1">데이터 저장</p>
          <p className="text-xs text-sidebar-foreground/80">로컬 저장소 사용 중</p>
        </div>
      </div>
    </aside>
  );
}
