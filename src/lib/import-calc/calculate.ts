// Расчёт стоимости импорта: покупка и доставка (USD) → таможенное оформление в Литве (EUR) → итог (PLN).
// Если обязательные данные отсутствуют или некорректны — итог не формируется, возвращается список проблем.
// Неопределённость (диапазон цены, неподтверждённое правило) считается двумя сценариями:
// нижняя граница — минимальные суммы и спорные расходы не учтены, верхняя — максимальные и учтены.
// Все формулы монотонны, поэтому границы сценариев — границы итога.

import { crossRate, convert, isValidFxRate, type FxRate } from "./fx";
import {
  EXCLUDED_COSTS,
  SERVICE_FEE_EUR,
  type BrokerFee,
  type CostBasis,
  type CostEntry,
  type ImportCalcInput,
  type ImportCalcResult,
  type InputField,
  type InputProblem,
  type Issue,
  type Line,
  type LineId,
  type PercentRate,
  type Treatment,
} from "./model";
import {
  fromBounds,
  isExact,
  isValidRange,
  roundCents,
  type Bound,
  type Currency,
  type Range,
} from "./money";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const PURCHASE_FIELDS = ["price", "auctionFees", "usTransport", "seaFreight", "insurance"] as const;

/** Источник подтверждённой комиссии USA AUTO IMPORT */
const SERVICE_FEE_SOURCE = "USA AUTO IMPORT";

const isValidBasis = (basis: CostBasis) =>
  basis.kind === "estimate" || (basis.source.trim() !== "" && DATE.test(basis.verifiedAt));

const isValidEntry = (entry: { amount: Range; basis: CostBasis }) =>
  isValidRange(entry.amount) && isValidBasis(entry.basis);

const isValidPercent = (rate: PercentRate) =>
  isValidRange(rate.percent) &&
  rate.percent.max <= 100 &&
  rate.source.trim() !== "" &&
  DATE.test(rate.verifiedAt);

function validate(input: ImportCalcInput): InputProblem[] {
  const problems: InputProblem[] = [];
  const check = <T>(field: InputField, value: T | null, isValid: (value: T) => boolean) => {
    if (value === null) problems.push({ field, reason: "missing" });
    else if (!isValid(value)) problems.push({ field, reason: "invalid" });
  };

  for (const field of PURCHASE_FIELDS) check(field, input.purchase[field], isValidEntry);
  check("portServices", input.customs.portServices, isValidEntry);
  check("dutyRate", input.customs.dutyRate, isValidPercent);
  check("vatRate", input.customs.vatRate, isValidPercent);
  check("usdPln", input.rates.usdPln, (fx) => isValidFxRate(fx, "USD", "PLN"));
  check("eurPln", input.rates.eurPln, (fx) => isValidFxRate(fx, "EUR", "PLN"));
  // Таможенный курс необязателен: без него используется кросс-курс NBP с предупреждением
  if (input.rates.usdEurCustoms && !isValidFxRate(input.rates.usdEurCustoms, "USD", "EUR")) {
    problems.push({ field: "usdEurCustoms", reason: "invalid" });
  }

  const ids = new Set<string>();
  for (const fee of input.brokerFees) {
    const valid = fee.id.trim() !== "" && !ids.has(fee.id) && isValidEntry(fee);
    ids.add(fee.id);
    if (!valid) problems.push({ field: `brokerFee:${fee.id}`, reason: "invalid" });
  }

  const { destination } = input;
  if (destination.knownInPoland && destination.rule !== "excluded") {
    check("onwardTransport", destination.onwardTransport, isValidEntry);
  }

  return problems;
}

/** Входные данные после проверки — без null */
type Ready = {
  purchase: Record<(typeof PURCHASE_FIELDS)[number], CostEntry>;
  portServices: CostEntry;
  dutyRate: PercentRate;
  vatRate: PercentRate;
  brokerFees: BrokerFee[];
  /** Перевозка LT→PL для базы VAT; null — не влияет на базу */
  onward: { entry: CostEntry; rule: Treatment } | null;
  usdPln: FxRate;
  eurPln: FxRate;
  usdEur: FxRate;
};

type Scenario = {
  purchase: Map<LineId, number>;
  purchaseSubtotal: number;
  customsValue: number;
  vatBase: number;
  customs: Map<LineId, number>;
  customsSubtotal: number;
  service: number;
  pln: { purchase: number; customs: number; service: number };
  total: number;
};

const sum = (values: Iterable<number>) => [...values].reduce((total, value) => total + value, 0);

const feeLine = (fee: BrokerFee): `brokerFee:${string}` => `brokerFee:${fee.id}`;

function scenario(ready: Ready, bound: Bound): Scenario {
  const pick = (value: { amount: Range }) => value.amount[bound];
  // Спорный расход учитывается только в верхней границе
  const counts = (treatment: Treatment) =>
    treatment === "included" || (treatment === "unverified" && bound === "max");

  const auctionFees = ready.brokerFees.filter((fee) => fee.kind === "auction");
  const customsFees = ready.brokerFees.filter((fee) => fee.kind === "customs");

  const purchase = new Map<LineId, number>([
    ...PURCHASE_FIELDS.map((id) => [id, pick(ready.purchase[id])] as const),
    ...auctionFees.map((fee) => [feeLine(fee), pick(fee)] as const),
  ]);
  const purchaseSubtotal = roundCents(sum(purchase.values()));

  // Таможенная стоимость (CIF до Клайпеды). Комиссия USA AUTO IMPORT сюда не входит.
  const inCustomsValue = (fees: BrokerFee[]) =>
    sum(fees.filter((fee) => counts(fee.customsValue)).map(pick));
  const cvUsd = sum(PURCHASE_FIELDS.map((id) => pick(ready.purchase[id]))) + inCustomsValue(auctionFees);
  const customsValue = roundCents(convert(cvUsd, "USD", ready.usdEur) + inCustomsValue(customsFees));

  const duty = roundCents((customsValue * ready.dutyRate.percent[bound]) / 100);

  // База импортного VAT: таможенная стоимость + пошлина + сопутствующие расходы до места назначения
  const onlyInVatBase = (fees: BrokerFee[]) =>
    sum(fees.filter((fee) => !counts(fee.customsValue) && counts(fee.vatBase)).map(pick));
  const onward = ready.onward && counts(ready.onward.rule) ? pick(ready.onward.entry) : 0;
  const vatBase = roundCents(
    customsValue +
      duty +
      pick(ready.portServices) +
      convert(onlyInVatBase(auctionFees), "USD", ready.usdEur) +
      onlyInVatBase(customsFees) +
      onward,
  );
  const vat = roundCents((vatBase * ready.vatRate.percent[bound]) / 100);

  const customs = new Map<LineId, number>([
    ["duty", duty],
    ["vat", vat],
    ["portServices", pick(ready.portServices)],
    ...customsFees.map((fee) => [feeLine(fee), pick(fee)] as const),
  ]);
  const customsSubtotal = roundCents(sum(customs.values()));

  const pln = {
    purchase: roundCents(convert(purchaseSubtotal, "USD", ready.usdPln)),
    customs: roundCents(convert(customsSubtotal, "EUR", ready.eurPln)),
    service: roundCents(convert(SERVICE_FEE_EUR, "EUR", ready.eurPln)),
  };

  return {
    purchase,
    purchaseSubtotal,
    customsValue,
    vatBase,
    customs,
    customsSubtotal,
    service: SERVICE_FEE_EUR,
    pln,
    total: roundCents(pln.purchase + pln.customs + pln.service),
  };
}

function collectIssues(ready: Ready): Issue[] {
  const issues: Issue[] = [];

  for (const field of PURCHASE_FIELDS) {
    if (ready.purchase[field].basis.kind === "estimate") issues.push({ code: "estimate", field });
  }
  if (ready.portServices.basis.kind === "estimate") {
    issues.push({ code: "estimate", field: "portServices" });
  }
  for (const fee of ready.brokerFees) {
    const field = feeLine(fee);
    if (fee.basis.kind === "estimate") issues.push({ code: "estimate", field });
    if (fee.customsValue === "unverified") issues.push({ code: "customs-value-unverified", field });
    else if (fee.customsValue === "excluded" && fee.vatBase === "unverified") {
      issues.push({ code: "vat-base-unverified", field });
    }
  }

  if (ready.onward) {
    if (ready.onward.rule === "unverified") issues.push({ code: "vat-base-destination-unverified" });
    if (ready.onward.entry.basis.kind === "estimate") {
      issues.push({ code: "estimate", field: "onwardTransport" });
    }
  }

  if (ready.usdEur.source.kind !== "customs") issues.push({ code: "customs-rate-unconfirmed" });
  if (ready.usdPln.source.kind === "manual") issues.push({ code: "fx-manual", pair: "USD/PLN" });
  if (ready.eurPln.source.kind === "manual") issues.push({ code: "fx-manual", pair: "EUR/PLN" });

  return issues;
}

const entryLine = (id: LineId, currency: Currency, entry: CostEntry): Line => ({
  id,
  currency,
  amount: entry.amount,
  basis: entry.basis.kind,
  ...(entry.basis.kind === "confirmed" && { source: entry.basis.source }),
});

export function calculateImport(input: ImportCalcInput): ImportCalcResult {
  const problems = validate(input);
  if (problems.length > 0) return { status: "incomplete", problems, excluded: EXCLUDED_COSTS };

  // После validate все обязательные поля заполнены и корректны
  const { purchase, customs, destination, rates } = input;
  const usdPln = rates.usdPln!;
  const eurPln = rates.eurPln!;
  const ready: Ready = {
    purchase: {
      price: purchase.price!,
      auctionFees: purchase.auctionFees!,
      usTransport: purchase.usTransport!,
      seaFreight: purchase.seaFreight!,
      insurance: purchase.insurance!,
    },
    portServices: customs.portServices!,
    dutyRate: customs.dutyRate!,
    vatRate: customs.vatRate!,
    brokerFees: input.brokerFees,
    onward:
      destination.knownInPoland && destination.rule !== "excluded"
        ? { entry: destination.onwardTransport!, rule: destination.rule }
        : null,
    usdPln,
    eurPln,
    usdEur: rates.usdEurCustoms ?? crossRate(usdPln, eurPln),
  };

  const low = scenario(ready, "min");
  const high = scenario(ready, "max");
  const between = (pick: (value: Scenario) => number) => fromBounds(pick(low), pick(high));
  const feeById = new Map<LineId, BrokerFee>(ready.brokerFees.map((fee) => [feeLine(fee), fee]));

  const purchaseLines: Line[] = [...low.purchase.keys()].map((id) => {
    const fee = feeById.get(id);
    return fee
      ? entryLine(id, "USD", fee)
      : entryLine(id, "USD", ready.purchase[id as (typeof PURCHASE_FIELDS)[number]]);
  });

  const customsLines: Line[] = [...low.customs.keys()].map((id) => {
    if (id === "duty" || id === "vat") {
      return { id, currency: "EUR", amount: between((s) => s.customs.get(id)!), basis: "calculated" };
    }
    const fee = feeById.get(id);
    return entryLine(id, "EUR", fee ?? ready.portServices);
  });

  const total = between((s) => s.total);
  const issues = collectIssues(ready);

  return {
    status: "complete",
    confirmed: issues.length === 0 && isExact(total),
    purchase: { currency: "USD", lines: purchaseLines, subtotal: between((s) => s.purchaseSubtotal) },
    customs: {
      currency: "EUR",
      lines: customsLines,
      subtotal: between((s) => s.customsSubtotal),
      customsValue: between((s) => s.customsValue),
      vatBase: between((s) => s.vatBase),
      dutyRate: ready.dutyRate,
      vatRate: ready.vatRate,
      usdEurRate: ready.usdEur,
    },
    service: {
      currency: "EUR",
      lines: [
        {
          id: "serviceFee",
          currency: "EUR",
          amount: between((s) => s.service),
          basis: "confirmed",
          source: SERVICE_FEE_SOURCE,
        },
      ],
      subtotal: between((s) => s.service),
    },
    total: {
      currency: "PLN",
      amount: total,
      conversions: [
        {
          section: "purchase",
          from: "USD",
          amount: between((s) => s.purchaseSubtotal),
          rate: usdPln,
          pln: between((s) => s.pln.purchase),
        },
        {
          section: "customs",
          from: "EUR",
          amount: between((s) => s.customsSubtotal),
          rate: eurPln,
          pln: between((s) => s.pln.customs),
        },
        {
          section: "service",
          from: "EUR",
          amount: between((s) => s.service),
          rate: eurPln,
          pln: between((s) => s.pln.service),
        },
      ],
    },
    issues,
    excluded: EXCLUDED_COSTS,
  };
}
