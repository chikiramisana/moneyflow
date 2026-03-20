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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const topMenu = [
  { href: "/", icon: LayoutDashboard, label: "대시보드" },
  { href: "/income", icon: Wallet, label: "수입" },
  { href: "/expenses", icon: Receipt, label: "지출" },
  { href: "/loans", icon: Landmark, label: "대출" },
  { href: "/cards", icon: CreditCard, label: "카드" },
];

const bottomMenu = [
  { href: "/simulation", icon: FlaskConical, label: "시뮬" },
  { href: "/settings", icon: Settings, label: "설정" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[72px] flex-col items-center bg-sidebar min-h-screen py-6 gap-2">
      {/* Logo */}
      <Link href="/" className="mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-background">
            <path d="M12 2L2 19h20L12 2z" fill="currentColor" />
          </svg>
        </div>
      </Link>

      {/* Main icons */}
      <nav className="flex flex-col items-center gap-1">
        {topMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={item.label}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Bottom icons */}
      <nav className="flex flex-col items-center gap-1">
        {bottomMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={item.label}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
