import type { ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { LotGallery } from "@/components/LotGallery";
import {
  formatBidTime,
  formatNumber,
  formatSaleDate,
  type AuctionSource,
  type CatalogCar,
  type LotPrice,
  type OdometerStatus,
  type SaleResult,
} from "@/lib/catalog";

const sourceLabels: Record<AuctionSource, string> = {
  demo: "Przykład — bez połączenia z aukcją",
  copart: "Copart",
  iaai: "IAAI",
};

const odometerLabels: Record<OdometerStatus, string> = {
  actual: "rzeczywisty",
  notActual: "nierzeczywisty",
  exempt: "zwolniony z odczytu",
};

const resultLabels: Record<SaleResult, string> = {
  sold: "sprzedany",
  notSold: "niesprzedany",
  onApproval: "do akceptacji sprzedawcy",
};

/** Строка характеристик: null — данных нет, показывается «Brak danych» */
type InfoRow = [label: string, value: ReactNode | null];

const yesNo = (value: boolean | null) => (value === null ? null : value ? "tak" : "nie");
const usd = (value: number | null) => (value === null ? null : `${formatNumber(value)} USD`);

const noData = <span className="text-white/40">Brak danych</span>;

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <dt className="text-[10px] uppercase tracking-[0.22em] text-mist">{label}</dt>
      <dd className="min-w-0 text-sm text-white/90">{children}</dd>
    </div>
  );
}

/**
 * Панель под названием: выделенный VIN с копированием, аукцион, лот, статус и дата торгов.
 * Демонстрационный источник не выдаётся за Copart/IAAI, а его статус — за актуальные торги.
 */
export function LotMeta({ car }: { car: CatalogCar }) {
  const { auction } = car;
  const demo = auction.auctionSource === "demo";

  return (
    <dl className="flex flex-wrap items-stretch gap-2">
      <div className="flex w-full min-w-0 flex-col gap-1.5 rounded-md border border-gold/40 bg-gold/[0.06] py-2 pr-2 pl-3.5 shadow-[inset_0_1px_0_rgba(226,200,143,0.14),0_10px_28px_-18px_rgba(201,169,97,0.55)] sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:py-1.5 sm:pr-1.5">
        <dt className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
          VIN
          {demo && auction.vin && (
            <span className="tracking-[0.18em] text-gold-light/70">· przykład</span>
          )}
        </dt>
        <dd className="flex min-w-0 items-center gap-3">
          {auction.vin ? (
            <>
              <span className="min-w-0 flex-1 font-mono text-[15px] tracking-[0.08em] break-all text-white">
                {auction.vin}
              </span>
              <CopyButton value={auction.vin} label="Kopiuj numer VIN" />
            </>
          ) : (
            noData
          )}
        </dd>
      </div>

      <MetaItem label="Aukcja">
        {demo ? (
          noData
        ) : (
          <span className="font-medium uppercase tracking-[0.18em] text-gold-light">
            {sourceLabels[auction.auctionSource]}
          </span>
        )}
      </MetaItem>
      <MetaItem label="Lot">{auction.lotId}</MetaItem>
      <MetaItem label="Status">
        {auction.status ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
              demo ? "border-white/15 text-white/70" : "border-gold/40 text-gold-light"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${demo ? "bg-white/35" : "bg-gold"}`}
            />
            {auction.status}
            {demo && <span className="text-white/45">· przykład</span>}
          </span>
        ) : (
          noData
        )}
      </MetaItem>
      <MetaItem label="Data aukcji">
        {auction.saleDate ? formatSaleDate(auction.saleDate) : noData}
      </MetaItem>
    </dl>
  );
}

/** Блоки лота: галерея с ценой и характеристики, затем состояние и аукцион, затем история */
export function LotDetails({ car, lotPrice }: { car: CatalogCar; lotPrice: LotPrice }) {
  const { auction } = car;
  const demo = auction.auctionSource === "demo";

  const specs: InfoRow[] = [
    ["Rok produkcji", String(car.year)],
    ["Przebieg", `${formatNumber(car.mileageKm)} km`],
    ["Silnik", car.engine],
    [
      "Pojemność",
      car.powertrain === "electric"
        ? "nie dotyczy"
        : car.engineCc && `${formatNumber(car.engineCc)} cm³`,
    ],
    ["Paliwo", car.fuel],
    ["Skrzynia biegów", car.transmission],
    ["Napęd", car.drive],
    ["Nadwozie", car.body],
    ["Kolor", car.color],
  ];

  const condition: InfoRow[] = [
    ["Uszkodzenie główne", auction.primaryDamage],
    ["Uszkodzenie dodatkowe", auction.secondaryDamage],
    ["Przyczyna szkody", auction.lossType],
    ["Kluczyki", yesNo(auction.keys)],
    ["Run & Drive", yesNo(auction.runsAndDrives)],
    ["Silnik uruchamia się", yesNo(auction.engineStarts)],
    [
      "Dokument sprzedaży",
      auction.saleDocument &&
        `${auction.saleDocument}${auction.saleDocumentState ? ` (${auction.saleDocumentState})` : ""}`,
    ],
    ["Stan licznika", auction.odometerStatus && odometerLabels[auction.odometerStatus]],
    ["Szacowana wartość", usd(auction.estimatedRetailUsd)],
    ["Szacowany koszt naprawy", usd(auction.repairCostUsd)],
  ];

  const auctionRows: InfoRow[] = [
    ["Aukcja", sourceLabels[auction.auctionSource]],
    ["Numer lotu", auction.lotId],
    ["Lokalizacja", `${car.location}, USA`],
    ["Plac aukcyjny", auction.yard],
    ["Sprzedawca", auction.seller],
    ["Data aukcji", auction.saleDate && formatSaleDate(auction.saleDate)],
    ["Status", auction.status],
  ];

  return (
    <div className="grid min-w-0 gap-6 sm:gap-8">
      {/* Ряд 1: крупная галерея с ценой и метками | компактные характеристики */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:gap-8">
        <div className="grid min-w-0 content-start gap-4">
          <LotGallery photos={auction.photos} title={`${car.make} ${car.model} ${car.year}`} />
          <LotPriceBox lotPrice={lotPrice} updatedAt={auction.bidUpdatedAt} />
          <StatusBadges car={car} />
        </div>
        <InfoCard
          id="lot-specs"
          title="Dane techniczne"
          demo={demo}
          rows={specs}
          listClassName="sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1"
          accent
        />
      </div>

      {/* Ряд 2: состояние | аукцион */}
      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        <InfoCard id="lot-condition" title="Stan pojazdu" demo={demo} rows={condition} />
        <InfoCard id="lot-auction" title="Informacje o aukcji" demo={demo} rows={auctionRows} />
      </div>

      {auction.saleHistory.length > 0 && <SaleHistory car={car} />}

      <p className="text-xs leading-5 text-mist">
        {demo &&
          "Dane oznaczone jako przykładowe służą wyłącznie celom poglądowym — nie dotyczą rzeczywistego pojazdu ani lotu z aukcji Copart lub IAAI, a podany VIN nie należy do żadnego samochodu. "}
        Przed zakupem każde auto weryfikujemy na podstawie historii VIN i zdjęć z aukcji.
      </p>
    </div>
  );
}

function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 border border-gold/30 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-gold-light">
      Dane przykładowe
    </span>
  );
}

function InfoCard({
  id,
  title,
  demo,
  rows,
  listClassName = "",
  accent = false,
}: {
  id: string;
  title: string;
  demo: boolean;
  rows: InfoRow[];
  listClassName?: string;
  /** Карточка в первом ряду: скругление, золотая линия сверху и мягкая тень, как у галереи и шапки */
  accent?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`min-w-0 border bg-graphite-900 px-5 pt-4 pb-2 sm:px-6 sm:pt-5 ${
        accent
          ? "relative h-fit rounded-md border-white/10 bg-[linear-gradient(to_bottom,#17171a,#111113)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_48px_-30px_rgba(0,0,0,0.9)] before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gold/50 before:to-transparent"
          : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h2
          id={id}
          className={`font-display font-medium ${accent ? "text-[1.7rem] leading-tight text-[#f4f1ea]" : "text-2xl"}`}
        >
          {title}
        </h2>
        {demo && <DemoBadge />}
      </div>
      <dl className={`grid ${listClassName}`}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className={`flex min-w-0 items-baseline justify-between gap-4 border-b border-line/60 last:border-b-0 ${
              accent ? "py-2" : "py-2.5"
            }`}
          >
            <dt className="shrink-0 text-xs text-mist">{label}</dt>
            <dd className="min-w-0 break-words text-right text-sm text-white">
              {value ?? <span className="text-white/35">Brak danych</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Цена лота — единственное место на странице, где она показана отдельным блоком */
function LotPriceBox({ lotPrice, updatedAt }: { lotPrice: LotPrice; updatedAt: string | null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border border-line bg-graphite-900 px-5 py-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-mist">Aktualna oferta</p>
        <p className="mt-1.5 font-display text-3xl leading-none text-gold-light">
          {lotPrice.status === "unavailable"
            ? "Cena niedostępna"
            : `${formatNumber(lotPrice.usd)} USD`}
        </p>
      </div>
      <div className="flex flex-col items-start gap-1.5 text-xs text-mist sm:items-end">
        {lotPrice.status === "demo" && (
          <span className="border border-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold-light">
            Cena przykładowa
          </span>
        )}
        {lotPrice.status === "auction" && <span>{sourceLabels[lotPrice.source]}</span>}
        <span>Aktualizacja: {updatedAt ? formatBidTime(updatedAt) : "brak danych"}</span>
      </div>
    </div>
  );
}

type Tone = "good" | "warn" | "bad" | "unknown";

const toneClasses: Record<Tone, string> = {
  good: "border-emerald-300/25 bg-emerald-300/[0.04] text-emerald-100",
  warn: "border-gold/35 bg-gold/[0.05] text-gold-light",
  bad: "border-red-300/30 bg-red-300/[0.04] text-red-200",
  unknown: "border-line text-mist",
};

const icons: Record<"key" | "drive" | "damage" | "document", ReactNode> = {
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M17 6l3 3M15 8l2 2" />
    </>
  ),
  drive: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  damage: <path d="M12 4 3 20h18L12 4zM12 10v4M12 17v.5" />,
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M10 13h5M10 17h5" />
    </>
  ),
};

/** Компактные метки — краткая визуальная сводка; подробности в карточке «Stan pojazdu» */
function StatusBadges({ car }: { car: CatalogCar }) {
  const { auction } = car;

  const document = auction.saleDocument;
  const badges: { icon: keyof typeof icons; tone: Tone; text: string }[] = [
    {
      icon: "key",
      tone: auction.keys === null ? "unknown" : auction.keys ? "good" : "bad",
      text:
        auction.keys === null
          ? "Kluczyki: brak danych"
          : auction.keys
            ? "Kluczyki"
            : "Brak kluczyków",
    },
    {
      icon: "drive",
      tone: auction.runsAndDrives === null ? "unknown" : auction.runsAndDrives ? "good" : "bad",
      text:
        auction.runsAndDrives === null
          ? "Run & Drive: brak danych"
          : auction.runsAndDrives
            ? "Run & Drive"
            : "Nie jeździ",
    },
    {
      icon: "damage",
      tone: auction.primaryDamage ? "warn" : "unknown",
      text: auction.primaryDamage ?? "Uszkodzenia: brak danych",
    },
    {
      icon: "document",
      tone: !document ? "unknown" : /clean/i.test(document) ? "good" : "warn",
      text: document ?? "Dokument: brak danych",
    },
  ];

  return (
    <ul aria-label="Najważniejsze informacje o stanie" className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li
          key={badge.icon}
          className={`inline-flex max-w-full items-center gap-2 border px-2.5 py-1 text-xs ${toneClasses[badge.tone]}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0 fill-none stroke-current stroke-[1.5]"
            aria-hidden="true"
          >
            {icons[badge.icon]}
          </svg>
          <span className="min-w-0 break-words">{badge.text}</span>
        </li>
      ))}
    </ul>
  );
}

function SaleHistory({ car }: { car: CatalogCar }) {
  const records = car.auction.saleHistory;

  return (
    <section
      aria-labelledby="lot-history"
      className="min-w-0 border border-line bg-graphite-900 px-5 pt-4 pb-2 sm:px-6 sm:pt-5"
    >
      <h2 id="lot-history" className="border-b border-line pb-3 font-display text-2xl font-medium">
        Historia sprzedaży
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-mist">
              <th scope="col" className="py-2.5 pr-4 font-medium">Data</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Aukcja</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Lot</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Przebieg</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Cena końcowa</th>
              <th scope="col" className="py-2.5 font-medium">Wynik</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={`${record.source}-${record.lotId}-${record.date}`}
                className="border-t border-line/60"
              >
                <td className="py-2.5 pr-4">{formatSaleDate(record.date)}</td>
                <td className="py-2.5 pr-4">{sourceLabels[record.source]}</td>
                <td className="py-2.5 pr-4">{record.lotId}</td>
                <td className="py-2.5 pr-4">
                  {record.mileageKm === null
                    ? "Brak danych"
                    : `${formatNumber(record.mileageKm)} km`}
                </td>
                <td className="py-2.5 pr-4">{usd(record.finalBidUsd) ?? "Brak danych"}</td>
                <td className="py-2.5">{resultLabels[record.result]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
