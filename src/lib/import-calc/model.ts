// Входные и выходные данные расчётного ядра.
// Ядро не содержит текстов интерфейса: только коды строк, проблем и предупреждений,
// чтобы подписи можно было перевести отдельно (сейчас — польский, позже — другие языки).
// Ставки пошлины и VAT, тарифы доставки и курсы сюда не зашиты — они приходят во входных данных с источником.

import type { FxRate } from "./fx";
import type { Currency, Range } from "./money";

/** Комиссия USA AUTO IMPORT, EUR. Учитывается отдельно от комиссий брокеров. */
export const SERVICE_FEE_EUR = 500;

/** Откуда взялась сумма */
export type CostBasis =
  /** Подтверждённый тариф, счёт или оферта */
  | { kind: "confirmed"; source: string; verifiedAt: string; reference?: string }
  /** Предполагаемая сумма, введённая клиентом */
  | { kind: "estimate" };

export type CostEntry = { amount: Range; basis: CostBasis };

/** Ставка в процентах; используется только с подтверждённым источником */
export type PercentRate = { percent: Range; source: string; verifiedAt: string };

/**
 * Правило учёта расхода в таможенной стоимости или базе VAT.
 * unverified — правило не подтверждено таможенным представителем: расчёт даёт диапазон
 * (без расхода — нижняя граница, с расходом — верхняя) и предупреждение.
 */
export type Treatment = "included" | "excluded" | "unverified";

export type BrokerFee = {
  id: string;
  /** auction — брокер на аукционе в США (USD), customs — таможенный представитель в Литве (EUR) */
  kind: "auction" | "customs";
  amount: Range;
  basis: CostBasis;
  customsValue: Treatment;
  /** Учитывается только если расход не вошёл в таможенную стоимость */
  vatBase: Treatment;
};

export const brokerFeeCurrency = (fee: Pick<BrokerFee, "kind">): "USD" | "EUR" =>
  fee.kind === "auction" ? "USD" : "EUR";

export type ImportCalcInput = {
  /** Покупка и доставка до Клайпеды, USD */
  purchase: {
    price: CostEntry | null;
    auctionFees: CostEntry | null;
    usTransport: CostEntry | null;
    seaFreight: CostEntry | null;
    /** Без страховки — явный 0, а не null */
    insurance: CostEntry | null;
  };
  /** Таможенное оформление в Литве, EUR */
  customs: {
    portServices: CostEntry | null;
    dutyRate: PercentRate | null;
    vatRate: PercentRate | null;
  };
  brokerFees: BrokerFee[];
  /**
   * Известное место назначения в Польше может влиять на базу импортного VAT
   * (расходы до первого места назначения). Пока правило не подтверждено — rule: "unverified".
   */
  destination: {
    knownInPoland: boolean;
    rule: Treatment;
    /** Перевозка LT→PL, EUR — только для базы VAT, в итог не входит */
    onwardTransport: CostEntry | null;
  };
  rates: {
    usdPln: FxRate | null;
    eurPln: FxRate | null;
    /** Таможенный курс USD→EUR; если нет — кросс-курс NBP с предупреждением */
    usdEurCustoms: FxRate | null;
  };
};

export type InputField =
  | "price"
  | "auctionFees"
  | "usTransport"
  | "seaFreight"
  | "insurance"
  | "portServices"
  | "dutyRate"
  | "vatRate"
  | "usdPln"
  | "eurPln"
  | "usdEurCustoms"
  | "onwardTransport"
  | `brokerFee:${string}`;

export type InputProblem = { field: InputField; reason: "missing" | "invalid" };

export type LineId =
  | "price"
  | "auctionFees"
  | "usTransport"
  | "seaFreight"
  | "insurance"
  | "duty"
  | "vat"
  | "portServices"
  | "serviceFee"
  | `brokerFee:${string}`;

export type LineBasis = "confirmed" | "estimate" | "calculated";

export type Line = {
  id: LineId;
  currency: Currency;
  amount: Range;
  basis: LineBasis;
  /** Источник подтверждённой суммы */
  source?: string;
};

export type Section<C extends Currency> = { currency: C; lines: Line[]; subtotal: Range };

export type Conversion = {
  section: "purchase" | "customs" | "service";
  from: Currency;
  amount: Range;
  rate: FxRate;
  pln: Range;
};

export type Issue =
  /** Сумма введена клиентом, а не взята из подтверждённого тарифа */
  | { code: "estimate"; field: InputField }
  /** Не подтверждено, входит ли комиссия брокера в таможенную стоимость */
  | { code: "customs-value-unverified"; field: InputField }
  /** Не подтверждено, входит ли комиссия брокера в базу VAT */
  | { code: "vat-base-unverified"; field: InputField }
  /** Не подтверждено, входит ли перевозка в Польшу в базу VAT */
  | { code: "vat-base-destination-unverified" }
  /** Курс USD→EUR не подтверждён как таможенный (например, кросс-курс NBP) */
  | { code: "customs-rate-unconfirmed" }
  | { code: "fx-manual"; pair: "USD/PLN" | "EUR/PLN" };

/** Расходы, которые не входят в итог — для краткого предупреждения в интерфейсе */
export const EXCLUDED_COSTS = [
  "pl-excise",
  "transport-lt-pl",
  "registration",
  "repairs",
] as const;

export type ExcludedCost = (typeof EXCLUDED_COSTS)[number];

export type CompleteResult = {
  status: "complete";
  /** true — все суммы подтверждены и все правила решены; иначе итог предварительный */
  confirmed: boolean;
  purchase: Section<"USD">;
  customs: Section<"EUR"> & {
    customsValue: Range;
    vatBase: Range;
    dutyRate: PercentRate;
    vatRate: PercentRate;
    usdEurRate: FxRate;
  };
  service: Section<"EUR">;
  total: { currency: "PLN"; amount: Range; conversions: Conversion[] };
  issues: Issue[];
  excluded: readonly ExcludedCost[];
};

export type IncompleteResult = {
  status: "incomplete";
  problems: InputProblem[];
  excluded: readonly ExcludedCost[];
};

export type ImportCalcResult = CompleteResult | IncompleteResult;
