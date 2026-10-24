// Тестовые данные. Все суммы, ставки и курсы здесь условные и НЕ являются тарифами или ставками.

import type { FxRate } from "../fx";
import type { CostEntry, ImportCalcInput, PercentRate } from "../model";
import { exact, type Range } from "../money";

export const confirmed = (amount: number | Range): CostEntry => ({
  amount: typeof amount === "number" ? exact(amount) : amount,
  basis: { kind: "confirmed", source: "Test tariff", verifiedAt: "2026-10-01" },
});

export const estimate = (amount: number | Range): CostEntry => ({
  amount: typeof amount === "number" ? exact(amount) : amount,
  basis: { kind: "estimate" },
});

export const testRate = (percent: number | Range): PercentRate => ({
  percent: typeof percent === "number" ? exact(percent) : percent,
  source: "Test rate",
  verifiedAt: "2026-10-01",
});

export const nbp = (from: "USD" | "EUR", rate: number): FxRate => ({
  from,
  to: "PLN",
  rate,
  source: { kind: "nbp", table: "A", effectiveDate: "2026-10-23" },
});

export const customsUsdEur = (rate: number): FxRate => ({
  from: "USD",
  to: "EUR",
  rate,
  source: { kind: "customs", reference: "TEST", effectiveDate: "2026-10-01" },
});

/**
 * Полностью подтверждённый набор данных.
 * Покупка: 10000 + 800 + 600 + 1200 + 100 = 12700 USD.
 * Таможенная стоимость: 12700 × 0,9 = 11430 EUR; пошлина 10% = 1143; база VAT 11430 + 1143 + 400 = 12973;
 * VAT 21% = 2724,33; таможня итого 1143 + 2724,33 + 400 = 4267,33 EUR.
 * PLN: 12700 × 3,7 = 46990; 4267,33 × 4,3 = 18349,52; 500 × 4,3 = 2150; итог 67489,52.
 */
export function baseInput(): ImportCalcInput {
  return {
    purchase: {
      price: confirmed(10000),
      auctionFees: confirmed(800),
      usTransport: confirmed(600),
      seaFreight: confirmed(1200),
      insurance: confirmed(100),
    },
    customs: {
      portServices: confirmed(400),
      dutyRate: testRate(10),
      vatRate: testRate(21),
    },
    brokerFees: [],
    destination: { knownInPoland: false, rule: "unverified", onwardTransport: null },
    rates: {
      usdPln: nbp("USD", 3.7),
      eurPln: nbp("EUR", 4.3),
      usdEurCustoms: customsUsdEur(0.9),
    },
  };
}
