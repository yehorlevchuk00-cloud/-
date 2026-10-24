import Link from "next/link";
import type { ReactNode } from "react";
import { CarPhotoSlot } from "@/components/CarPhotoSlot";
import { HeroBackdrop, HeroCarSlot, type HeroPhoto } from "@/components/HeroStage";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

const buttonPrimary =
  "inline-flex items-center justify-center gap-3 rounded-full bg-gold px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors duration-500 ease-luxe hover:bg-gold-light";

// Прямоугольные кнопки главного экрана (по утверждённому макету)
const heroButtonPrimary =
  "group inline-flex items-center justify-center gap-4 bg-[linear-gradient(135deg,#d4b47a,#b8955a)] px-8 py-4 text-sm font-medium tracking-[0.06em] text-ink transition-[filter] duration-500 ease-luxe hover:brightness-110";

const heroButtonSecondary =
  "inline-flex items-center justify-center gap-4 border border-white/40 px-8 py-4 text-sm font-medium tracking-[0.06em] text-white transition-colors duration-500 ease-luxe hover:border-gold hover:text-gold-light";

/**
 * Фотография hero без надписей. width/height — реальные размеры файлов в пикселях.
 * Мобильная версия — обрезка того же снимка плотнее вокруг автомобиля.
 * Если убрать фото (undefined), вместо него покажется нейтральная заглушка.
 */
const heroPhoto: HeroPhoto | undefined = {
  src: "/porsche-hero.png",
  width: 1672,
  height: 941,
  alt: "Czarne sportowe coupé z dużym tylnym spojlerem w studiu, widok z boku",
  mobile: { src: "/hero/porsche-hero-mobile.png", width: 1540, height: 561 },
};

const heroServices: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Wyszukiwanie",
    text: "Pomoc w wyborze auta na aukcjach w USA",
    icon: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </>
    ),
  },
  {
    title: "Transport i odprawa",
    text: "Organizacja transportu i odprawy celnej",
    icon: (
      <>
        <path d="M3 17h18" />
        <path d="M5 17V9h9l4 4v4" />
        <path d="M14 9v4h4" />
      </>
    ),
  },
  {
    title: "Rejestracja w Polsce",
    text: "Pomoc w formalnościach rejestracyjnych",
    icon: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4M10 13h5M10 17h5" />
      </>
    ),
  },
];

function HeroServices() {
  return (
    <ul className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:gap-8">
      {heroServices.map((service) => (
        <li key={service.title} className="flex items-start gap-4">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-6 w-6 shrink-0 fill-none stroke-gold stroke-[1.25]"
            aria-hidden="true"
          >
            {service.icon}
          </svg>
          <div>
            <p className="text-sm font-medium tracking-[0.04em] text-white">{service.title}</p>
            <p className="mt-1 text-sm leading-6 text-white/60">{service.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const advantages: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Przejrzyste koszty",
    text: "Przed zakupem pokazujemy, z czego składa się cena: aukcja, transport, cło, akcyza, VAT i opłaty w Polsce.",
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    title: "Sprawdzenie pojazdu",
    text: "Analizujemy historię auta po numerze VIN, zdjęcia z aukcji i opis uszkodzeń, zanim podejmiesz decyzję.",
    icon: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </>
    ),
  },
  {
    title: "Logistyka od A do Z",
    text: "Organizujemy odbiór z placu aukcyjnego, transport do portu i przewóz morski do Europy.",
    icon: (
      <>
        <path d="M3 17h18" />
        <path d="M5 17V9h9l4 4v4" />
        <path d="M14 9v4h4" />
      </>
    ),
  },
  {
    title: "Formalności w Polsce",
    text: "Pomagamy przejść przez odprawę celną, badanie techniczne i przygotowanie dokumentów do rejestracji.",
    icon: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4M10 13h5M10 17h5" />
      </>
    ),
  },
];

const steps = [
  {
    title: "Wybór samochodu",
    text: "Określamy budżet i oczekiwania, a następnie szukamy aut na aukcjach w USA.",
  },
  {
    title: "Licytacja i zakup",
    text: "Po Twojej akceptacji licytujemy pojazd i opłacamy zakup.",
  },
  {
    title: "Transport do Europy",
    text: "Auto trafia do portu w USA, a następnie drogą morską do Europy.",
  },
  {
    title: "Odprawa celna",
    text: "Rozliczamy cło, akcyzę i VAT oraz odbieramy samochód z portu.",
  },
  {
    title: "Odbiór w Polsce",
    text: "Przekazujemy auto wraz z dokumentami potrzebnymi do rejestracji.",
  },
];

// Демонстрационные данные — не реальные предложения.
const sampleCars: {
  name: string;
  year: number;
  mileage: string;
  engine: string;
  price: string;
}[] = [
  {
    name: "Ford Mustang GT",
    year: 2019,
    mileage: "ok. 62 000 km",
    engine: "5.0 V8, benzyna",
    price: "ok. 110 000 zł",
  },
  {
    name: "BMW X5 xDrive40i",
    year: 2020,
    mileage: "ok. 75 000 km",
    engine: "3.0 R6, benzyna",
    price: "ok. 165 000 zł",
  },
  {
    name: "Tesla Model 3 Long Range",
    year: 2021,
    mileage: "ok. 48 000 km",
    engine: "elektryczny",
    price: "ok. 105 000 zł",
  },
];

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: ReactNode;
  text?: string;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">
        <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-6 font-display text-4xl leading-[1.05] font-medium sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {text && <p className="mt-6 text-lg leading-8 text-mist">{text}</p>}
    </Reveal>
  );
}

export default function Home() {
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
        {/* 1. Hero */}
        <section
          id="top"
          aria-labelledby="hero-title"
          className="relative isolate flex min-h-svh flex-col overflow-hidden pt-28 sm:pt-32 lg:pt-36"
        >
          <HeroBackdrop photo={heroPhoto} />

          <div
            className={`${container} grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start`}
          >
            <div>
              <h1
                id="hero-title"
                className="animate-fade-up font-display text-5xl leading-[0.98] font-medium sm:text-7xl xl:text-[5.5rem]"
              >
                Twoje <span className="text-[#d9cdb6]">wymarzone</span>
                <br />
                auto z <span className="text-[#d9cdb6]">USA</span>
              </h1>
              <p className="animate-fade-up mt-6 max-w-lg text-base leading-7 text-white/70 [animation-delay:150ms] sm:text-lg sm:leading-8">
                Pomagamy wybrać, kupić i sprowadzić samochód z amerykańskich aukcji
                — od licytacji aż po odbiór w Polsce.
              </p>
              <div className="animate-fade-up mt-8 flex flex-col gap-3 [animation-delay:300ms] sm:mt-10 sm:flex-row sm:gap-4">
                <a href="#samochody" className={heroButtonPrimary}>
                  Zobacz samochody
                  <span aria-hidden="true" className="transition-transform duration-500 ease-luxe group-hover:translate-x-1">
                    →
                  </span>
                </a>
                <Link href="/kalkulator" className={heroButtonSecondary}>
                  Oblicz koszt
                </Link>
              </div>
            </div>

            <div className="animate-fade-up hidden [animation-delay:450ms] lg:block lg:border-l lg:border-white/10 lg:pl-12">
              <HeroServices />
            </div>
          </div>

          {/* Нижняя половина hero — место автомобиля */}
          <div className="animate-fade-up mt-8 flex min-h-[220px] flex-1 [animation-delay:600ms] sm:min-h-[300px] lg:min-h-[42svh]">
            <HeroCarSlot photo={heroPhoto} />
          </div>

          {/* На телефоне услуги идут под автомобилем */}
          <div className={`${container} pb-12 lg:hidden`}>
            <div className="border-t border-white/10 pt-8">
              <HeroServices />
            </div>
          </div>
        </section>

        {/* 2. Zalety */}
        <section
          id="zalety"
          aria-labelledby="zalety-title"
          className="border-t border-line bg-graphite-900 py-24 sm:py-32"
        >
          <div className={container}>
            <SectionHeading
              eyebrow="Dlaczego my"
              title={<span id="zalety-title">Spokój na każdym etapie importu</span>}
              text="Bierzemy na siebie to, co w imporcie auta z USA najbardziej skomplikowane."
            />

            <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {advantages.map((item, index) => (
                <li key={item.title} className="bg-graphite-900">
                  <Reveal
                    delay={index * 100}
                    className="group h-full p-8 transition-colors duration-700 ease-luxe hover:bg-graphite-800 sm:p-10"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-8 w-8 fill-none stroke-gold stroke-[1.25] transition-transform duration-700 ease-luxe group-hover:-translate-y-1"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </svg>
                    <h3 className="mt-8 font-display text-2xl font-medium sm:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-4 leading-7 text-mist">{item.text}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Jak to działa */}
        <section
          id="jak-to-dziala"
          aria-labelledby="proces-title"
          className="py-24 sm:py-32"
        >
          <div className={container}>
            <SectionHeading
              eyebrow="Jak to działa"
              title={<span id="proces-title">Pięć kroków do Twojego auta</span>}
            />

            <ol className="mt-16 grid gap-10 lg:grid-cols-5 lg:gap-8">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={index * 120} className="border-t border-line pt-8">
                    <span className="font-display text-5xl text-gold" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-6 text-lg font-medium">
                      <span className="sr-only">Krok {index + 1}: </span>
                      {step.title}
                    </h3>
                    <p className="mt-3 leading-7 text-mist">{step.text}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Przykładowe samochody */}
        <section
          id="samochody"
          aria-labelledby="samochody-title"
          className="border-t border-line bg-graphite-900 py-24 sm:py-32"
        >
          <div className={container}>
            <SectionHeading
              eyebrow="Przykładowe auta"
              title={<span id="samochody-title">Inspiracje z amerykańskich aukcji</span>}
              text="Poniższe karty mają charakter wyłącznie poglądowy. Dane są przykładowe i nie stanowią oferty sprzedaży."
            />

            <ul className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sampleCars.map((car, index) => (
                <li key={car.name}>
                  <Reveal delay={index * 120} className="h-full">
                    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ink transition-[border-color,transform] duration-700 ease-luxe hover:-translate-y-1 hover:border-gold/40">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <CarPhotoSlot />
                        <span className="absolute top-4 left-4 rounded-full border border-gold/40 bg-ink/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-light">
                          Dane przykładowe
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-7">
                        <h3 className="font-display text-2xl font-medium">{car.name}</h3>
                        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-5 text-sm">
                          <div>
                            <dt className="text-mist">Rok</dt>
                            <dd className="mt-1">{car.year}</dd>
                          </div>
                          <div>
                            <dt className="text-mist">Przebieg</dt>
                            <dd className="mt-1">{car.mileage}</dd>
                          </div>
                          <div>
                            <dt className="text-mist">Silnik</dt>
                            <dd className="mt-1">{car.engine}</dd>
                          </div>
                        </dl>
                        <div className="mt-6 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-mist">
                              Przykładowy koszt w Polsce
                            </p>
                            <p className="mt-1 font-display text-3xl text-gold-light">
                              {car.price}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>

            <Reveal className="mt-10">
              <p className="text-sm text-mist">
                * Wartości mają charakter orientacyjny. Rzeczywisty koszt zależy od
                ceny na aukcji, kursu walut, stanu pojazdu i opłat w danym momencie.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 5. Wezwanie do działania */}
        <section
          id="kalkulator"
          aria-labelledby="cta-title"
          className="relative isolate overflow-hidden py-28 sm:py-40"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(201,169,97,0.16),transparent_70%)]"
          />
          <Reveal className={`${container} text-center`}>
            <p className="text-xs font-medium uppercase tracking-[0.4em] text-gold">
              Kalkulator
            </p>
            <h2
              id="cta-title"
              className="mx-auto mt-8 max-w-4xl font-display text-4xl leading-[1.05] font-medium sm:text-6xl lg:text-7xl"
            >
              Poznaj pełny koszt auta z USA, zanim zaczniesz licytować
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-mist">
              Sprawdź orientacyjny koszt importu przez Kłajpedę: cło i VAT w Litwie,
              akcyzę w Polsce, transport i naszą prowizję — każdą pozycję osobno.
            </p>
            <div className="mt-12 flex justify-center">
              <Link href="/kalkulator" className={buttonPrimary}>
                Oblicz koszt
              </Link>
            </div>
            <p className="mt-8 text-sm text-mist">
              Wolisz porozmawiać o konkretnym aucie?{" "}
              <Link href="/kontakt" className="text-gold transition-colors hover:text-gold-light">
                Napisz do nas →
              </Link>
            </p>
          </Reveal>
        </section>
      </main>

      {/* 6. Stopka */}
      <SiteFooter />
    </>
  );
}
