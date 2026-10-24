// Расчёт аукционных сборов Copart и IAAI по проверенным тарифам.
// Тарифы НЕ заполнены: значения появятся только после проверки по официальным документам
// аукционов. Пока проверенного тарифа нет, калькулятор использует ручной ввод «Opłaty aukcyjne».

export type AuctionHouse = "copart" | "iaai";

/** Тип покупателя / тарифный план, от которого зависит сетка сборов */
export type BuyerType = "public" | "licensed" | "broker";

/** Способ участия в торгах (у аукционов сборы за онлайн-участие могут отличаться) */
export type BiddingMethod = "online" | "preliminary" | "inPerson";

/** Диапазон цены покупки: [fromUsd, toUsd], toUsd = null — без верхней границы */
export type FeeTier = {
  fromUsd: number;
  toUsd: number | null;
  /** Фиксированная сумма для диапазона */
  amountUsd?: number;
  /** Процент от цены покупки для диапазона */
  percent?: number;
};

export type FeeComponent =
  /** Сбор по ценовой сетке (например, основной сбор покупателя) */
  | { kind: "tiered"; id: string; label: string; tiers: FeeTier[] }
  /** Фиксированный сбор (например, за документы или въезд на площадку) */
  | { kind: "fixed"; id: string; label: string; amountUsd: number }
  /** Процент от цены с необязательными ограничениями */
  | {
      kind: "percent";
      id: string;
      label: string;
      percent: number;
      minUsd?: number;
      maxUsd?: number;
    };

export type AuctionFeeSchedule = {
  id: string;
  auction: AuctionHouse;
  /** Название тарифного плана так, как в документе аукциона */
  plan: string;
  buyerType: BuyerType;
  biddingMethods: BiddingMethod[];
  components: FeeComponent[];
  source: {
    /** Название официального документа */
    name: string;
    /** Ссылка на официальный документ аукциона */
    url: string;
  };
  /** Дата, когда тариф сверен с документом (YYYY-MM-DD) */
  verifiedAt: string;
  /** Период действия тарифа (YYYY-MM-DD); validTo = null — до замены */
  validFrom: string;
  validTo: string | null;
  /** Только "verified" используется в расчёте */
  status: "verified" | "draft";
};

/**
 * Проверенные тарифы. Пусто намеренно: добавлять только после сверки с официальным
 * документом аукциона, с заполненными source и verifiedAt.
 */
export const AUCTION_FEE_SCHEDULES: AuctionFeeSchedule[] = [];

/**
 * Параметры аккаунта, через который USA AUTO IMPORT покупает на аукционе.
 * null — план не определён, автоматический расчёт для этого аукциона невозможен.
 */
export const AUCTION_ACCOUNTS: Record<
  AuctionHouse,
  { buyerType: BuyerType; biddingMethod: BiddingMethod } | null
> = {
  copart: null,
  iaai: null,
};

export const auctionLabels: Record<AuctionHouse, string> = {
  copart: "Copart",
  iaai: "IAAI",
};

export type AuctionFeeQuery = {
  auction: AuctionHouse | null;
  buyerType: BuyerType | null;
  biddingMethod: BiddingMethod | null;
  priceUsd: number | null;
  /** Дата, на которую нужен тариф (YYYY-MM-DD); null — дата ещё неизвестна (пререндер) */
  date: string | null;
};

export type AuctionFeeLine = { id: string; label: string; amountUsd: number };

export type AuctionFeeEstimate =
  | {
      status: "calculated";
      totalUsd: number;
      lines: AuctionFeeLine[];
      schedule: AuctionFeeSchedule;
    }
  | {
      status: "manual";
      /** Почему нельзя посчитать автоматически — показывается пользователю */
      reason: string;
    };

const roundCents = (value: number) => Math.round(value * 100) / 100;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Ошибки структуры тарифа; пустой массив — тариф пригоден для расчёта */
export function validateSchedule(schedule: AuctionFeeSchedule): string[] {
  const errors: string[] = [];
  if (!schedule.source.name.trim()) errors.push("brak nazwy źródła");
  if (!/^https:\/\//.test(schedule.source.url)) errors.push("źródło musi być adresem https");
  for (const [field, value] of [
    ["verifiedAt", schedule.verifiedAt],
    ["validFrom", schedule.validFrom],
    ["validTo", schedule.validTo ?? "2000-01-01"],
  ] as const) {
    if (!DATE.test(value) || Number.isNaN(Date.parse(value))) errors.push(`nieprawidłowa data ${field}`);
  }
  if (schedule.validTo && schedule.validTo < schedule.validFrom) {
    errors.push("validTo jest wcześniejsze niż validFrom");
  }
  if (schedule.biddingMethods.length === 0) errors.push("brak sposobu licytacji");
  if (schedule.components.length === 0) errors.push("brak składników opłat");

  for (const component of schedule.components) {
    if (component.kind === "fixed" && !(component.amountUsd >= 0)) {
      errors.push(`${component.id}: kwota musi być ≥ 0`);
    }
    if (component.kind === "percent") {
      if (!(component.percent >= 0)) errors.push(`${component.id}: procent musi być ≥ 0`);
      if (
        component.minUsd !== undefined &&
        component.maxUsd !== undefined &&
        component.minUsd > component.maxUsd
      ) {
        errors.push(`${component.id}: minimum większe niż maksimum`);
      }
    }
    if (component.kind === "tiered") {
      const tiers = component.tiers;
      if (tiers.length === 0) errors.push(`${component.id}: brak przedziałów`);
      tiers.forEach((tier, index) => {
        const hasAmount = tier.amountUsd !== undefined;
        const hasPercent = tier.percent !== undefined;
        if (hasAmount === hasPercent) {
          errors.push(`${component.id}[${index}]: podaj kwotę albo procent`);
        }
        if ((tier.amountUsd ?? 0) < 0 || (tier.percent ?? 0) < 0) {
          errors.push(`${component.id}[${index}]: wartość musi być ≥ 0`);
        }
        if (tier.toUsd !== null && tier.toUsd < tier.fromUsd) {
          errors.push(`${component.id}[${index}]: koniec przedziału przed początkiem`);
        }
        // Диапазоны должны идти подряд без разрывов и пересечений (шаг 0,01 USD)
        const next = tiers[index + 1];
        if (next) {
          if (tier.toUsd === null) errors.push(`${component.id}[${index}]: otwarty przedział nie jest ostatni`);
          else if (roundCents(next.fromUsd - tier.toUsd) !== 0.01) {
            errors.push(`${component.id}[${index}]: luka lub nakładanie się przedziałów`);
          }
        }
      });
    }
  }
  return errors;
}

/** Сумма сборов по тарифу; null — цена вне диапазонов тарифа */
export function calculateAuctionFees(
  schedule: AuctionFeeSchedule,
  priceUsd: number,
): { totalUsd: number; lines: AuctionFeeLine[] } | null {
  const lines: AuctionFeeLine[] = [];

  for (const component of schedule.components) {
    let amount: number;
    if (component.kind === "fixed") {
      amount = component.amountUsd;
    } else if (component.kind === "percent") {
      amount = (priceUsd * component.percent) / 100;
      if (component.minUsd !== undefined) amount = Math.max(amount, component.minUsd);
      if (component.maxUsd !== undefined) amount = Math.min(amount, component.maxUsd);
    } else {
      const tier = component.tiers.find(
        (item) => priceUsd >= item.fromUsd && (item.toUsd === null || priceUsd <= item.toUsd),
      );
      if (!tier) return null;
      amount = tier.amountUsd ?? (priceUsd * (tier.percent ?? 0)) / 100;
    }
    lines.push({ id: component.id, label: component.label, amountUsd: roundCents(amount) });
  }

  return {
    totalUsd: roundCents(lines.reduce((sum, line) => sum + line.amountUsd, 0)),
    lines,
  };
}

/**
 * Ищет действующий проверенный тариф и считает сборы.
 * Любая недостающая информация — ручной ввод с понятной причиной; значения не подставляются.
 */
export function estimateAuctionFees(
  query: AuctionFeeQuery,
  schedules: AuctionFeeSchedule[] = AUCTION_FEE_SCHEDULES,
): AuctionFeeEstimate {
  if (!query.auction) return { status: "manual", reason: "Aukcja nie jest znana." };

  const name = auctionLabels[query.auction];
  if (!query.buyerType || !query.biddingMethod) {
    return { status: "manual", reason: `Nie określono planu taryfowego konta ${name}.` };
  }

  if (!query.date) return { status: "manual", reason: "Sprawdzanie taryfy…" };
  const date = query.date;

  const schedule = schedules.find(
    (item) =>
      item.status === "verified" &&
      item.auction === query.auction &&
      item.buyerType === query.buyerType &&
      item.biddingMethods.includes(query.biddingMethod!) &&
      item.validFrom <= date &&
      (item.validTo === null || date <= item.validTo) &&
      validateSchedule(item).length === 0,
  );
  if (!schedule) {
    return { status: "manual", reason: `Brak zweryfikowanej taryfy ${name} dla tego planu.` };
  }

  if (query.priceUsd === null) {
    return { status: "manual", reason: "Podaj cenę zakupu, aby obliczyć opłaty." };
  }

  const fees = calculateAuctionFees(schedule, query.priceUsd);
  if (!fees) {
    return { status: "manual", reason: `Cena poza zakresem taryfy ${name}.` };
  }

  return { status: "calculated", ...fees, schedule };
}
