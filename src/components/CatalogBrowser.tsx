"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CarPhotoSlot } from "@/components/CarPhotoSlot";
import { carHref, formatNumber, type CatalogCar } from "@/lib/catalog";

type Filters = {
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  mileageMax: string;
  priceMin: string;
  priceMax: string;
};

const emptyFilters: Filters = {
  make: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  mileageMax: "",
  priceMin: "",
  priceMax: "",
};

const unique = <T,>(values: T[]) => [...new Set(values)];

const mileageOptions = [40000, 60000, 80000, 100000];
const priceOptions = [100000, 125000, 150000, 175000, 200000];

function matches(car: CatalogCar, filters: Filters) {
  const atLeast = (value: number, limit: string) => !limit || value >= Number(limit);
  const atMost = (value: number, limit: string) => !limit || value <= Number(limit);

  return (
    (!filters.make || car.make === filters.make) &&
    (!filters.model || car.model === filters.model) &&
    atLeast(car.year, filters.yearFrom) &&
    atMost(car.year, filters.yearTo) &&
    atMost(car.mileageKm, filters.mileageMax) &&
    atLeast(car.pricePln, filters.priceMin) &&
    atMost(car.pricePln, filters.priceMax)
  );
}

const selectClass =
  "w-full appearance-none rounded-none border border-line bg-graphite-800 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a961' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat py-3 pr-10 pl-4 text-sm text-white transition-colors duration-500 ease-luxe hover:border-gold/50 focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-40";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-medium uppercase tracking-[0.25em] text-mist"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function CatalogBrowser({ cars }: { cars: CatalogCar[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const makes = useMemo(() => unique(cars.map((car) => car.make)).sort(), [cars]);
  const years = useMemo(
    () => unique(cars.map((car) => car.year)).sort((a, b) => a - b),
    [cars],
  );

  const models = useMemo(
    () =>
      unique(
        cars
          .filter((car) => !filters.make || car.make === filters.make)
          .map((car) => car.model),
      ).sort(),
    [cars, filters.make],
  );

  const results = useMemo(
    () => cars.filter((car) => matches(car, filters)),
    [cars, filters],
  );

  const update = (key: keyof Filters) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setFilters((current) => ({
      ...current,
      [key]: value,
      // Смена марки сбрасывает модель, которой у новой марки нет
      ...(key === "make" ? { model: "" } : {}),
    }));
  };

  const active = Object.values(filters).some(Boolean);

  return (
    <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <form
        aria-label="Filtry katalogu"
        className="h-fit border border-line bg-graphite-900 p-6 sm:p-8 lg:sticky lg:top-28"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-medium">Filtry</h2>
          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            disabled={!active}
            className="text-xs uppercase tracking-[0.2em] text-gold transition-colors duration-500 hover:text-gold-light disabled:cursor-default disabled:text-mist/40"
          >
            Wyczyść
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Field id="filtr-marka" label="Marka">
            <select
              id="filtr-marka"
              className={selectClass}
              value={filters.make}
              onChange={update("make")}
            >
              <option value="">Wszystkie marki</option>
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </Field>

          <Field id="filtr-model" label="Model">
            <select
              id="filtr-model"
              className={selectClass}
              value={filters.model}
              onChange={update("model")}
            >
              <option value="">Wszystkie modele</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="sm:col-span-2 lg:col-span-1">
            <legend className="text-[11px] font-medium uppercase tracking-[0.25em] text-mist">
              Rok produkcji
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <select
                aria-label="Rok produkcji od"
                className={selectClass}
                value={filters.yearFrom}
                onChange={update("yearFrom")}
              >
                <option value="">Od</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                aria-label="Rok produkcji do"
                className={selectClass}
                value={filters.yearTo}
                onChange={update("yearTo")}
              >
                <option value="">Do</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <Field id="filtr-przebieg" label="Przebieg maks.">
            <select
              id="filtr-przebieg"
              className={selectClass}
              value={filters.mileageMax}
              onChange={update("mileageMax")}
            >
              <option value="">Dowolny</option>
              {mileageOptions.map((km) => (
                <option key={km} value={km}>
                  do {formatNumber(km)} km
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="sm:col-span-2 lg:col-span-1">
            <legend className="text-[11px] font-medium uppercase tracking-[0.25em] text-mist">
              Cena w Polsce
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <select
                aria-label="Cena od"
                className={selectClass}
                value={filters.priceMin}
                onChange={update("priceMin")}
              >
                <option value="">Od</option>
                {priceOptions.map((price) => (
                  <option key={price} value={price}>
                    {formatNumber(price)} zł
                  </option>
                ))}
              </select>
              <select
                aria-label="Cena do"
                className={selectClass}
                value={filters.priceMax}
                onChange={update("priceMax")}
              >
                <option value="">Do</option>
                {priceOptions.map((price) => (
                  <option key={price} value={price}>
                    {formatNumber(price)} zł
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        </div>
      </form>

      <div>
        <p
          className="border-b border-line pb-5 text-sm text-mist"
          aria-live="polite"
        >
          Znaleziono:{" "}
          <span className="font-display text-xl text-white">{results.length}</span>{" "}
          z {cars.length} przykładowych ofert
        </p>

        {results.length > 0 ? (
          <ul className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {results.map((car) => (
              <li key={car.slug}>
                <CarCard car={car} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-2xl">Brak aut spełniających kryteria</p>
            <p className="mt-3 text-sm text-mist">
              Zmień ustawienia filtrów lub wyczyść je, aby zobaczyć wszystkie przykłady.
            </p>
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="mt-8 border border-gold/60 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors duration-500 ease-luxe hover:bg-gold hover:text-ink"
            >
              Wyczyść filtry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CarCard({ car }: { car: CatalogCar }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-line bg-graphite-900 transition-[border-color,transform] duration-700 ease-luxe hover:-translate-y-1 hover:border-gold/40">
      <div className="relative aspect-[4/3] overflow-hidden">
        <CarPhotoSlot />
        <span className="absolute top-4 left-4 border border-gold/40 bg-ink/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-light">
          Przykładowa oferta
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.25em] text-mist">
          {car.year} · {car.location}, USA
        </p>
        <h3 className="mt-3 font-display text-2xl leading-tight font-medium">
          {/* Растянутая ссылка: кликабельна вся карточка */}
          <Link
            href={carHref(car)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-gold"
          >
            {car.make} {car.model}
            <span className="block text-lg text-[#d9cdb6]">{car.version}</span>
          </Link>
        </h3>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-5 text-sm">
          <div>
            <dt className="text-mist">Rok</dt>
            <dd className="mt-1">{car.year}</dd>
          </div>
          <div>
            <dt className="text-mist">Przebieg</dt>
            <dd className="mt-1">{formatNumber(car.mileageKm)} km</dd>
          </div>
          <div>
            <dt className="text-mist">Silnik</dt>
            <dd className="mt-1">{car.engine}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mist">
              Przykładowy koszt w Polsce
            </p>
            <p className="mt-1 font-display text-3xl text-gold-light">
              ok. {formatNumber(car.pricePln)} zł
            </p>
          </div>
          <span
            aria-hidden="true"
            className="pb-1.5 text-xs uppercase tracking-[0.2em] text-gold transition-transform duration-500 ease-luxe group-hover:translate-x-1"
          >
            Szczegóły →
          </span>
        </div>
      </div>
    </article>
  );
}
