// Денежные суммы и диапазоны для нового расчётного ядра.
// Каждая сумма хранится в своей исходной валюте; точная сумма — диапазон с min === max.

export type Currency = "USD" | "EUR" | "PLN";

/** Диапазон суммы или ставки; точное значение — min === max */
export type Range = { min: number; max: number };

/** Граница сценария: min — нижняя оценка, max — верхняя */
export type Bound = keyof Range;

export const exact = (value: number): Range => ({ min: value, max: value });

export const range = (min: number, max: number): Range => ({ min, max });

export const roundCents = (value: number) => Math.round(value * 100) / 100;

/** Конечные неотрицательные числа, min ≤ max */
export function isValidRange(value: Range) {
  return (
    Number.isFinite(value.min) &&
    Number.isFinite(value.max) &&
    value.min >= 0 &&
    value.min <= value.max
  );
}

export const isExact = (value: Range) => value.min === value.max;

/** Объединяет результаты двух сценариев в диапазон */
export const fromBounds = (low: number, high: number): Range => ({
  min: Math.min(low, high),
  max: Math.max(low, high),
});
