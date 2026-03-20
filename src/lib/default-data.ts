import { v4 as uuid } from "uuid";
import type { FinancialData } from "./types";

export function createDefaultData(): FinancialData {
  return {
    income: [],
    fixedExpenses: [
      { id: uuid(), name: "월세", amount: 550000, currency: "KRW", paymentDay: 25, paymentMethod: "transfer", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "관리비", amount: 150000, currency: "KRW", paymentDay: 0, paymentMethod: "transfer", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "휴대폰", amount: 150000, currency: "KRW", paymentDay: 15, paymentMethod: "transfer", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "인터넷", amount: 22000, currency: "KRW", paymentDay: 20, paymentMethod: "transfer", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "커서 (Cursor)", amount: 60, currency: "USD", paymentDay: 15, paymentMethod: "card", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "클로드 프로 (Claude Pro)", amount: 22, currency: "USD", paymentDay: 15, paymentMethod: "card", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "네이버플러스", amount: 4900, currency: "KRW", paymentDay: 15, paymentMethod: "card", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "스포티파이", amount: 11950, currency: "KRW", paymentDay: 15, paymentMethod: "card", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "어도비", amount: 26400, currency: "KRW", paymentDay: 15, paymentMethod: "card", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "릴리스", amount: 7900, currency: "KRW", paymentDay: 15, paymentMethod: "other", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "식비", amount: 170000, currency: "KRW", paymentDay: 0, paymentMethod: "cash", enabled: true, disabledMonths: [] },
      { id: uuid(), name: "기타 생활비", amount: 100000, currency: "KRW", paymentDay: 0, paymentMethod: "other", enabled: true, disabledMonths: [] },
    ],
    loans: [
      { id: uuid(), name: "OK론 (12.99%)", balance: 1700473, interestRate: 12.99, monthlyPayment: 95000, paymentDay: 12, repaymentType: "full_only", history: [] },
      { id: uuid(), name: "IBK사잇돌 (11.51%)", balance: 3296142, interestRate: 11.51, monthlyPayment: 93000, paymentDay: 15, repaymentType: "partial", history: [] },
      { id: uuid(), name: "햇살론 (7.16%)", balance: 2550000, interestRate: 7.16, monthlyPayment: 66000, paymentDay: 30, repaymentType: "partial", history: [] },
      { id: uuid(), name: "I-ONE햇살론YOUTH ① (3.5%)", balance: 3000000, interestRate: 3.5, monthlyPayment: 0, paymentDay: 25, repaymentType: "partial", history: [] },
      { id: uuid(), name: "I-ONE햇살론YOUTH ② (3.5%)", balance: 3000000, interestRate: 3.5, monthlyPayment: 0, paymentDay: 25, repaymentType: "partial", history: [] },
    ],
    cardInstallments: [
      { id: uuid(), yearMonth: "2026-04", paymentDay: 8, expectedAmount: 1162747 },
      { id: uuid(), yearMonth: "2026-05", paymentDay: 8, expectedAmount: 647609 },
    ],
    cardInfo: {
      totalLimit: 3600000,
      usedLimit: 3203687,
      installmentBalance: 3203687,
      limitChanges: [],
    },
    specialEvents: [
      { id: uuid(), name: "건보료 분할납부", amount: 446000, type: "expense", isRecurring: true, startMonth: "2026-05", endMonth: "2026-09" },
      { id: uuid(), name: "떡값", amount: 2000000, type: "income", isRecurring: false, startMonth: "2026-08", endMonth: "2026-08" },
      { id: uuid(), name: "타결금", amount: 10000000, type: "income", isRecurring: false, startMonth: "2026-08", endMonth: "2026-08" },
    ],
    assets: [
      { id: uuid(), name: "보증금", amount: 5000000 },
      { id: uuid(), name: "바이크", amount: 2000000 },
    ],
    settings: {
      exchangeRate: 1400,
    },
  };
}
