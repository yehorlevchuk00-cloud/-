import { describe, expect, it } from "vitest";

import { convert, crossRate, fxFromNbp, isValidFxRate } from "../fx";
import { nbp } from "./fixtures";

describe("fxFromNbp", () => {
  it("сохраняет курс и дату таблицы NBP как источник", () => {
    const fx = fxFromNbp({ code: "USD", mid: 3.6512, effectiveDate: "2026-10-23" });
    expect(fx).toEqual({
      from: "USD",
      to: "PLN",
      rate: 3.6512,
      source: { kind: "nbp", table: "A", effectiveDate: "2026-10-23" },
    });
  });
});

describe("convert", () => {
  it("пересчитывает сумму по курсу", () => {
    expect(convert(1000, "USD", nbp("USD", 3.7))).toBeCloseTo(3700, 10);
    expect(convert(500, "EUR", nbp("EUR", 4.3))).toBeCloseTo(2150, 10);
  });

  it("не пересчитывает сумму в чужой валюте", () => {
    expect(() => convert(1000, "EUR", nbp("USD", 3.7))).toThrow();
  });
});

describe("crossRate", () => {
  it("строит USD→EUR через PLN и хранит оба источника", () => {
    const fx = crossRate(nbp("USD", 3.7), nbp("EUR", 4.3));
    expect(fx.from).toBe("USD");
    expect(fx.to).toBe("EUR");
    expect(fx.rate).toBeCloseTo(3.7 / 4.3, 12);
    expect(fx.source).toEqual({
      kind: "cross",
      via: "PLN",
      legs: [nbp("USD", 3.7).source, nbp("EUR", 4.3).source],
    });
  });

  it("отказывает, если курсы не к PLN", () => {
    const usdEur = { ...nbp("USD", 0.9), to: "EUR" as const };
    expect(() => crossRate(usdEur, nbp("EUR", 4.3))).toThrow();
  });
});

describe("isValidFxRate", () => {
  it("принимает корректный курс NBP и ручной курс", () => {
    expect(isValidFxRate(nbp("USD", 3.7), "USD", "PLN")).toBe(true);
    expect(
      isValidFxRate({ from: "EUR", to: "PLN", rate: 4.3, source: { kind: "manual" } }, "EUR", "PLN"),
    ).toBe(true);
  });

  it.each([
    ["другая пара", nbp("EUR", 4.3)],
    ["нулевой курс", nbp("USD", 0)],
    ["отрицательный курс", nbp("USD", -3.7)],
    ["NaN", nbp("USD", Number.NaN)],
    [
      "некорректная дата",
      { ...nbp("USD", 3.7), source: { kind: "nbp" as const, table: "A" as const, effectiveDate: "23.10.2026" } },
    ],
    [
      "таможенный курс без ссылки",
      {
        ...nbp("USD", 3.7),
        source: { kind: "customs" as const, reference: " ", effectiveDate: "2026-10-01" },
      },
    ],
  ])("отклоняет: %s", (_, fx) => {
    expect(isValidFxRate(fx, "USD", "PLN")).toBe(false);
  });
});
