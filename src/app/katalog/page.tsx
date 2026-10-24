import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCars } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Katalog aut z USA — USA AUTO IMPORT",
  description:
    "Przykładowe samochody z amerykańskich aukcji z orientacyjnym kosztem sprowadzenia do Polski.",
};

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

export default async function CatalogPage() {
  const cars = await getCars();

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
        <section
          id="top"
          aria-labelledby="katalog-title"
          className="relative isolate overflow-hidden border-b border-line pt-36 pb-16 sm:pt-44 sm:pb-20"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#1d1d20_0%,#151517_60%,#0a0a0b_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_70%_at_85%_10%,rgba(201,169,97,0.10),transparent_70%)]"
          />

          <div className={container}>
            <p className="animate-fade-up flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">
              <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
              Katalog
            </p>
            <h1
              id="katalog-title"
              className="animate-fade-up mt-6 max-w-3xl font-display text-5xl leading-[1.02] font-medium [animation-delay:150ms] sm:text-6xl lg:text-7xl"
            >
              Samochody <span className="text-[#d9cdb6]">z USA</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-2xl text-base leading-7 text-white/70 [animation-delay:300ms] sm:text-lg sm:leading-8">
              Wybrane przykłady aut, które można sprowadzić z amerykańskich aukcji,
              wraz z orientacyjnym kosztem w Polsce. Skorzystaj z filtrów, aby
              zawęzić wyniki.
            </p>
            <p className="animate-fade-up mt-8 inline-flex border border-gold/30 bg-gold/5 px-4 py-2 text-xs leading-5 text-gold-light [animation-delay:450ms]">
              Wszystkie pozycje to przykładowe oferty — nie są to aktualne loty z aukcji
              i nie stanowią oferty sprzedaży.
            </p>
          </div>
        </section>

        <section aria-label="Lista samochodów" className="py-16 sm:py-20">
          <div className={container}>
            <CatalogBrowser cars={cars} />

            <p className="mt-12 text-sm text-mist">
              * Wartości mają charakter orientacyjny. Rzeczywisty koszt zależy od
              ceny na aukcji, kursu walut, stanu pojazdu i opłat w danym momencie.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
