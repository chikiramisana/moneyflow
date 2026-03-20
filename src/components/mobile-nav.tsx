"use client";

import { useState } from "react";
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
  Menu,
  X,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/income", label: "수입 관리", icon: Wallet },
  { href: "/expenses", label: "지출 관리", icon: Receipt },
  { href: "/loans", label: "대출 관리", icon: Landmark },
  { href: "/cards", label: "카드 관리", icon: CreditCard },
  { href: "/simulation", label: "시뮬레이션", icon: FlaskConical },
  { href: "/settings", label: "설정", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <CircleDollarSign className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold">MoneyFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open && (
        <nav className="border-b bg-card px-3 py-2 space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
