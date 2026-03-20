import type { FinancialData, MonthSummary, MonthlyIncome } from "./types";
import { parseYearMonth, addMonths } from "./format";

function getOrCreateMonthlyIncome(data: FinancialData, ym: string): MonthlyIncome {
  const found = data.income.find((i) => i.yearMonth === ym);
  if (found) return found;
  return { id: "", yearMonth: ym, salary: 0, bonus: 0, rentSubsidy: 0, otherIncome: 0, otherIncomeMemo: "" };
}

export function calculateMonthSummary(data: FinancialData, yearMonth: string): MonthSummary {
  const income = getOrCreateMonthlyIncome(data, yearMonth);

  const totalIncome = income.salary + income.bonus + income.rentSubsidy + income.otherIncome;

  const exchangeRate = data.settings.exchangeRate;

  let totalFixedExpenses = 0;
  for (const exp of data.fixedExpenses) {
    if (!exp.enabled) continue;
    if (exp.disabledMonths.includes(yearMonth)) continue;
    const amount = exp.currency === "USD" ? exp.amount * exchangeRate : exp.amount;
    totalFixedExpenses += amount;
  }

  let totalLoanPayments = 0;
  for (const loan of data.loans) {
    if (loan.balance <= 0) continue;
    totalLoanPayments += loan.monthlyPayment;
  }

  let totalCardPayments = 0;
  const cardInst = data.cardInstallments.find((c) => c.yearMonth === yearMonth);
  if (cardInst) totalCardPayments = cardInst.expectedAmount;

  let totalSpecialIncome = 0;
  let totalSpecialExpenses = 0;
  for (const evt of data.specialEvents) {
    const startDate = parseYearMonth(evt.startMonth);
    const endDate = parseYearMonth(evt.endMonth);
    const cur = parseYearMonth(yearMonth);
    const curVal = cur.year * 12 + cur.month;
    const startVal = startDate.year * 12 + startDate.month;
    const endVal = endDate.year * 12 + endDate.month;

    if (curVal >= startVal && curVal <= endVal) {
      if (evt.type === "income") totalSpecialIncome += evt.amount;
      else totalSpecialExpenses += evt.amount;
    }
  }

  const remaining = totalIncome - totalFixedExpenses - totalLoanPayments - totalCardPayments + totalSpecialIncome - totalSpecialExpenses;

  const totalDebt = data.loans.reduce((sum, l) => sum + l.balance, 0) + data.cardInfo.installmentBalance;

  return {
    yearMonth,
    totalIncome,
    totalFixedExpenses,
    totalLoanPayments,
    totalCardPayments,
    totalSpecialIncome,
    totalSpecialExpenses,
    remaining,
    cumulativeRemaining: 0,
    totalDebt,
  };
}

export function calculateMultiMonthSummary(data: FinancialData, startYM: string, count: number): MonthSummary[] {
  const summaries: MonthSummary[] = [];
  let cumulative = 0;

  for (let i = 0; i < count; i++) {
    const ym = addMonths(startYM, i);
    const summary = calculateMonthSummary(data, ym);
    cumulative += summary.remaining;
    summary.cumulativeRemaining = cumulative;
    summaries.push(summary);
  }

  return summaries;
}

export function calculateTotalAssets(data: FinancialData): number {
  return data.assets.reduce((sum, a) => sum + a.amount, 0);
}

export function calculateTotalDebt(data: FinancialData): number {
  return data.loans.reduce((sum, l) => sum + l.balance, 0) + data.cardInfo.installmentBalance;
}

export function calculateNetWorth(data: FinancialData, cumulativeRemaining: number): number {
  return calculateTotalAssets(data) + cumulativeRemaining - calculateTotalDebt(data);
}

export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return Math.round((balance * annualRate) / 100 / 12);
}

export function getFixedExpenseKRW(amount: number, currency: string, exchangeRate: number): number {
  return currency === "USD" ? Math.round(amount * exchangeRate) : amount;
}
