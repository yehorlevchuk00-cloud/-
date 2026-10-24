// Курсы валют с указанием источника. Курс без источника в расчёт не попадает.

import type { NbpRate } from "../nbp-rates";
import type { Currency } from "./money";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type RateSource =
  /** Средний курс NBP, таблица A */
  | { kind: "nbp"; table: "A"; effectiveDate: string }
  /** Таможенный курс, подтверждённый таможенным представителем (например, курс ЕЦБ для таможни) */
  | { kind: "customs"; reference: string; effectiveDate: string }
  /** Курс, введённый вручную */
  | { kind: "manual"; note?: string }
  /** Кросс-курс через PLN из двух других курсов */
  | { kind: "cross"; via: "PLN"; legs: [RateSource, RateSource] };

/** 1 from = rate to */
export type FxRate = { from: Currency; to: Currency; rate: number; source: RateSource };

/** Курс NBP (PLN за 1 USD/EUR) с сохранением даты таблицы */
export function fxFromNbp(rate: NbpRate): FxRate {
  return {
    from: rate.code,
    to: "PLN",
    rate: rate.mid,
    source: { kind: "nbp", table: "A", effectiveDate: rate.effectiveDate },
  };
}

/** Кросс-курс from→to через PLN: (from→PLN) / (to→PLN) */
export function crossRate(fromPln: FxRate, toPln: FxRate): FxRate {
  if (fromPln.to !== "PLN" || toPln.to !== "PLN") {
    throw new Error("Cross rate requires two rates quoted in PLN");
  }
  return {
    from: fromPln.from,
    to: toPln.from,
    rate: fromPln.rate / toPln.rate,
    source: { kind: "cross", via: "PLN", legs: [fromPln.source, toPln.source] },
  };
}

/** Курс пригоден для расчёта: нужная пара, положительное число, корректный источник */
export function isValidFxRate(fx: FxRate, from: Currency, to: Currency) {
  if (fx.from !== from || fx.to !== to) return false;
  if (!Number.isFinite(fx.rate) || fx.rate <= 0) return false;
  return isValidSource(fx.source);
}

function isValidSource(source: RateSource): boolean {
  switch (source.kind) {
    case "nbp":
      return DATE.test(source.effectiveDate);
    case "customs":
      return source.reference.trim() !== "" && DATE.test(source.effectiveDate);
    case "manual":
      return true;
    case "cross":
      return source.legs.every(isValidSource);
  }
}

/** Пересчёт суммы; валюта суммы должна совпадать с from курса */
export function convert(amount: number, currency: Currency, fx: FxRate) {
  if (currency !== fx.from) throw new Error(`Cannot convert ${currency} with ${fx.from}→${fx.to} rate`);
  return amount * fx.rate;
}
