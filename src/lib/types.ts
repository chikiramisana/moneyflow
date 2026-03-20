export type Currency = "KRW" | "USD";
export type PaymentMethod = "card" | "transfer" | "cash" | "other";
export type RepaymentType = "partial" | "full_only";
export type EventType = "income" | "expense";
export type RepaymentStrategy = "snowball" | "avalanche";

export interface MonthlyIncome {
  id: string;
  yearMonth: string; // "2026-04"
  salary: number;
  bonus: number;
  rentSubsidy: number;
  otherIncome: number;
  otherIncomeMemo: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  paymentDay: number; // 1-31, 0 = 말일
  paymentMethod: PaymentMethod;
  enabled: boolean;
  disabledMonths: string[]; // ["2026-04", "2026-05"]
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // 12.99 => 12.99%
  monthlyPayment: number;
  paymentDay: number;
  repaymentType: RepaymentType;
  history: LoanEvent[];
}

export interface LoanEvent {
  id: string;
  date: string; // ISO date
  type: "payment" | "prepayment";
  amount: number;
}

export interface CardInstallment {
  id: string;
  yearMonth: string;
  paymentDay: number;
  expectedAmount: number;
}

export interface CardInfo {
  totalLimit: number;
  usedLimit: number;
  installmentBalance: number;
  limitChanges: LimitChange[];
}

export interface LimitChange {
  id: string;
  date: string;
  newLimit: number;
}

export interface SpecialEvent {
  id: string;
  name: string;
  amount: number;
  type: EventType;
  isRecurring: boolean;
  startMonth: string; // "2026-05"
  endMonth: string; // "2026-09"
}

export interface Asset {
  id: string;
  name: string;
  amount: number;
}

export interface AppSettings {
  exchangeRate: number; // USD -> KRW
}

export interface FinancialData {
  income: MonthlyIncome[];
  fixedExpenses: FixedExpense[];
  loans: Loan[];
  cardInstallments: CardInstallment[];
  cardInfo: CardInfo;
  specialEvents: SpecialEvent[];
  assets: Asset[];
  settings: AppSettings;
}

export interface MonthSummary {
  yearMonth: string;
  totalIncome: number;
  totalFixedExpenses: number;
  totalLoanPayments: number;
  totalCardPayments: number;
  totalSpecialIncome: number;
  totalSpecialExpenses: number;
  remaining: number;
  cumulativeRemaining: number;
  totalDebt: number;
}
