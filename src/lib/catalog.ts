// Единый источник данных каталога и страниц автомобилей.
// Сейчас это демонстрационные данные — не реальные лоты Copart/IAAI и не предложения продажи.
// Чтобы подключить API аукционов, достаточно заменить реализацию getCars/getCarBySlug.

import type { Drive, VehicleType } from "@/lib/import-costs";

/** demo — демонстрационные данные; copart/iaai — только после подключения разрешённого API */
export type AuctionSource = "demo" | "copart" | "iaai";

/** Показания одометра по данным аукциона */
export type OdometerStatus = "actual" | "notActual" | "exempt";

export type SaleResult = "sold" | "notSold" | "onApproval";

/** Одна прошлая продажа этого VIN — только из разрешённого источника */
export type SaleRecord = {
  /** ISO-дата аукциона */
  date: string;
  source: "copart" | "iaai";
  lotId: string;
  mileageKm: number | null;
  finalBidUsd: number | null;
  result: SaleResult;
};

export type CarPhoto = {
  src: string;
  alt: string;
};

// Поля со значением null отображаются как «Brak danych»: значения не придумываются.
export type CarAuctionInfo = {
  auctionSource: AuctionSource;
  /** Номер лота; у демонстрационных — вида DEMO-0001 */
  lotId: string;
  /** Текущая ставка в USD; null — цена неизвестна */
  currentBidUsd: number | null;
  /** ISO-время последнего обновления ставки; null — не обновлялась из реального источника */
  bidUpdatedAt: string | null;
  /** ISO-дата аукциона */
  saleDate: string | null;
  /** Продавец (например, страховая компания) */
  seller: string | null;
  /** Площадка аукциона (yard) */
  yard: string | null;
  /** У демонстрационных — заведомо ненастоящий VIN, не принадлежащий ни одному автомобилю */
  vin: string | null;
  status: string | null;
  /** Документ продажи, например Salvage или Clean title */
  saleDocument: string | null;
  /** Штат, выдавший документ */
  saleDocumentState: string | null;
  primaryDamage: string | null;
  secondaryDamage: string | null;
  /** Причина ущерба: столкновение, затопление, град… */
  lossType: string | null;
  keys: boolean | null;
  runsAndDrives: boolean | null;
  engineStarts: boolean | null;
  odometerStatus: OdometerStatus | null;
  /** Оценочная рыночная стоимость по данным аукциона, USD */
  estimatedRetailUsd: number | null;
  /** Оценочная стоимость ремонта по данным аукциона, USD */
  repairCostUsd: number | null;
  /** Пустой массив — история неизвестна, раздел не показывается */
  saleHistory: SaleRecord[];
  /** Пустой массив — показываются нейтральные заглушки */
  photos: CarPhoto[];
};

export type CatalogCar = {
  slug: string;
  make: string;
  model: string;
  version: string;
  year: number;
  /** Пробег в километрах */
  mileageKm: number;
  engine: string;
  fuel: string;
  transmission: string;
  drive: string;
  body: string;
  color: string;
  /** Ориентировочная стоимость в Польше для карточки каталога, zł */
  pricePln: number;
  /** Категория для калькулятора: легковой (CN 8703) или пикап (CN 8704) */
  vehicleType: VehicleType;
  /** Тип силовой установки — для польского акциза */
  powertrain: Drive;
  /** Объём двигателя, см³; null — электромобиль или неизвестно */
  engineCc: number | null;
  location: string;
  auction: CarAuctionInfo;
};

const cars: CatalogCar[] = [
  {
    slug: "ford-mustang-gt-2019",
    make: "Ford",
    model: "Mustang",
    version: "GT 5.0 V8",
    year: 2019,
    mileageKm: 62000,
    engine: "5.0 V8",
    fuel: "benzyna",
    transmission: "automatyczna",
    drive: "tylny (RWD)",
    body: "coupé",
    color: "czarny",
    pricePln: 110000,
    vehicleType: "passenger",
    powertrain: "combustion",
    engineCc: 5038,
    location: "Floryda",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0001",
      currentBidUsd: 14200,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0001",
      status: "Na placu aukcyjnym",
      saleDocument: "Salvage",
      saleDocumentState: null,
      primaryDamage: "przód — zderzak i reflektor",
      secondaryDamage: "brak",
      lossType: null,
      runsAndDrives: true,
      keys: true,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
  {
    slug: "ford-explorer-limited-2021",
    make: "Ford",
    model: "Explorer",
    version: "Limited 4WD",
    year: 2021,
    mileageKm: 54000,
    engine: "2.3 EcoBoost",
    fuel: "benzyna",
    transmission: "automatyczna",
    drive: "4×4 (AWD)",
    body: "SUV",
    color: "grafitowy",
    pricePln: 128000,
    vehicleType: "passenger",
    powertrain: "combustion",
    engineCc: 2261,
    location: "Teksas",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0002",
      currentBidUsd: null,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0002",
      status: "Oczekuje na aukcję",
      saleDocument: "Clean title",
      saleDocumentState: null,
      primaryDamage: "drobne otarcia lakieru",
      secondaryDamage: "brak",
      lossType: null,
      runsAndDrives: true,
      keys: true,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
  {
    slug: "bmw-x5-xdrive40i-2020",
    make: "BMW",
    model: "X5",
    version: "xDrive40i",
    year: 2020,
    mileageKm: 75000,
    engine: "3.0 R6",
    fuel: "benzyna",
    transmission: "automatyczna",
    drive: "4×4 (xDrive)",
    body: "SUV",
    color: "biały",
    pricePln: 165000,
    vehicleType: "passenger",
    powertrain: "combustion",
    engineCc: 2998,
    location: "New Jersey",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0003",
      currentBidUsd: 18500,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0003",
      status: "Na placu aukcyjnym",
      saleDocument: "Salvage",
      saleDocumentState: null,
      primaryDamage: "tył — klapa bagażnika",
      secondaryDamage: "lewy tylny błotnik",
      lossType: null,
      runsAndDrives: true,
      keys: true,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
  {
    slug: "bmw-m340i-xdrive-2022",
    make: "BMW",
    model: "Seria 3",
    version: "M340i xDrive",
    year: 2022,
    mileageKm: 31000,
    engine: "3.0 R6",
    fuel: "benzyna",
    transmission: "automatyczna",
    drive: "4×4 (xDrive)",
    body: "sedan",
    color: "niebieski",
    pricePln: 189000,
    vehicleType: "passenger",
    powertrain: "combustion",
    engineCc: 2998,
    location: "Kalifornia",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0004",
      currentBidUsd: null,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0004",
      status: "Oczekuje na aukcję",
      saleDocument: "Clean title",
      saleDocumentState: null,
      primaryDamage: "prawy bok — drzwi",
      secondaryDamage: "brak",
      lossType: null,
      runsAndDrives: true,
      keys: true,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
  {
    slug: "tesla-model-3-long-range-2021",
    make: "Tesla",
    model: "Model 3",
    version: "Long Range AWD",
    year: 2021,
    mileageKm: 48000,
    engine: "dwa silniki elektryczne",
    fuel: "elektryczny",
    transmission: "automatyczna",
    drive: "4×4 (AWD)",
    body: "sedan",
    color: "srebrny",
    pricePln: 105000,
    vehicleType: "passenger",
    powertrain: "electric",
    engineCc: null,
    location: "Kalifornia",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0005",
      currentBidUsd: 9800,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0005",
      status: "Aukcja zakończona",
      saleDocument: "Salvage",
      saleDocumentState: null,
      primaryDamage: "przód — maska i zderzak",
      secondaryDamage: "szyba czołowa",
      lossType: null,
      runsAndDrives: false,
      keys: true,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
  {
    slug: "dodge-challenger-rt-2018",
    make: "Dodge",
    model: "Challenger",
    version: "R/T 5.7 HEMI",
    year: 2018,
    mileageKm: 88000,
    engine: "5.7 V8 HEMI",
    fuel: "benzyna",
    transmission: "automatyczna",
    drive: "tylny (RWD)",
    body: "coupé",
    color: "czerwony",
    pricePln: 98000,
    vehicleType: "passenger",
    powertrain: "combustion",
    engineCc: 5654,
    location: "Georgia",
    auction: {
      auctionSource: "demo",
      lotId: "DEMO-0006",
      currentBidUsd: null,
      bidUpdatedAt: null,
      saleDate: null,
      seller: null,
      yard: null,
      vin: "DEMO-VIN-0006",
      status: "Na placu aukcyjnym",
      saleDocument: "Salvage",
      saleDocumentState: null,
      primaryDamage: "lewy przód — błotnik",
      secondaryDamage: "zawieszenie (do weryfikacji)",
      lossType: null,
      runsAndDrives: true,
      keys: false,
      engineStarts: null,
      odometerStatus: null,
      estimatedRetailUsd: null,
      repairCostUsd: null,
      saleHistory: [],
      photos: [],
    },
  },
];

export async function getCars(): Promise<CatalogCar[]> {
  return cars;
}

export async function getCarBySlug(slug: string): Promise<CatalogCar | undefined> {
  return cars.find((car) => car.slug === slug);
}

export type LotPrice =
  | { status: "unavailable" }
  | { status: "demo"; usd: number }
  | { status: "auction"; usd: number; source: "copart" | "iaai"; updatedAt: string | null };

/** Цена лота для интерфейса: недоступна, демонстрационная или из аукциона */
export function getLotPrice(auction: CarAuctionInfo): LotPrice {
  if (auction.currentBidUsd === null) return { status: "unavailable" };
  if (auction.auctionSource === "demo") return { status: "demo", usd: auction.currentBidUsd };
  return {
    status: "auction",
    usd: auction.currentBidUsd,
    source: auction.auctionSource,
    updatedAt: auction.bidUpdatedAt,
  };
}

/** Дата обновления ставки — с фиксированным часовым поясом, одинаково на сервере и в браузере */
export function formatBidTime(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
}

/** Дата аукциона без времени */
export function formatSaleDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
}

export const carHref = (car: Pick<CatalogCar, "slug">) => `/katalog/${car.slug}`;

/** Форматирование чисел с неразрывным пробелом — одинаково на сервере и в браузере. */
export function formatNumber(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
