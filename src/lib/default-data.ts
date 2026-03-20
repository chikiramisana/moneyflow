import type { FinancialData } from "./types";

export function createDefaultData(): FinancialData {
  return {
    income: [],
    fixedExpenses: [],
    loans: [],
    cardInstallments: [],
    cardInfo: {
      totalLimit: 0,
      usedLimit: 0,
      installmentBalance: 0,
      limitChanges: [],
    },
    specialEvents: [],
    assets: [],
    settings: {
      exchangeRate: 1400,
    },
  };
}
