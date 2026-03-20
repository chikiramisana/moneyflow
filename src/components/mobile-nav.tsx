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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-background">
              <path d="M12 2L2 19h20L12 2z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base font-bold">MoneyFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="rounded-xl">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3 pb-2 space-y-0.5"
          >
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
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
