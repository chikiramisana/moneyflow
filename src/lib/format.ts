export function formatKRW(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString("ko-KR");
  const sign = amount < 0 ? "-" : amount > 0 ? "+" : "";
  return `${sign}${formatted}원`;
}

export function formatKRWPlain(amount: number): string {
  return `${Math.abs(Math.round(amount)).toLocaleString("ko-KR")}원`;
}

export function formatUSD(amount: number): string {
  return `$${Math.abs(amount).toFixed(2)}`;
}

export function formatUSDWithKRW(usd: number, exchangeRate: number): string {
  const krw = Math.round(usd * exchangeRate);
  return `${formatUSD(usd)} ≈ ${krw.toLocaleString("ko-KR")}원`;
}

export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return Number(cleaned) || 0;
}

export function formatNumberInput(value: string): string {
  const cleaned = value.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return Number(cleaned).toLocaleString("ko-KR");
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function getYearMonth(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

export function formatYearMonthLabel(ym: string): string {
  const { year, month } = parseYearMonth(ym);
  return `${year}년 ${month}월`;
}

export function addMonths(ym: string, count: number): string {
  const { year, month } = parseYearMonth(ym);
  const d = new Date(year, month - 1 + count, 1);
  return getYearMonth(d);
}
