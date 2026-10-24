import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ImportCalculator } from "@/components/ImportCalculator";
import { LotDetails, LotMeta } from "@/components/LotDetails";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCarBySlug,
  getCars,
  getLotPrice,
  type CatalogCar,
  type LotPrice,
} from "@/lib/catalog";
import { contactHref } from "@/lib/contact";

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

const buttonPrimary =
  "group inline-flex items-center justify-center gap-4 bg-[linear-gradient(135deg,#d4b47a,#b8955a)] px-8 py-4 text-sm font-medium tracking-[0.06em] text-ink transition-[filter] duration-500 ease-luxe hover:brightness-110";

// Кнопки шапки лота: ниже и легче основных, со скруглением как у панели VIN
const headerPrimary =
  "group inline-flex items-center justify-center gap-3 rounded-md bg-[linear-gradient(135deg,#d4b47a,#b8955a)] px-6 py-3 text-sm font-medium tracking-[0.04em] text-ink shadow-[0_10px_28px_-14px_rgba(201,169,97,0.75)] transition-[filter,box-shadow] duration-300 ease-luxe hover:brightness-105 hover:shadow-[0_14px_32px_-12px_rgba(201,169,97,0.9)]";

const headerSecondary =
  "inline-flex items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-medium tracking-[0.04em] text-white/90 transition-colors duration-300 ease-luxe hover:border-gold/60 hover:text-gold-light";

const eyebrow = "text-[11px] font-medium uppercase tracking-[0.3em] text-gold";

const importRoute = ["USA", "Kłajpeda — odprawa w Litwie", "Polska"];

export async function generateStaticParams() {
  const cars = await getCars();
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/katalog/[slug]">): Promise<Metadata> {
  const car = await getCarBySlug((await params).slug);
  if (!car) return { title: "Nie znaleziono — USA AUTO IMPORT" };

  return {
    title: `${car.make} ${car.model} ${car.year} — przykładowa oferta — USA AUTO IMPORT`,
    description: `Przykładowa oferta: ${car.make} ${car.model} ${car.version} (${car.year}) z USA z orientacyjnym kosztem sprowadzenia do Polski.`,
  };
}

export default async function CarPage({ params }: PageProps<"/katalog/[slug]">) {
  const car = await getCarBySlug((await params).slug);
  if (!car) notFound();

  const name = `${car.make} ${car.model} ${car.version}`;
  const lotPrice = getLotPrice(car.auction);

  return (
    <>
      <a
        href="#tresc"
        className="sr-only z-[60] rounded-full bg-gold px-5 py-3 text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Przejdź do treści
      </a>

      <SiteHeader />

      <main id="tresc" className="flex-1">
        {/* Заголовок: графитовый градиент, мягкое золотое свечение справа сверху, золотая линия снизу */}
        <section
          id="top"
          aria-labelledby="car-title"
          className="relative isolate overflow-hidden pt-24 pb-8 sm:pt-28 sm:pb-10"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,#1c1c1f_0%,#141416_55%,#0d0d0e_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_45%_85%_at_100%_0%,rgba(201,169,97,0.11),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 shadow-[inset_0_-56px_64px_-48px_rgba(0,0,0,0.75)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent"
          />

          <div className={container}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Ścieżka nawigacji" className="text-[11px] tracking-[0.04em] text-mist">
                <ol className="flex flex-wrap items-center gap-1.5">
                  <li>
                    <Link href="/" className="transition-colors hover:text-gold-light">
                      Strona główna
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-white/25">
                    /
                  </li>
                  <li>
                    <Link href="/katalog" className="transition-colors hover:text-gold-light">
                      Katalog
                    </Link>
                  </li>
                  <li aria-hidden="true" className="text-white/25">
                    /
                  </li>
                  <li aria-current="page" className="text-white/75">
                    {car.make} {car.model}
                  </li>
                </ol>
              </nav>
              <p className="inline-flex border border-gold/40 bg-ink/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold-light">
                Przykładowa oferta
              </p>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
              <div className="min-w-0">
                <h1
                  id="car-title"
                  className="font-display text-[2.75rem] leading-[0.95] font-medium break-words text-[#f4f1ea] [text-shadow:0_2px_28px_rgba(0,0,0,0.6),0_1px_0_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl"
                >
                  {car.make} {car.model}{" "}
                  <span className="text-gold-light/90">{car.year}</span>
                </h1>
                <p className="mt-2 text-base text-white/60 sm:text-lg">{car.version}</p>
              </div>

              <div className="grid gap-2.5 sm:flex sm:flex-wrap">
                <Link href={contactHref(car.slug)} className={headerPrimary}>
                  Zapytaj o samochód
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-luxe group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
                <Link href="/katalog" className={headerSecondary}>
                  Wróć do katalogu
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <LotMeta car={car} />
            </div>
          </div>
        </section>

        {/* Сверху — данные лота в двух рядах, ниже — калькулятор на всю ширину */}
        <div className={`${container} grid gap-12 py-10 sm:gap-14 sm:py-14`}>
          <LotDetails car={car} lotPrice={lotPrice} />

          <CalculatorPanel car={car} lotPrice={lotPrice} />
        </div>

        {/* Заявка — форма на странице /kontakt, автомобиль передаётся в ссылке */}
        <section
          id="zapytanie"
          aria-labelledby="zapytanie-title"
          className="border-t border-line bg-graphite-900 py-20 sm:py-28"
        >
          <div className={`${container} grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-20`}>
            <div>
              <p className={eyebrow}>Zapytanie</p>
              <h2
                id="zapytanie-title"
                className="mt-6 font-display text-4xl leading-[1.05] font-medium sm:text-5xl"
              >
                Zapytaj o samochód
              </h2>
              <p className="mt-6 max-w-xl leading-7 text-mist">
                Interesuje Cię {name} lub podobne auto? Zostaw kontakt — pomożemy znaleźć
                aktualne oferty na aukcjach w USA i przygotujemy indywidualną kalkulację.
              </p>
            </div>
            <Link href={contactHref(car.slug)} className={buttonPrimary}>
              Zapytaj o samochód
              <span
                aria-hidden="true"
                className="transition-transform duration-500 ease-luxe group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function SectionTitle({ id, kicker, children }: { id: string; kicker: string; children: ReactNode }) {
  return (
    <div>
      <p className={eyebrow}>{kicker}</p>
      <h2 id={id} className="mt-4 font-display text-3xl font-medium sm:text-4xl">
        {children}
      </h2>
    </div>
  );
}

function CalculatorPanel({ car, lotPrice }: { car: CatalogCar; lotPrice: LotPrice }) {
  return (
    <section aria-labelledby="calc-title" className="min-w-0 border-t border-line pt-10 sm:pt-12">
      <SectionTitle id="calc-title" kicker="Kalkulator importu">
        Koszt sprowadzenia do Polski
      </SectionTitle>

      <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/80">
        {importRoute.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            {index > 0 && (
              <span aria-hidden="true" className="text-gold">
                →
              </span>
            )}
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-mist">
        Import bezpośrednio na klienta. Dane pojazdu są już uzupełnione — wpisz stawki
        przewoźników i aktualne kursy walut.{" "}
        <Link href="/kalkulator" className="text-gold transition-colors hover:text-gold-light">
          Jak liczymy podatki →
        </Link>
      </p>

      <div className="mt-8">
        <ImportCalculator
          layout="embedded"
          lotPrice={lotPrice}
          auction={car.auction.auctionSource === "demo" ? null : car.auction.auctionSource}
          vehicle={{
            vehicleType: car.vehicleType,
            powertrain: car.powertrain,
            engineCc: car.engineCc,
          }}
        />
      </div>
    </section>
  );
}
