import type { Metadata } from "next";
import Link from "next/link";
import { ImportCalculator } from "@/components/ImportCalculator";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMISSION_EUR } from "@/lib/import-costs";

export const metadata: Metadata = {
  title: "Kalkulator kosztów importu auta z USA — USA AUTO IMPORT",
  description:
    "Orientacyjny koszt importu samochodu z USA przez Kłajpedę bezpośrednio na klienta: cło i VAT w Litwie, akcyza w Polsce, transport i prowizja.",
};

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

const route = [
  { title: "USA", text: "Zakup na aukcji i transport do portu" },
  { title: "Kłajpeda, Litwa", text: "Przypłynięcie i rozładunek w porcie" },
  { title: "Odprawa w Litwie", text: "Cło i VAT importowy — na klienta" },
  { title: "Polska", text: "Transport, akcyza i rejestracja" },
];

const taxRules = [
  {
    title: "Wartość celna",
    text: "Cena zakupu wraz z opłatami aukcyjnymi oraz koszty transportu i ubezpieczenia do miejsca wprowadzenia do UE (Kłajpeda).",
  },
  {
    title: "Cło w Litwie",
    text: "Procent od wartości celnej. Standardowo 10% dla samochodów osobowych (CN 8703) i 22% dla większości pickupów (CN 8704). Dla pojazdów pochodzenia amerykańskiego od 1 lipca 2026 r. może mieć zastosowanie stawka 0% (rozporządzenie UE 2026/1455) — pod warunkiem udokumentowania pochodzenia.",
  },
  {
    title: "VAT importowy w Litwie",
    text: "21% od podstawy obejmującej wartość celną, cło oraz koszty dodatkowe do pierwszego miejsca przeznaczenia — obsługę portową i celną, a także transport do Polski, jeśli miejsce przeznaczenia jest znane w chwili odprawy.",
  },
  {
    title: "Bez ponownego cła i VAT w Polsce",
    text: "Po dopuszczeniu do obrotu w Litwie samochód jest towarem unijnym. W Polsce nie nalicza się ponownie cła ani VAT importowego.",
  },
  {
    title: "Akcyza w Polsce",
    text: "Dotyczy tylko samochodów osobowych (CN 8703). Podstawą jest kwota zapłacona za nabycie auta bez VAT — w kalkulacji: wartość celna i cło. Stawki: 3,1% do 2000 cm³, 18,6% powyżej; hybrydy 1,55% do 2000 cm³ i 9,3% do 3500 cm³; PHEV do 2000 cm³ oraz auta elektryczne — zwolnione.",
  },
  {
    title: `Prowizja ${COMMISSION_EUR} EUR`,
    text: "Wynagrodzenie USA AUTO IMPORT pokazujemy osobną pozycją. Kalkulator nie dolicza jej do podstaw podatkowych.",
  },
];

const toConfirm = [
  "Klasyfikacja taryfowa (kod CN) i stawka cła — w tym możliwość zastosowania 0% dla pojazdów pochodzenia z USA oraz wymagane dowody pochodzenia.",
  "Faktyczne opłaty aukcyjne, stawki transportu w USA, frachtu morskiego, obsługi w porcie i lawety — według aktualnych ofert.",
  "Kursy walut przyjęte przez urząd celny w Litwie i przez polski urząd skarbowy.",
  "Zakres kosztów wliczanych do podstawy VAT importowego i podstawy akcyzy — urząd może zweryfikować podstawę akcyzy względem wartości rynkowej.",
  "Stawka akcyzy dla hybryd, w tym mild hybrid, oraz warunki zwolnienia dla PHEV.",
  "Status pojazdu nowego w rozumieniu VAT (do 6 miesięcy lub 6000 km) — wymaga osobnej analizy.",
  "Opłaty w Polsce: opłata recyklingowa, badanie techniczne, tłumaczenia i rejestracja.",
];

export default function CalculatorPage() {
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
          aria-labelledby="kalkulator-title"
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
              Kalkulator
            </p>
            <h1
              id="kalkulator-title"
              className="animate-fade-up mt-6 max-w-4xl font-display text-5xl leading-[1.02] font-medium [animation-delay:150ms] sm:text-6xl lg:text-7xl"
            >
              Import samochodu <span className="text-[#d9cdb6]">bezpośrednio na klienta</span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-2xl text-base leading-7 text-white/70 [animation-delay:300ms] sm:text-lg sm:leading-8">
              Samochód kupiony na aukcji w USA płynie do Kłajpedy, gdzie przechodzi odprawę
              celną na Twoje dane — to Ty jesteś importerem. Następnie przewozimy go do Polski.
              My organizujemy cały proces, a Ty widzisz każdy koszt osobno.
            </p>
            <p className="animate-fade-up mt-8 max-w-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-5 text-gold-light [animation-delay:450ms]">
              Odprawa na klienta nie oznacza automatycznie niższych podatków. Ostateczne skutki
              podatkowe zależą od dokumentów i faktycznego przebiegu transakcji.
            </p>

            <ol className="animate-fade-up mt-14 grid gap-px overflow-hidden border border-line bg-line [animation-delay:600ms] sm:grid-cols-2 lg:grid-cols-4">
              {route.map((step, index) => (
                <li key={step.title} className="bg-graphite-900 p-6">
                  <span className="font-display text-3xl text-gold" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-4 font-medium">
                    <span className="sr-only">Etap {index + 1}: </span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-mist">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-label="Kalkulator kosztów" className="py-16 sm:py-20">
          <div className={container}>
            <ImportCalculator />
          </div>
        </section>

        <section
          aria-labelledby="zasady-title"
          className="border-t border-line bg-graphite-900 py-20 sm:py-28"
        >
          <div className={container}>
            <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">
              <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
              Zasady
            </p>
            <h2
              id="zasady-title"
              className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] font-medium sm:text-5xl"
            >
              Jak liczymy podatki
            </h2>

            <ul className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {taxRules.map((rule) => (
                <li key={rule.title} className="bg-graphite-900 p-7 sm:p-8">
                  <h3 className="font-display text-2xl font-medium">{rule.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-mist">{rule.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
              <h3 className="font-display text-3xl font-medium sm:text-4xl">
                Do indywidualnego potwierdzenia
              </h3>
              <ul className="grid gap-4">
                {toConfirm.map((item) => (
                  <li key={item} className="flex items-start gap-4 leading-7 text-white/80">
                    <span aria-hidden="true" className="mt-3.5 h-px w-4 shrink-0 bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-16 text-sm text-mist">
              Potrzebujesz indywidualnej kalkulacji?{" "}
              <Link href="/kontakt" className="text-gold transition-colors hover:text-gold-light">
                Napisz do nas →
              </Link>
            </p>
            <p className="mt-3 text-sm text-mist">
              Szukasz inspiracji?{" "}
              <Link href="/katalog" className="text-gold transition-colors hover:text-gold-light">
                Zobacz przykładowe auta w katalogu →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
