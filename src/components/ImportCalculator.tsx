"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  AUCTION_ACCOUNTS,
  auctionLabels,
  estimateAuctionFees,
  type AuctionHouse,
} from "@/lib/auction-fees";
import { formatBidTime, formatNumber, type LotPrice } from "@/lib/catalog";
import { formatRate, formatRateDate } from "@/lib/nbp-rates";
import { useNbpRates, type NbpRateState } from "@/lib/use-nbp-rates";
import {
  calculateImportCosts,
  COMMISSION_EUR,
  dutyRate,
  exciseRate,
  LT_VAT_RATE,
  STANDARD_DUTY,
  type CalculatorInput,
  type CalculatorResult,
  type Drive,
  type DutyMode,
  type VehicleType,
} from "@/lib/import-costs";

type AmountKey =
  | "priceUsd"
  | "auctionFeesUsd"
  | "usTransportUsd"
  | "seaFreightUsd"
  | "insuranceUsd"
  | "portServiceEur"
  | "transportToPlEur"
  | "otherPln"
  | "usdPln"
  | "eurPln"
  | "customDutyRate"
  | "vatRate"
  | "engineCc";

type FormState = Record<AmountKey, string> & {
  vehicleType: VehicleType;
  dutyMode: DutyMode;
  drive: Drive;
  transportInVatBase: boolean;
  newVehicle: boolean;
  /** Курс изменён вручную: автоматическая загрузка и «Odśwież kursy» его не трогают */
  usdPlnManual: boolean;
  eurPlnManual: boolean;
  /** Сбор изменён вручную: автоматический расчёт по тарифу его не перезаписывает */
  auctionFeesManual: boolean;
};

type RateKey = "usdPln" | "eurPln";

const rateCurrency = { usdPln: "USD", eurPln: "EUR" } as const;
const manualFlag = { usdPln: "usdPlnManual", eurPln: "eurPlnManual" } as const;

const initialState: FormState = {
  priceUsd: "",
  auctionFeesUsd: "",
  usTransportUsd: "",
  seaFreightUsd: "",
  insuranceUsd: "",
  portServiceEur: "",
  transportToPlEur: "",
  otherPln: "",
  usdPln: "",
  eurPln: "",
  customDutyRate: "",
  vatRate: String(LT_VAT_RATE),
  engineCc: "",
  vehicleType: "passenger",
  dutyMode: "standard",
  drive: "combustion",
  transportInVatBase: true,
  newVehicle: false,
  usdPlnManual: false,
  eurPlnManual: false,
  auctionFeesManual: false,
};

const labels: Record<AmountKey, string> = {
  priceUsd: "Cena zakupu na aukcji",
  auctionFeesUsd: "Opłaty aukcyjne",
  usTransportUsd: "Transport w USA",
  seaFreightUsd: "Transport morski do Kłajpedy",
  insuranceUsd: "Ubezpieczenie transportu",
  portServiceEur: "Obsługa portowa i celna",
  transportToPlEur: "Transport z Litwy do Polski",
  otherPln: "Pozostałe koszty",
  usdPln: "Kurs USD/PLN",
  eurPln: "Kurs EUR/PLN",
  customDutyRate: "Stawka cła",
  vatRate: "Stawka VAT w Litwie",
  engineCc: "Pojemność silnika",
};

/** Принимает "12 500,50" и "12500.5"; пустое или некорректное значение — null */
function parseAmount(value: string) {
  const normalized = value.replace(/[\s ]/g, "").replace(",", ".");
  if (normalized === "") return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

const pln = (value: number) => `${formatNumber(Math.round(value))} zł`;
const percent = (value: number) => `${String(value).replace(".", ",")}%`;

const fieldClass =
  "w-full rounded-none border border-line bg-graphite-800 py-3 pl-4 text-sm text-white placeholder:text-white/25 transition-colors duration-500 ease-luxe hover:border-gold/50 focus-visible:border-gold";

const selectClass = `${fieldClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a961' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10`;

const labelClass = "block text-[11px] font-medium uppercase tracking-[0.22em] text-mist";

/** Данные автомобиля, которыми калькулятор заполняется при открытии */
export type CalculatorVehicle = {
  vehicleType: VehicleType;
  powertrain: Drive;
  engineCc: number | null;
};

type ImportCalculatorProps = {
  /**
   * Цена лота из общего объекта автомобиля. Не копируется в состояние формы:
   * когда источник (в будущем — API аукциона) передаст новое значение, итог пересчитается сам.
   */
  lotPrice?: LotPrice;
  vehicle?: CalculatorVehicle;
  /** Аукцион лота; null или не задан — аукцион неизвестен, сбор вводится вручную */
  auction?: AuctionHouse | null;
  /** page — отдельная страница /kalkulator; embedded — колонка на странице лота */
  layout?: "page" | "embedded";
};

export function ImportCalculator({
  lotPrice,
  vehicle,
  auction = null,
  layout = "page",
}: ImportCalculatorProps) {
  const [form, setForm] = useState<FormState>(() =>
    vehicle
      ? {
          ...initialState,
          vehicleType: vehicle.vehicleType,
          drive: vehicle.powertrain,
          engineCc: vehicle.engineCc ? String(vehicle.engineCc) : "",
        }
      : initialState,
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const uid = useId();
  const fieldId = (key: AmountKey) => `${uid}-${key}`;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Курсы: пока поле не изменено вручную, в расчёт идёт курс NBP (если он получен).
  // Ручное значение хранится отдельно и не перезаписывается загрузкой или обновлением.
  const nbp = useNbpRates();
  const nbpRate = (key: RateKey) => nbp[rateCurrency[key]];
  const rateText = (key: RateKey) => {
    const rate = nbpRate(key).rate;
    return form[manualFlag[key]] || !rate ? form[key] : formatRate(rate.mid);
  };

  const needsEngine = form.vehicleType === "passenger" && form.drive !== "electric";

  // Цена покупки: введённая вручную имеет приоритет, иначе — цена лота (если известна).
  // form.priceUsd хранит только ручное значение, исходная цена лота не меняется.
  const lotUsd = lotPrice && lotPrice.status !== "unavailable" ? lotPrice.usd : null;
  const manualPrice = form.priceUsd.trim() !== "";
  const purchaseUsd = manualPrice ? parseAmount(form.priceUsd) : lotUsd;
  const priceNote = !lotPrice
    ? undefined
    : manualPrice || lotUsd === null
      ? "cena wpisana ręcznie"
      : lotPrice.status === "demo"
        ? "cena lotu — przykładowa"
        : "cena lotu z aukcji";

  // Аукционный сбор: по проверенному тарифу — автоматически и заново при каждой смене цены;
  // без тарифа или после ручной правки — значение из поля
  // Дата читается только в браузере: при пререндере её нет (null), сбор остаётся ручным
  const today = useSyncExternalStore(subscribeNever, todayIso, () => null);
  const account = auction ? AUCTION_ACCOUNTS[auction] : null;
  const feeEstimate = estimateAuctionFees({
    auction,
    buyerType: account?.buyerType ?? null,
    biddingMethod: account?.biddingMethod ?? null,
    priceUsd: purchaseUsd,
    date: today,
  });
  const autoFee = feeEstimate.status === "calculated" ? feeEstimate : null;
  const feeIsAuto = autoFee !== null && !form.auctionFeesManual;
  const feeNote = feeIsAuto
    ? `obliczono automatycznie (${auctionLabels[autoFee.schedule.auction]})`
    : undefined;

  /** Текст поля, который участвует в проверке и расчёте */
  const text = (key: AmountKey) =>
    key === "usdPln" || key === "eurPln"
      ? rateText(key)
      : key === "auctionFeesUsd" && feeIsAuto
        ? formatUsdAmount(autoFee.totalUsd)
        : form[key];

  const required: AmountKey[] = [
    "auctionFeesUsd",
    "usTransportUsd",
    "seaFreightUsd",
    "portServiceEur",
    "transportToPlEur",
    "usdPln",
    "eurPln",
    "vatRate",
    ...(form.dutyMode === "custom" ? (["customDutyRate"] as const) : []),
    ...(needsEngine ? (["engineCc"] as const) : []),
  ];
  // Некорректные значения (не числа) блокируют расчёт — в том числе в необязательных полях,
  // иначе они молча считались бы нулём
  const invalid = (["priceUsd", ...required, "insuranceUsd", "otherPln"] as AmountKey[]).filter(
    (key) => text(key).trim() !== "" && parseAmount(text(key)) === null,
  );
  const missing = [
    ...(purchaseUsd === null ? (["priceUsd"] as const) : []),
    ...required.filter((key) => parseAmount(text(key)) === null),
  ].filter((key) => !invalid.includes(key));
  const problems = [...invalid, ...missing];

  let result: CalculatorResult | null = null;
  if (problems.length === 0 && purchaseUsd !== null) {
    const value = (key: AmountKey) => parseAmount(text(key)) ?? 0;
    const input: CalculatorInput = {
      priceUsd: purchaseUsd,
      auctionFeesUsd: value("auctionFeesUsd"),
      usTransportUsd: value("usTransportUsd"),
      seaFreightUsd: value("seaFreightUsd"),
      insuranceUsd: value("insuranceUsd"),
      portServiceEur: value("portServiceEur"),
      transportToPlEur: value("transportToPlEur"),
      otherPln: value("otherPln"),
      usdPln: value("usdPln"),
      eurPln: value("eurPln"),
      customDutyRate: value("customDutyRate"),
      vatRate: value("vatRate"),
      engineCc: value("engineCc"),
      vehicleType: form.vehicleType,
      dutyMode: form.dutyMode,
      drive: form.drive,
      transportInVatBase: form.transportInVatBase,
    };
    result = calculateImportCosts(input);
  }

  const amountField = (key: AmountKey, unit: string, hint?: string, optional = false) => (
    <AmountField
      id={fieldId(key)}
      label={labels[key]}
      unit={unit}
      hint={hint}
      optional={optional}
      value={form[key]}
      onChange={(value) => set(key, value)}
    />
  );

  const rateField = (key: RateKey) => {
    const state = nbpRate(key);
    const manual = form[manualFlag[key]];

    return (
      <div className="grid content-start gap-2">
        <AmountField
          id={fieldId(key)}
          label={labels[key]}
          unit="PLN"
          placeholder={nbp.loading && !state.rate ? "pobieranie…" : "0"}
          hint={rateHint(state, manual, nbp.loading)}
          value={rateText(key)}
          onChange={(value) =>
            setForm((current) => ({ ...current, [key]: value, [manualFlag[key]]: true }))
          }
        />
        {manual && state.rate && (
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({ ...current, [key]: "", [manualFlag[key]]: false }))
            }
            aria-label={`Zastąp ręcznie wpisany kurs ${rateCurrency[key]}/PLN kursem NBP`}
            className="justify-self-start text-left text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-light"
          >
            Zastąp kursem NBP: {formatRate(state.rate.mid)}
          </button>
        )}
      </div>
    );
  };

  const summary = (
    <Summary
      result={result}
      missing={[
        ...invalid.map((key) => `${labels[key]} — popraw wartość`),
        ...missing.map((key) => labels[key]),
      ]}
      form={form}
      priceNote={priceNote}
      feeNote={feeNote}
    />
  );

  const priceControl = lotPrice ? (
    <LotPriceField
      inputId={fieldId("priceUsd")}
      lotPrice={lotPrice}
      value={form.priceUsd}
      onChange={(value) => set("priceUsd", value)}
    />
  ) : (
    amountField("priceUsd", "USD", "Cena wylicytowana (bez opłat).")
  );

  /** Раскрывает подробные поля (если нужно) и ставит курсор в первое проблемное поле */
  const focusFirstProblem = () => {
    const key = problems[0];
    if (!key) return;
    if (key !== "priceUsd" || layout === "page") flushSync(() => setDetailsOpen(true));
    const element = document.getElementById(fieldId(key));
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    element?.focus({ preventScroll: true });
  };

  const formElement = (
    <form
      aria-label="Dane do kalkulacji"
      className="grid gap-12"
      onSubmit={(event) => event.preventDefault()}
    >
      <FormGroup number="01" title={layout === "embedded" ? "Koszty w USA" : "Zakup w USA"}>
        {/* В компактном режиме цена покупки стоит над раскрывающимся разделом */}
        {layout === "page" && priceControl}
        <div className="grid content-start gap-2">
          <AmountField
            id={fieldId("auctionFeesUsd")}
            label={labels.auctionFeesUsd}
            unit="USD"
            badge={
              feeIsAuto ? (
                <FeeBadge tone="auto">Obliczono automatycznie</FeeBadge>
              ) : autoFee ? (
                <FeeBadge tone="manual">Wpisano ręcznie</FeeBadge>
              ) : (
                <FeeBadge tone="manual">Wpisz opłatę ręcznie</FeeBadge>
              )
            }
            hint={
              autoFee
                ? feeIsAuto
                  ? `Taryfa ${auctionLabels[autoFee.schedule.auction]} „${autoFee.schedule.plan}”, zweryfikowana ${formatIsoDate(autoFee.schedule.verifiedAt)}. Przelicza się przy zmianie ceny zakupu.`
                  : `Wpisano ręcznie. Według taryfy: ${formatUsdAmount(autoFee.totalUsd)} USD.`
                : `${feeEstimate.status === "manual" ? feeEstimate.reason : ""} Suma opłat z faktury aukcji (buyer fee, opłaty dokumentowe i inne).`
            }
            value={text("auctionFeesUsd")}
            onChange={(value) =>
              setForm((current) => ({ ...current, auctionFeesUsd: value, auctionFeesManual: true }))
            }
          />
          {autoFee && form.auctionFeesManual && (
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({ ...current, auctionFeesUsd: "", auctionFeesManual: false }))
              }
              className="justify-self-start text-left text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-light"
            >
              Przywróć opłatę według taryfy: {formatUsdAmount(autoFee.totalUsd)} USD
            </button>
          )}
        </div>
        {amountField("usTransportUsd", "USD", "Z placu aukcyjnego do portu załadunku.")}
      </FormGroup>

      <FormGroup number="02" title="Transport do Kłajpedy">
        {amountField("seaFreightUsd", "USD", "Fracht morski według oferty przewoźnika.")}
        {amountField(
          "insuranceUsd",
          "USD",
          "Jeśli wykupione — wchodzi do wartości celnej.",
          true,
        )}
      </FormGroup>

      <FormGroup number="03" title="Litwa i Polska">
        {amountField(
          "portServiceEur",
          "EUR",
          "Rozładunek, terminal, agencja celna — według oferty.",
        )}
        {amountField("transportToPlEur", "EUR", "Laweta z Kłajpedy do miejsca odbioru.")}
        {amountField(
          "otherPln",
          "PLN",
          "Np. opłata recyklingowa, badanie techniczne, tłumaczenia, rejestracja.",
          true,
        )}
      </FormGroup>

      <FormGroup
        number="04"
        title="Kursy walut"
        text="Kursy NBP mają charakter orientacyjny. Do rozliczeń celnych i podatkowych mogą mieć zastosowanie inne kursy."
      >
        <RatesStatus
          loading={nbp.loading}
          usd={nbp.USD}
          eur={nbp.EUR}
          anyManual={form.usdPlnManual || form.eurPlnManual}
          onRefresh={nbp.refresh}
        />
        {rateField("usdPln")}
        {rateField("eurPln")}
      </FormGroup>

      <FormGroup number="05" title="Pojazd i podatki">
        <SelectField
          label="Rodzaj pojazdu"
          value={form.vehicleType}
          onChange={(value) => set("vehicleType", value as VehicleType)}
          options={[
            ["passenger", "Samochód osobowy (CN 8703)"],
            ["pickup", "Pickup / samochód ciężarowy (CN 8704)"],
          ]}
        />
        <SelectField
          label="Stawka cła"
          value={form.dutyMode}
          onChange={(value) => set("dutyMode", value as DutyMode)}
          options={[
            ["standard", `Standardowa UE — ${STANDARD_DUTY[form.vehicleType]}%`],
            ["usOrigin", "0% — pochodzenie z USA (rozp. UE 2026/1455)"],
            ["custom", "Inna — wpiszę stawkę"],
          ]}
        />
        {form.dutyMode === "custom" && amountField("customDutyRate", "%")}
        {form.dutyMode === "usOrigin" && (
          <p className="text-xs leading-5 text-gold-light/90 sm:col-span-2">
            Stawka 0% wymaga udokumentowania niepreferencyjnego pochodzenia pojazdu z USA
            (miejsca produkcji, a nie marki). Agent celny potwierdza, czy można ją zastosować.
          </p>
        )}
        {form.vehicleType === "passenger" && (
          <>
            <SelectField
              label="Rodzaj napędu"
              value={form.drive}
              onChange={(value) => set("drive", value as Drive)}
              options={[
                ["combustion", "Spalinowy"],
                ["hybrid", "Hybryda (HEV, w tym mild hybrid)"],
                ["plugin", "Hybryda plug-in (PHEV)"],
                ["electric", "Elektryczny lub wodorowy"],
              ]}
            />
            {needsEngine && amountField("engineCc", "cm³")}
          </>
        )}
        {amountField("vatRate", "%", "Stawka podstawowa na Litwie.")}

        <div className="grid gap-4 sm:col-span-2">
          <Checkbox
            checked={form.transportInVatBase}
            onChange={(value) => set("transportInVatBase", value)}
          >
            Wliczaj transport do Polski do podstawy VAT importowego (miejsce przeznaczenia
            jest znane w chwili odprawy).
          </Checkbox>
          <Checkbox
            checked={form.newVehicle}
            onChange={(value) => set("newVehicle", value)}
          >
            Pojazd nowy w rozumieniu VAT (do 6 miesięcy od pierwszego dopuszczenia do ruchu
            lub przebieg do 6000 km).
          </Checkbox>
          {form.newVehicle && (
            <p
              role="alert"
              className="border border-gold/40 bg-gold/5 p-4 text-xs leading-5 text-gold-light"
            >
              Przy nowych środkach transportu przemieszczenie do Polski może rodzić obowiązek
              rozliczenia VAT w Polsce. Taki przypadek wymaga indywidualnej analizy — poniższy
              wynik go nie uwzględnia.
            </p>
          )}
        </div>
      </FormGroup>
    </form>
  );

  if (layout === "embedded") {
    const detailsId = `${uid}-szczegoly`;
    const eur = parseAmount(text("eurPln"));

    return (
      <div className="border border-gold/30 bg-[linear-gradient(to_bottom,#18181b,#111113)]">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2 lg:gap-10">
          <div className="flex min-w-0 flex-col gap-5">
            {priceControl}
            <KeyFacts form={form} />
          </div>

          <div className="flex min-w-0 flex-col gap-5 lg:border-l lg:border-line lg:pl-10">
            <div aria-live="polite" className="border-t border-gold/30 pt-6 lg:border-t-0 lg:pt-0">
              {result ? (
                <>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-mist">
                    Łącznie — orientacyjnie
                  </p>
                  <p className="mt-2 font-display text-5xl leading-none text-gold-light">
                    {pln(result.total)}
                  </p>
                  <p className="mt-3 text-xs text-mist">
                    w tym cło, VAT i akcyza: {pln(result.taxes)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-mist">
                    Kalkulacja niepełna
                  </p>
                  <p className="mt-2 font-display text-3xl text-gold-light sm:text-4xl">
                    {problemsText(missing.length, invalid.length)}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-mist">
                    {problems.map((key) => labels[key]).join(", ")}. Suma pojawi się po
                    uzupełnieniu wszystkich wymaganych pól.
                  </p>
                  <button
                    type="button"
                    onClick={focusFirstProblem}
                    className="mt-4 border border-gold/60 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors duration-500 ease-luxe hover:bg-gold hover:text-ink"
                  >
                    {invalid.length > 0 ? "Popraw pola" : "Uzupełnij pola"}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-start justify-between gap-4 border-t border-line pt-5 text-sm">
              <p className="text-gold-light">
                Prowizja USA AUTO IMPORT
                <span className="mt-0.5 block text-xs text-mist">
                  {result ? "wliczona w sumę" : "stała kwota, doliczana do sumy"}
                </span>
              </p>
              <p className="shrink-0 text-right text-gold-light">
                {COMMISSION_EUR} EUR
                {eur !== null && (
                  <span className="mt-0.5 block text-xs text-mist">
                    ≈ {pln(COMMISSION_EUR * eur)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 border-t border-line px-5 py-4 text-left text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors duration-500 ease-luxe hover:bg-white/[0.03] hover:text-gold-light sm:px-7"
        >
          Szczegóły kosztów i ustawienia
          <span
            aria-hidden="true"
            className={`text-base transition-transform duration-500 ease-luxe ${detailsOpen ? "rotate-180" : ""}`}
          >
            ↓
          </span>
        </button>

        {/* hidden, а не условный рендер: введённые значения и фокус-цели остаются в DOM */}
        <div id={detailsId} hidden={!detailsOpen} className="border-t border-line p-5 sm:p-7">
          <div
            className={
              result ? "grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10" : ""
            }
          >
            {formElement}
            {result && (
              <div className="min-w-0 border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pt-8 lg:pl-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                  Szczegóły kosztów
                </p>
                <Breakdown result={result} form={form} priceNote={priceNote} feeNote={feeNote} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
      {formElement}
      <aside className="lg:sticky lg:top-28 lg:h-fit">{summary}</aside>
    </div>
  );
}

const fieldsWord = (count: number) => (count === 1 ? "pole" : count < 5 ? "pola" : "pól");

function problemsText(missing: number, invalid: number) {
  const parts = [];
  if (missing > 0) parts.push(`Brakuje ${missing} ${fieldsWord(missing)}`);
  if (invalid > 0) parts.push(`${invalid} do poprawy`);
  return parts.join(" · ");
}

const vehicleLabels: Record<VehicleType, string> = {
  passenger: "Osobowy (CN 8703)",
  pickup: "Pickup (CN 8704)",
};

const driveLabels: Record<Drive, string> = {
  combustion: "spalinowy",
  hybrid: "hybryda",
  plugin: "hybryda plug-in",
  electric: "elektryczny",
};

/** Короткая сводка параметров, от которых зависят налоги */
function KeyFacts({ form }: { form: FormState }) {
  const cc = parseAmount(form.engineCc);
  const vat = parseAmount(form.vatRate);
  const duty =
    form.dutyMode === "custom"
      ? parseAmount(form.customDutyRate)
      : dutyRate({ ...form, customDutyRate: 0 });

  const passenger = form.vehicleType === "passenger";
  const engineKnown = form.drive === "electric" || cc !== null;
  const exciseValue = exciseRate({ ...form, engineCc: cc ?? 0 });
  // Основа ставки акциза — тип привода и диапазон объёма, без повтора характеристик лота
  const band =
    form.drive === "electric" || cc === null
      ? ""
      : cc <= 2000
        ? ", do 2000 cm³"
        : form.drive !== "combustion" && cc <= 3500
          ? ", 2000–3500 cm³"
          : form.drive === "combustion"
            ? ", pow. 2000 cm³"
            : ", pow. 3500 cm³";
  const excise = !passenger
    ? "nie dotyczy"
    : !engineKnown
      ? "—"
      : `${exciseValue === 0 ? "zwolnienie" : percent(exciseValue)} · ${driveLabels[form.drive]}${band}`;

  const facts: [string, string][] = [
    ["Pojazd", vehicleLabels[form.vehicleType]],
    ["Cło w Litwie", duty === null ? "—" : percent(duty)],
    ["VAT w Litwie", vat === null ? "—" : percent(vat)],
    ["Akcyza w Polsce", excise],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border border-line bg-graphite-900 px-4 py-4 text-sm">
      {facts.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-mist">{label}</dt>
          <dd className="mt-1 break-words text-white/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LotPriceField({
  inputId,
  lotPrice,
  value,
  onChange,
}: {
  inputId: string;
  lotPrice: LotPrice;
  value: string;
  onChange: (value: string) => void;
}) {
  const lotUsd = lotPrice.status === "unavailable" ? null : lotPrice.usd;

  const lotSource =
    lotPrice.status === "demo"
      ? "cena przykładowa"
      : lotPrice.status === "auction"
        ? `${lotPrice.source.toUpperCase()}, aktualizacja: ${
            lotPrice.updatedAt ? formatBidTime(lotPrice.updatedAt) : "brak danych"
          }`
        : "";

  return (
    <div className="grid gap-3 sm:col-span-2">
      <AmountField
        id={inputId}
        label={lotUsd === null ? "Cena zakupu na aukcji" : "Przewidywana cena zakupu"}
        unit="USD"
        optional={lotUsd !== null}
        placeholder={lotUsd === null ? "0" : formatNumber(lotUsd)}
        hint={
          lotUsd === null
            ? "Cena lotu jest niedostępna — wpisz przewidywaną cenę zakupu."
            : `Puste pole = cena lotu ${formatNumber(lotUsd)} USD (${lotSource}). Wpisz własną kwotę, aby sprawdzić inny scenariusz — cena lotu się nie zmieni.`
        }
        value={value}
        onChange={onChange}
      />
      {lotUsd !== null && value.trim() !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="justify-self-start text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-light"
        >
          Przywróć cenę lotu
        </button>
      )}
    </div>
  );
}

/** Дата не меняется за время жизни страницы — подписка не нужна */
const subscribeNever = () => () => {};

/** Сегодняшняя дата (YYYY-MM-DD) — для выбора действующего тарифа */
function todayIso() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 1234.5 → "1234,50" — в формате, который принимает поле ввода */
function formatUsdAmount(value: number) {
  return value.toFixed(2).replace(".", ",");
}

/** 2026-10-24 → 24.10.2026 */
function formatIsoDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function FeeBadge({ tone, children }: { tone: "auto" | "manual"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${
        tone === "auto"
          ? "border-emerald-300/30 text-emerald-100"
          : "border-white/15 text-mist"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${tone === "auto" ? "bg-emerald-300/80" : "bg-white/35"}`}
      />
      {children}
    </span>
  );
}

/** Подсказка под полем курса: источник, дата, загрузка, ошибка или ручной ввод */
function rateHint(state: NbpRateState, manual: boolean, loading: boolean) {
  const { rate, error, stale } = state;
  const date = rate && formatRateDate(rate.effectiveDate);

  if (manual) {
    return rate
      ? `Wpisano ręcznie. Kurs NBP z ${date}: ${formatRate(rate.mid)}.`
      : "Kurs wpisany ręcznie.";
  }
  if (rate) {
    const base = `Źródło: NBP, tabela A, kurs z ${date}.`;
    if (error) return `${base} Nie udało się odświeżyć (${error}).`;
    if (stale) return `${base} To najnowszy dostępny kurs, ale ma ponad tydzień — sprawdź go.`;
    return base;
  }
  if (loading) return "Pobieranie kursu NBP…";
  return `${error ?? "Brak kursu NBP"} — wpisz kurs ręcznie.`;
}

function rateStatusText(code: string, state: NbpRateState) {
  if (!state.rate) return `${code}: niedostępny`;
  const text = `${code} z ${formatRateDate(state.rate.effectiveDate)}`;
  return state.error ? `${text} (nie odświeżono)` : text;
}

/** Строка состояния курсов: источник NBP, даты публикации, загрузка или ошибка, кнопка обновления */
function RatesStatus({
  loading,
  usd,
  eur,
  anyManual,
  onRefresh,
}: {
  loading: boolean;
  usd: NbpRateState;
  eur: NbpRateState;
  anyManual: boolean;
  onRefresh: () => void;
}) {
  const failed = [usd, eur].filter((state) => state.error).length;
  const sameDate =
    usd.rate && eur.rate && usd.rate.effectiveDate === eur.rate.effectiveDate
      ? formatRateDate(usd.rate.effectiveDate)
      : null;

  const status = loading
    ? "pobieranie kursów…"
    : failed === 2 && !usd.rate && !eur.rate
      ? "nie udało się pobrać kursów — wpisz je ręcznie"
      : sameDate && failed === 0
        ? `kursy z ${sameDate}`
        : `${rateStatusText("USD", usd)} · ${rateStatusText("EUR", eur)}`;

  return (
    <div className="grid gap-2 border border-line bg-graphite-900 px-4 py-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-white/80">
          <span className="text-gold">Źródło: NBP</span> (tabela A) ·{" "}
          <span className={failed > 0 && !loading ? "text-red-300" : undefined}>{status}</span>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="border border-gold/50 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-gold transition-colors duration-300 ease-luxe hover:bg-gold hover:text-ink disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          {loading ? "Pobieranie…" : "Odśwież kursy"}
        </button>
      </div>
      {anyManual && (
        <p className="text-xs text-mist">
          Odświeżenie nie zmienia kursów wpisanych ręcznie — aby je zastąpić, użyj przycisku
          pod polem.
        </p>
      )}
    </div>
  );
}

function FormGroup({
  number,
  title,
  text,
  children,
}: {
  number: string;
  title: string;
  text?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-line pt-8">
      <fieldset>
        <legend className="flex items-baseline gap-4">
          <span className="font-display text-2xl text-gold" aria-hidden="true">
            {number}
          </span>
          <span className="font-display text-2xl font-medium sm:text-3xl">{title}</span>
        </legend>
        {text && <p className="mt-3 max-w-2xl text-sm leading-6 text-mist">{text}</p>}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
      </fieldset>
    </div>
  );
}

function AmountField({
  id: externalId,
  label,
  unit,
  hint,
  optional,
  badge,
  placeholder = "0",
  value,
  onChange,
}: {
  id?: string;
  label: string;
  /** Метка состояния справа от подписи поля */
  badge?: ReactNode;
  unit: string;
  hint?: string;
  optional?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const invalid = value.trim() !== "" && parseAmount(value) === null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className={labelClass}>
          {label}
          {optional && <span className="normal-case tracking-normal"> (opcjonalnie)</span>}
        </label>
        {badge}
      </div>
      <div className="relative mt-2">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${fieldClass} pr-14 aria-[invalid=true]:border-red-400/70`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-mist">
          {unit}
        </span>
      </div>
      {invalid ? (
        <p className="mt-2 text-xs text-red-300">Wpisz liczbę, np. 1250 lub 4,35.</p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-mist">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${selectClass} mt-2`}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-6 text-white/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#c9a961]"
      />
      <span>{children}</span>
    </label>
  );
}

function exciseNote(result: CalculatorResult, form: FormState) {
  if (form.vehicleType !== "passenger") return "nie dotyczy — pojazd spoza CN 8703";
  if (result.exciseRate === 0) {
    return form.drive === "electric"
      ? "zwolnienie — pojazd elektryczny lub wodorowy"
      : "zwolnienie — PHEV do 2000 cm³";
  }
  return `${percent(result.exciseRate)} × ${pln(result.exciseBase)}`;
}

function Summary({
  result,
  missing,
  form,
  priceNote,
  feeNote,
}: {
  result: CalculatorResult | null;
  missing: string[];
  form: FormState;
  priceNote?: string;
  feeNote?: string;
}) {
  return (
    <section
      aria-labelledby="summary-title"
      aria-live="polite"
      className="border border-gold/30 bg-[linear-gradient(to_bottom,#18181b,#111113)] p-6 sm:p-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
        Wynik orientacyjny
      </p>
      <h2 id="summary-title" className="mt-4 font-display text-2xl font-medium">
        Koszt sprowadzenia do Polski
      </h2>

      {!result ? (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-sm leading-6 text-white/80">
            Uzupełnij wymagane pola, aby zobaczyć kalkulację:
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-mist">
            {missing.map((label) => (
              <li key={label} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-gold/60" />
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-5 text-mist">
            Jeśli dany koszt nie występuje, wpisz 0.
          </p>
        </div>
      ) : (
        <>
          <Breakdown result={result} form={form} priceNote={priceNote} feeNote={feeNote} />

          <div className="mt-6 border-t border-line pt-6">
            <Row
              label={`Prowizja USA AUTO IMPORT — ${COMMISSION_EUR} EUR`}
              value={pln(result.commission)}
              accent
            />
          </div>

          <div className="mt-6 border-t border-gold/30 pt-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-mist">
              Łącznie — orientacyjnie
            </p>
            <p className="mt-2 font-display text-5xl text-gold-light">{pln(result.total)}</p>
            <p className="mt-2 text-xs text-mist">
              w tym cło, VAT i akcyza: {pln(result.taxes)}
            </p>
          </div>
        </>
      )}

      <p className="mt-8 text-xs leading-5 text-mist">
        Kalkulacja ma charakter poglądowy i nie stanowi oferty ani porady podatkowej.
        Ostateczne kwoty ustalają organy celne i podatkowe na podstawie dokumentów.
      </p>
    </section>
  );
}

function Breakdown({
  result,
  form,
  priceNote,
  feeNote,
}: {
  result: CalculatorResult;
  form: FormState;
  priceNote?: string;
  feeNote?: string;
}) {
  return (
    <dl className="mt-6 grid gap-3 border-t border-line pt-6 text-sm">
      <Row label="Cena zakupu na aukcji" value={pln(result.price)} note={priceNote} />
      <Row label="Opłaty aukcyjne" value={pln(result.auctionFees)} note={feeNote} />
      <Row label="Transport w USA" value={pln(result.usTransport)} />
      <Row label="Transport morski do Kłajpedy" value={pln(result.seaFreight)} />
      {result.insurance > 0 && (
        <Row label="Ubezpieczenie transportu" value={pln(result.insurance)} />
      )}
      <Row
        label="Cło w Litwie"
        value={pln(result.duty)}
        note={`${percent(result.dutyRate)} × wartość celna ${pln(result.customsValue)}`}
      />
      <Row
        label="VAT importowy w Litwie"
        value={pln(result.vat)}
        note={`${percent(result.vatRate)} × podstawa ${pln(result.vatBase)}`}
      />
      <Row label="Obsługa portowa i celna" value={pln(result.portService)} />
      <Row label="Transport z Litwy do Polski" value={pln(result.transportToPl)} />
      <Row
        label="Akcyza w Polsce"
        value={pln(result.excise)}
        note={exciseNote(result, form)}
      />
      <Row label="Pozostałe koszty" value={pln(result.other)} />
    </dl>
  );
}

function Row({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={accent ? "text-gold-light" : "text-white/75"}>
        {label}
        {note && <span className="mt-0.5 block text-xs text-mist">{note}</span>}
      </dt>
      <dd className={`shrink-0 text-right ${accent ? "text-gold-light" : "text-white"}`}>
        {value}
      </dd>
    </div>
  );
}
