// Сборы аукциона по проверенному тарифу для диапазона цены покупки.

import { calculateAuctionFees, validateSchedule, type AuctionFeeSchedule } from "../auction-fees";
import type { CostEntry } from "./model";
import { isValidRange, type Range } from "./money";

/**
 * Сборы для цены в диапазоне [min, max]. Между границами ценовых диапазонов тарифа каждый
 * сбор не убывает, поэтому крайние значения достигаются на границах цены или на границах диапазонов.
 * null — тариф не проверен, некорректен или цена вне его диапазонов: сборы вводятся вручную.
 */
export function auctionFeesForPrice(schedule: AuctionFeeSchedule, price: Range): CostEntry | null {
  if (schedule.status !== "verified" || validateSchedule(schedule).length > 0) return null;
  if (!isValidRange(price)) return null;

  const points = new Set([price.min, price.max]);
  for (const component of schedule.components) {
    if (component.kind !== "tiered") continue;
    for (const tier of component.tiers) {
      for (const edge of [tier.fromUsd, tier.toUsd]) {
        if (edge !== null && edge > price.min && edge < price.max) points.add(edge);
      }
    }
  }

  const totals: number[] = [];
  for (const point of points) {
    const fees = calculateAuctionFees(schedule, point);
    if (!fees) return null;
    totals.push(fees.totalUsd);
  }

  return {
    amount: { min: Math.min(...totals), max: Math.max(...totals) },
    basis: {
      kind: "confirmed",
      source: schedule.source.name,
      reference: schedule.source.url,
      verifiedAt: schedule.verifiedAt,
    },
  };
}
