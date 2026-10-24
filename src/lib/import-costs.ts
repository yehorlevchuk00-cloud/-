// Расчёт предварительной стоимости импорта: США → Клайпеда → таможня в Литве → Польша.
// Модель: импорт непосредственно на клиента (клиент — декларант/импортёр в Литве).
// Тарифы доставки, аукционные сборы и курсы валют вводит пользователь — здесь их нет.
// Ставки налогов — по состоянию на октябрь 2026 г., требуют проверки перед каждой сделкой.

/** Комиссия USA AUTO IMPORT, EUR */
export const COMMISSION_EUR = 500;

/** Стандартная ставка VAT в Литве, % */
export const LT_VAT_RATE = 21;

export type VehicleType = "passenger" | "pickup";

/** Стандартные ставки пошлины ЕС (не преференциальные): 8703 — 10%, пикапы 8704 — 22% */
export const STANDARD_DUTY: Record<VehicleType, number> = {
  passenger: 10,
  pickup: 22,
};

/**
 * standard — стандартная ставка ЕС;
 * usOrigin — 0% по Регламенту (ЕС) 2026/1455 при доказанном непреференциальном происхождении из США;
 * custom — ставка, подтверждённая агентом.
 */
export type DutyMode = "standard" | "usOrigin" | "custom";

export type Drive = "combustion" | "hybrid" | "plugin" | "electric";

export type CalculatorInput = {
  priceUsd: number;
  auctionFeesUsd: number;
  usTransportUsd: number;
  seaFreightUsd: number;
  insuranceUsd: number;
  portServiceEur: number;
  transportToPlEur: number;
  otherPln: number;
  usdPln: number;
  eurPln: number;
  vehicleType: VehicleType;
  dutyMode: DutyMode;
  customDutyRate: number;
  vatRate: number;
  drive: Drive;
  engineCc: number;
  /** Доставка в Польшу известна при импорте — включается в базу VAT (ст. 86 Директивы 2006/112/WE) */
  transportInVatBase: boolean;
};

/**
 * Акциз в Польше (ст. 105 и 163 закона об акцизе) — только легковые автомобили CN 8703.
 * Возвращает ставку в % либо 0 при освобождении.
 */
export function exciseRate(input: Pick<CalculatorInput, "vehicleType" | "drive" | "engineCc">) {
  if (input.vehicleType !== "passenger") return 0;
  const cc = input.engineCc;

  switch (input.drive) {
    case "electric":
      return 0;
    case "plugin":
      if (cc <= 2000) return 0;
      return cc <= 3500 ? 9.3 : 18.6;
    case "hybrid":
      if (cc <= 2000) return 1.55;
      return cc <= 3500 ? 9.3 : 18.6;
    case "combustion":
      return cc <= 2000 ? 3.1 : 18.6;
  }
}

export function dutyRate(input: Pick<CalculatorInput, "vehicleType" | "dutyMode" | "customDutyRate">) {
  if (input.dutyMode === "usOrigin") return 0;
  if (input.dutyMode === "custom") return input.customDutyRate;
  return STANDARD_DUTY[input.vehicleType];
}

export type CalculatorResult = {
  /** Все суммы — в PLN */
  price: number;
  auctionFees: number;
  usTransport: number;
  seaFreight: number;
  insurance: number;
  customsValue: number;
  dutyRate: number;
  duty: number;
  vatRate: number;
  vatBase: number;
  vat: number;
  portService: number;
  transportToPl: number;
  exciseRate: number;
  exciseBase: number;
  excise: number;
  other: number;
  commission: number;
  /** Пошлина + VAT + акциз */
  taxes: number;
  total: number;
};

export function calculateImportCosts(input: CalculatorInput): CalculatorResult {
  const usd = (value: number) => value * input.usdPln;
  const eur = (value: number) => value * input.eurPln;

  const price = usd(input.priceUsd);
  const auctionFees = usd(input.auctionFeesUsd);
  const usTransport = usd(input.usTransportUsd);
  const seaFreight = usd(input.seaFreightUsd);
  const insurance = usd(input.insuranceUsd);
  const portService = eur(input.portServiceEur);
  const transportToPl = eur(input.transportToPlEur);
  const commission = eur(COMMISSION_EUR);

  // Таможенная стоимость (CIF): цена сделки с аукционными сборами + доставка и страховка до места ввоза в ЕС
  const customsValue = price + auctionFees + usTransport + seaFreight + insurance;

  const duty = customsValue * (dutyRate(input) / 100);

  // База импортного VAT: таможенная стоимость + пошлина + сопутствующие расходы до первого места назначения
  const vatBase =
    customsValue + duty + portService + (input.transportInVatBase ? transportToPl : 0);
  const vat = vatBase * (input.vatRate / 100);

  // Польский акциз: сумма, уплаченная за приобретение автомобиля, без VAT; округление до целых злотых.
  // Повторных пошлины и VAT в Польше нет — автомобиль уже выпущен в свободное обращение в Литве.
  const rate = exciseRate(input);
  const exciseBase = rate > 0 ? Math.round(customsValue + duty) : 0;
  const excise = Math.round(exciseBase * (rate / 100));

  const taxes = duty + vat + excise;
  const total =
    customsValue + duty + vat + portService + transportToPl + excise + input.otherPln + commission;

  return {
    price,
    auctionFees,
    usTransport,
    seaFreight,
    insurance,
    customsValue,
    dutyRate: dutyRate(input),
    duty,
    vatRate: input.vatRate,
    vatBase,
    vat,
    portService,
    transportToPl,
    exciseRate: rate,
    exciseBase,
    excise,
    other: input.otherPln,
    commission,
    taxes,
    total,
  };
}
