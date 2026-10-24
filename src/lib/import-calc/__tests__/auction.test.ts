import { describe, expect, it } from "vitest";

import type { AuctionFeeSchedule } from "../../auction-fees";
import { auctionFeesForPrice } from "../auction";
import { exact, range } from "../money";

/** Условный тариф для теста, НЕ тариф Copart или IAAI. Сетка намеренно не монотонна. */
const schedule: AuctionFeeSchedule = {
  id: "test",
  auction: "copart",
  plan: "Test plan",
  buyerType: "public",
  biddingMethods: ["online"],
  components: [
    {
      kind: "tiered",
      id: "buyer",
      label: "Buyer fee",
      tiers: [
        { fromUsd: 0, toUsd: 999.99, amountUsd: 100 },
        { fromUsd: 1000, toUsd: 4999.99, percent: 10 },
        { fromUsd: 5000, toUsd: 20000, amountUsd: 300 },
      ],
    },
    { kind: "fixed", id: "doc", label: "Document fee", amountUsd: 50 },
  ],
  source: { name: "Test schedule", url: "https://example.com/test" },
  verifiedAt: "2026-10-01",
  validFrom: "2026-01-01",
  validTo: null,
  status: "verified",
};

describe("auctionFeesForPrice", () => {
  it("точная цена — точные сборы с источником тарифа", () => {
    expect(auctionFeesForPrice(schedule, exact(2000))).toEqual({
      amount: exact(250),
      basis: {
        kind: "confirmed",
        source: "Test schedule",
        reference: "https://example.com/test",
        verifiedAt: "2026-10-01",
      },
    });
  });

  it("диапазон цены учитывает максимум внутри диапазона, а не только на границах", () => {
    // На границах: 900 → 150, 6000 → 350; внутри: 4999,99 → 549,999… → 550
    expect(auctionFeesForPrice(schedule, range(900, 6000))?.amount).toEqual(range(150, 550));
  });

  it("цена вне сетки тарифа → ручной ввод", () => {
    expect(auctionFeesForPrice(schedule, range(15000, 25000))).toBeNull();
  });

  it("непроверенный или некорректный тариф не используется", () => {
    expect(auctionFeesForPrice({ ...schedule, status: "draft" }, exact(2000))).toBeNull();
    expect(
      auctionFeesForPrice({ ...schedule, source: { name: "Test", url: "http://x" } }, exact(2000)),
    ).toBeNull();
  });

  it("некорректный диапазон цены → null", () => {
    expect(auctionFeesForPrice(schedule, range(5000, 1000))).toBeNull();
  });
});
