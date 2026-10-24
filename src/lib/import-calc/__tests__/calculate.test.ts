import { describe, expect, it } from "vitest";

import { calculateImport } from "../calculate";
import {
  EXCLUDED_COSTS,
  SERVICE_FEE_EUR,
  type BrokerFee,
  type CompleteResult,
  type ImportCalcInput,
  type IncompleteResult,
} from "../model";
import { exact, range } from "../money";
import { baseInput, confirmed, estimate, nbp, testRate } from "./fixtures";

function complete(input: ImportCalcInput): CompleteResult {
  const result = calculateImport(input);
  if (result.status !== "complete") throw new Error(`incomplete: ${JSON.stringify(result.problems)}`);
  return result;
}

function incomplete(input: ImportCalcInput): IncompleteResult {
  const result = calculateImport(input);
  if (result.status !== "incomplete") throw new Error("expected incomplete result");
  return result;
}

const line = (result: CompleteResult, id: string) =>
  [...result.purchase.lines, ...result.customs.lines, ...result.service.lines].find(
    (item) => item.id === id,
  );

describe("полный подтверждённый расчёт", () => {
  const result = complete(baseInput());

  it("покупка и доставка — в USD", () => {
    expect(result.purchase.currency).toBe("USD");
    expect(result.purchase.lines.map((item) => item.id)).toEqual([
      "price",
      "auctionFees",
      "usTransport",
      "seaFreight",
      "insurance",
    ]);
    expect(result.purchase.lines.every((item) => item.currency === "USD")).toBe(true);
    expect(result.purchase.subtotal).toEqual(exact(12700));
  });

  it("таможенное оформление — в EUR по таможенному курсу", () => {
    expect(result.customs.currency).toBe("EUR");
    expect(result.customs.customsValue).toEqual(exact(11430));
    expect(line(result, "duty")?.amount).toEqual(exact(1143));
    expect(result.customs.vatBase).toEqual(exact(12973));
    expect(line(result, "vat")?.amount).toEqual(exact(2724.33));
    expect(result.customs.subtotal).toEqual(exact(4267.33));
    expect(result.customs.usdEurRate.source.kind).toBe("customs");
  });

  it("комиссия USA AUTO IMPORT — 500 EUR отдельно и не в таможенной стоимости", () => {
    expect(SERVICE_FEE_EUR).toBe(500);
    expect(result.service.lines).toEqual([
      expect.objectContaining({ id: "serviceFee", currency: "EUR", amount: exact(500) }),
    ]);
    // 11430 = 12700 USD × 0,9 — без 500 EUR
    expect(result.customs.customsValue).toEqual(exact(11430));
    expect(result.customs.lines.some((item) => item.id === "serviceFee")).toBe(false);
  });

  it("итог в PLN с источником каждого курса", () => {
    expect(result.total.currency).toBe("PLN");
    expect(result.total.conversions).toEqual([
      expect.objectContaining({ section: "purchase", from: "USD", pln: exact(46990), rate: nbp("USD", 3.7) }),
      expect.objectContaining({ section: "customs", from: "EUR", pln: exact(18349.52), rate: nbp("EUR", 4.3) }),
      expect.objectContaining({ section: "service", from: "EUR", pln: exact(2150), rate: nbp("EUR", 4.3) }),
    ]);
    expect(result.total.amount).toEqual(exact(67489.52));
  });

  it("всё подтверждено — итог подтверждён, исключённые расходы перечислены", () => {
    expect(result.confirmed).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.excluded).toEqual(EXCLUDED_COSTS);
    expect(line(result, "price")).toMatchObject({ basis: "confirmed", source: "Test tariff" });
  });
});

describe("подтверждённый тариф и оценка клиента", () => {
  it("оценка клиента помечается и делает итог предварительным", () => {
    const input = baseInput();
    input.purchase.price = estimate(10000);
    input.purchase.seaFreight = estimate(1200);
    const result = complete(input);

    expect(line(result, "price")).toMatchObject({ basis: "estimate" });
    expect(line(result, "price")).not.toHaveProperty("source");
    expect(line(result, "auctionFees")).toMatchObject({ basis: "confirmed" });
    expect(result.issues).toEqual([
      { code: "estimate", field: "price" },
      { code: "estimate", field: "seaFreight" },
    ]);
    expect(result.confirmed).toBe(false);
    // Сумма та же — меняется только статус
    expect(result.total.amount).toEqual(exact(67489.52));
  });
});

describe("отсутствующие обязательные данные", () => {
  type Mutate = (input: ImportCalcInput) => void;
  const cases: [string, Mutate][] = [
    ["price", (input) => (input.purchase.price = null)],
    ["auctionFees", (input) => (input.purchase.auctionFees = null)],
    ["usTransport", (input) => (input.purchase.usTransport = null)],
    ["seaFreight", (input) => (input.purchase.seaFreight = null)],
    ["insurance", (input) => (input.purchase.insurance = null)],
    ["portServices", (input) => (input.customs.portServices = null)],
    ["dutyRate", (input) => (input.customs.dutyRate = null)],
    ["vatRate", (input) => (input.customs.vatRate = null)],
    ["usdPln", (input) => (input.rates.usdPln = null)],
    ["eurPln", (input) => (input.rates.eurPln = null)],
  ];

  it.each(cases)("без %s итог не формируется", (field, mutate) => {
    const input = baseInput();
    mutate(input);
    const result = incomplete(input);
    expect(result.problems).toEqual([{ field, reason: "missing" }]);
    expect(result).not.toHaveProperty("total");
    expect(result.excluded).toEqual(EXCLUDED_COSTS);
  });

  it("перечисляет все недостающие поля сразу", () => {
    const input = baseInput();
    input.purchase.price = null;
    input.customs.dutyRate = null;
    input.rates.eurPln = null;
    expect(incomplete(input).problems.map((problem) => problem.field)).toEqual([
      "price",
      "dutyRate",
      "eurPln",
    ]);
  });

  it("явный 0 (без страховки) — не пропуск", () => {
    const input = baseInput();
    input.purchase.insurance = confirmed(0);
    expect(complete(input).purchase.subtotal).toEqual(exact(12600));
  });
});

describe("некорректные данные", () => {
  type Mutate = (input: ImportCalcInput) => void;
  const cases: [string, string, Mutate][] = [
    ["отрицательная сумма", "price", (input) => (input.purchase.price = estimate(-1))],
    ["min > max", "price", (input) => (input.purchase.price = estimate(range(12000, 9000)))],
    ["NaN", "seaFreight", (input) => (input.purchase.seaFreight = estimate(Number.NaN))],
    [
      "подтверждённая сумма без источника",
      "usTransport",
      (input) =>
        (input.purchase.usTransport = {
          amount: exact(600),
          basis: { kind: "confirmed", source: "", verifiedAt: "2026-10-01" },
        }),
    ],
    [
      "ставка пошлины без источника",
      "dutyRate",
      (input) => (input.customs.dutyRate = { ...testRate(10), source: " " }),
    ],
    [
      "ставка VAT без даты проверки",
      "vatRate",
      (input) => (input.customs.vatRate = { ...testRate(21), verifiedAt: "" }),
    ],
    ["ставка больше 100%", "dutyRate", (input) => (input.customs.dutyRate = testRate(120))],
    ["курс не той пары", "usdPln", (input) => (input.rates.usdPln = nbp("EUR", 4.3))],
    [
      "таможенный курс не той пары",
      "usdEurCustoms",
      (input) => (input.rates.usdEurCustoms = nbp("USD", 3.7)),
    ],
  ];

  it.each(cases)("%s → итог не формируется", (_, field, mutate) => {
    const input = baseInput();
    mutate(input);
    expect(incomplete(input).problems).toEqual([{ field, reason: "invalid" }]);
  });
});

describe("валютные курсы", () => {
  it("без таможенного курса используется кросс-курс NBP с предупреждением", () => {
    const input = baseInput();
    input.rates.usdEurCustoms = null;
    const result = complete(input);

    expect(result.customs.usdEurRate.source.kind).toBe("cross");
    // 12700 × 3,7 / 4,3 = 10927,906… → 10927,91
    expect(result.customs.customsValue).toEqual(exact(10927.91));
    expect(result.issues).toContainEqual({ code: "customs-rate-unconfirmed" });
    expect(result.confirmed).toBe(false);
  });

  it("ручной курс PLN отмечается, исходный курс сохраняется", () => {
    const input = baseInput();
    const manual = { from: "EUR" as const, to: "PLN" as const, rate: 4.25, source: { kind: "manual" as const } };
    input.rates.eurPln = manual;
    const result = complete(input);

    expect(result.issues).toEqual([{ code: "fx-manual", pair: "EUR/PLN" }]);
    expect(result.total.conversions[1].rate).toEqual(manual);
    // 4267,33 × 4,25 = 18136,1525 → 18136,15; 500 × 4,25 = 2125
    expect(result.total.amount).toEqual(exact(46990 + 18136.15 + 2125));
  });
});

describe("диапазоны цен", () => {
  const totalFor = (mutate: (input: ImportCalcInput) => void) => {
    const input = baseInput();
    mutate(input);
    return complete(input).total.amount;
  };

  it("диапазон цены даёт диапазон итога, равный расчётам на границах", () => {
    const low = totalFor((input) => (input.purchase.price = estimate(9000)));
    const high = totalFor((input) => (input.purchase.price = estimate(11000)));
    const result = complete({
      ...baseInput(),
      purchase: { ...baseInput().purchase, price: estimate(range(9000, 11000)) },
    });

    expect(result.total.amount).toEqual({ min: low.min, max: high.max });
    expect(result.purchase.subtotal).toEqual(range(11700, 13700));
    expect(result.customs.customsValue).toEqual(range(10530, 12330));
    expect(line(result, "price")?.amount).toEqual(range(9000, 11000));
    expect(result.confirmed).toBe(false);
  });

  it("подтверждённый диапазон ставки пошлины даёт диапазон пошлины", () => {
    const input = baseInput();
    input.customs.dutyRate = testRate(range(0, 10));
    const result = complete(input);

    expect(line(result, "duty")?.amount).toEqual(range(0, 1143));
    // VAT: 21% от 11830 = 2484,30; 21% от 12973 = 2724,33
    expect(line(result, "vat")?.amount).toEqual(range(2484.3, 2724.33));
    expect(result.issues).toEqual([]);
    // Ставка подтверждена, но не определена окончательно — итог не подтверждён
    expect(result.confirmed).toBe(false);
  });

  it("точная цена — диапазон нулевой ширины", () => {
    const result = complete(baseInput());
    expect(result.total.amount.min).toBe(result.total.amount.max);
  });
});

describe("комиссии брокеров", () => {
  const fee = (overrides: Partial<BrokerFee>): BrokerFee => ({
    id: "broker",
    kind: "customs",
    amount: exact(150),
    basis: { kind: "confirmed", source: "Test broker", verifiedAt: "2026-10-01" },
    customsValue: "unverified",
    vatBase: "unverified",
    ...overrides,
  });

  it("брокер таможни — в разделе EUR, отдельно от комиссии USA AUTO IMPORT", () => {
    const result = complete({ ...baseInput(), brokerFees: [fee({ customsValue: "excluded", vatBase: "excluded" })] });

    expect(line(result, "brokerFee:broker")).toMatchObject({ currency: "EUR", amount: exact(150) });
    expect(result.customs.lines.map((item) => item.id)).toContain("brokerFee:broker");
    expect(result.service.lines.map((item) => item.id)).toEqual(["serviceFee"]);
    expect(result.customs.customsValue).toEqual(exact(11430));
    expect(result.customs.subtotal).toEqual(exact(4417.33));
  });

  it("неподтверждённое правило → диапазон пошлины и VAT и предупреждение", () => {
    const result = complete({ ...baseInput(), brokerFees: [fee({})] });

    expect(result.customs.customsValue).toEqual(range(11430, 11580));
    expect(line(result, "duty")?.amount).toEqual(range(1143, 1158));
    // 21% от 11580 + 1158 + 400 = 13138 → 2758,98
    expect(line(result, "vat")?.amount).toEqual(range(2724.33, 2758.98));
    expect(result.customs.subtotal).toEqual(range(4417.33, 4466.98));
    expect(result.issues).toEqual([{ code: "customs-value-unverified", field: "brokerFee:broker" }]);
    expect(result.confirmed).toBe(false);
  });

  it("подтверждённое включение в таможенную стоимость", () => {
    const result = complete({ ...baseInput(), brokerFees: [fee({ customsValue: "included" })] });
    expect(result.customs.customsValue).toEqual(exact(11580));
    expect(result.issues).toEqual([]);
  });

  it("только база VAT, правило не подтверждено", () => {
    const result = complete({
      ...baseInput(),
      brokerFees: [fee({ customsValue: "excluded", vatBase: "unverified" })],
    });
    expect(result.customs.customsValue).toEqual(exact(11430));
    expect(result.customs.vatBase).toEqual(range(12973, 13123));
    expect(result.issues).toEqual([{ code: "vat-base-unverified", field: "brokerFee:broker" }]);
  });

  it("брокер на аукционе — в разделе USD; в таможенную стоимость по курсу USD→EUR", () => {
    const auction = fee({ id: "copart-broker", kind: "auction", amount: exact(300), customsValue: "included" });
    const result = complete({ ...baseInput(), brokerFees: [auction] });

    expect(line(result, "brokerFee:copart-broker")).toMatchObject({ currency: "USD", amount: exact(300) });
    expect(result.purchase.subtotal).toEqual(exact(13000));
    // (12700 + 300) × 0,9
    expect(result.customs.customsValue).toEqual(exact(11700));
  });

  it("несколько брокеров считаются раздельно", () => {
    const result = complete({
      ...baseInput(),
      brokerFees: [
        fee({ id: "us", kind: "auction", amount: exact(300), customsValue: "excluded", vatBase: "excluded" }),
        fee({
          id: "lt",
          amount: range(100, 200),
          basis: { kind: "estimate" },
          customsValue: "excluded",
          vatBase: "excluded",
        }),
      ],
    });
    expect(result.purchase.subtotal).toEqual(exact(13000));
    expect(result.customs.subtotal).toEqual(range(4367.33, 4467.33));
    expect(result.issues).toEqual([{ code: "estimate", field: "brokerFee:lt" }]);
  });

  it("повторяющийся или пустой id — некорректные данные", () => {
    expect(incomplete({ ...baseInput(), brokerFees: [fee({}), fee({})] }).problems).toEqual([
      { field: "brokerFee:broker", reason: "invalid" },
    ]);
    expect(incomplete({ ...baseInput(), brokerFees: [fee({ id: "" })] }).problems).toEqual([
      { field: "brokerFee:", reason: "invalid" },
    ]);
  });

  it("некорректная сумма комиссии — итог не формируется", () => {
    const result = incomplete({ ...baseInput(), brokerFees: [fee({ amount: exact(-5) })] });
    expect(result.problems).toEqual([{ field: "brokerFee:broker", reason: "invalid" }]);
  });
});

describe("место назначения в Польше и база VAT", () => {
  it("назначение неизвестно — перевозка не нужна и не влияет", () => {
    const result = complete(baseInput());
    expect(result.customs.vatBase).toEqual(exact(12973));
    expect(result.issues).toEqual([]);
  });

  it("назначение известно, правило не подтверждено, стоимости перевозки нет — итог не формируется", () => {
    const input = baseInput();
    input.destination = { knownInPoland: true, rule: "unverified", onwardTransport: null };
    expect(incomplete(input).problems).toEqual([{ field: "onwardTransport", reason: "missing" }]);
  });

  it("правило не подтверждено → диапазон VAT, перевозка не входит в итог", () => {
    const input = baseInput();
    input.destination = { knownInPoland: true, rule: "unverified", onwardTransport: estimate(700) };
    const result = complete(input);

    expect(result.customs.vatBase).toEqual(range(12973, 13673));
    // 21% от 13673 = 2871,33
    expect(line(result, "vat")?.amount).toEqual(range(2724.33, 2871.33));
    expect(result.customs.subtotal).toEqual(range(4267.33, 4414.33));
    expect(result.customs.lines.map((item) => item.id)).toEqual(["duty", "vat", "portServices"]);
    expect(result.issues).toEqual([
      { code: "vat-base-destination-unverified" },
      { code: "estimate", field: "onwardTransport" },
    ]);
  });

  it("правило подтверждено как исключение — перевозка не требуется", () => {
    const input = baseInput();
    input.destination = { knownInPoland: true, rule: "excluded", onwardTransport: null };
    expect(complete(input).customs.vatBase).toEqual(exact(12973));
  });

  it("правило подтверждено как включение — точная база VAT", () => {
    const input = baseInput();
    input.destination = { knownInPoland: true, rule: "included", onwardTransport: confirmed(700) };
    const result = complete(input);
    expect(result.customs.vatBase).toEqual(exact(13673));
    expect(result.issues).toEqual([]);
  });
});
