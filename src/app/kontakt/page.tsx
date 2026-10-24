import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCarBySlug } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Kontakt — zapytaj o samochód z USA — USA AUTO IMPORT",
  description:
    "Zapytaj o import samochodu z USA do Polski. Opisz auto i budżet — przygotujemy indywidualną propozycję.",
};

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

const nextSteps = [
  "Analizujemy Twoje oczekiwania i budżet.",
  "Wyszukujemy pasujące auta na aukcjach w USA.",
  "Przygotowujemy indywidualną kalkulację kosztów.",
];

export default function ContactPage({ searchParams }: PageProps<"/kontakt">) {
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
          aria-labelledby="kontakt-title"
          className="relative isolate overflow-hidden pt-36 pb-20 sm:pt-44 sm:pb-28"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#1d1d20_0%,#151517_45%,#0a0a0b_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_85%_8%,rgba(201,169,97,0.10),transparent_70%)]"
          />

          <div
            className={`${container} grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20`}
          >
            <div>
              <p className="animate-fade-up flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">
                <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
                Kontakt
              </p>
              <h1
                id="kontakt-title"
                className="animate-fade-up mt-6 font-display text-5xl leading-[1.02] font-medium [animation-delay:150ms] sm:text-6xl lg:text-7xl"
              >
                Zapytaj <span className="text-[#d9cdb6]">o samochód</span>
              </h1>
              <p className="animate-fade-up mt-6 max-w-md text-base leading-7 text-white/70 [animation-delay:300ms] sm:text-lg sm:leading-8">
                Opisz, jakiego auta szukasz i jaki masz budżet. Na tej podstawie
                przygotujemy propozycję i orientacyjny koszt importu do Polski.
              </p>

              <ol className="animate-fade-up mt-12 grid gap-6 border-t border-line pt-8 [animation-delay:450ms]">
                {nextSteps.map((step, index) => (
                  <li key={step} className="flex items-baseline gap-5">
                    <span className="font-display text-2xl text-gold" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-7 text-white/80">{step}</span>
                  </li>
                ))}
              </ol>

              <p className="animate-fade-up mt-12 text-sm leading-6 text-mist [animation-delay:600ms]">
                Chcesz najpierw policzyć koszty?{" "}
                <Link href="/kalkulator" className="text-gold transition-colors hover:text-gold-light">
                  Otwórz kalkulator →
                </Link>
              </p>
            </div>

            <div className="animate-fade-up border border-line bg-graphite-900 p-6 [animation-delay:300ms] sm:p-10">
              {/* Выбранный автомобиль приходит из ?samochod=<slug> — это данные запроса */}
              <Suspense fallback={<FormPlaceholder />}>
                <PrefilledForm searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

async function PrefilledForm({ searchParams }: Pick<PageProps<"/kontakt">, "searchParams">) {
  const { samochod } = await searchParams;
  const slug = typeof samochod === "string" ? samochod : undefined;
  const car = slug ? await getCarBySlug(slug) : undefined;

  if (!car) return <ContactForm />;

  return (
    <ContactForm initialCar={`${car.make} ${car.model} ${car.version}, ${car.year}`} fromCatalog />
  );
}

function FormPlaceholder() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-7">
      <div className="h-14 bg-graphite-800" />
      <div className="h-20 bg-graphite-800" />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-20 bg-graphite-800" />
        <div className="h-20 bg-graphite-800" />
      </div>
      <div className="h-40 bg-graphite-800" />
    </div>
  );
}
