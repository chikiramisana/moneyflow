import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  showSign?: boolean;
  className?: string;
}

export function CurrencyDisplay({ amount, showSign = true, className }: CurrencyDisplayProps) {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString("ko-KR");

  let sign = "";
  let colorClass = "";
  if (showSign && amount > 0) {
    sign = "+";
    colorClass = "text-blue-600 dark:text-blue-400";
  } else if (amount < 0) {
    sign = "-";
    colorClass = "text-red-600 dark:text-red-400";
  }

  return <span className={cn(colorClass, "font-mono tabular-nums", className)}>{sign}{formatted}원</span>;
}
