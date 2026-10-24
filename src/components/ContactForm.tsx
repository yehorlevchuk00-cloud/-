"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  budgetOptions,
  LIMITS,
  PRIVACY_POLICY_HREF,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from "@/lib/contact";

const fieldClass =
  "w-full rounded-none border border-line bg-graphite-800 px-4 py-3 text-sm text-white placeholder:text-white/25 transition-colors duration-500 ease-luxe hover:border-gold/50 focus-visible:border-gold aria-[invalid=true]:border-red-400/70";

const selectClass = `${fieldClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a961' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10`;

const labelClass = "block text-[11px] font-medium uppercase tracking-[0.22em] text-mist";

// Порядок полей — для фокуса на первой ошибке
const fieldOrder: ContactField[] = ["name", "phone", "email", "contact", "car", "budget", "message", "consent"];

const fieldIds: Record<ContactField, string> = {
  name: "kontakt-imie",
  phone: "kontakt-telefon",
  email: "kontakt-email",
  contact: "kontakt-telefon",
  car: "kontakt-samochod",
  budget: "kontakt-budzet",
  message: "kontakt-wiadomosc",
  consent: "kontakt-zgoda",
};

const summaryLabels: [keyof ContactValues, string][] = [
  ["name", "Imię"],
  ["phone", "Telefon"],
  ["email", "E-mail"],
  ["car", "Samochód"],
  ["budget", "Budżet"],
  ["message", "Wiadomość"],
];

export function ContactForm({
  initialCar = "",
  fromCatalog = false,
}: {
  initialCar?: string;
  /** Автомобиль выбран на странице каталога — это демонстрационное предложение */
  fromCatalog?: boolean;
}) {
  const [values, setValues] = useState<ContactValues>({
    name: "",
    phone: "",
    email: "",
    car: initialCar,
    budget: "",
    message: "",
    consent: false,
  });
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [demoResult, setDemoResult] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const allErrors = validateContact(values);
  // До первой попытки отправки показываем ошибки только у полей, которые человек уже покинул
  const visible = (field: ContactField) => (attempted || touched[field] ? allErrors[field] : undefined);
  const contactError =
    attempted || (touched.phone && touched.email) ? allErrors.contact : undefined;

  const set = <K extends keyof ContactValues>(key: K, value: ContactValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const touch = (field: ContactField) => () => setTouched((current) => ({ ...current, [field]: true }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    const errors: ContactErrors = validateContact(values);
    const first = fieldOrder.find((field) => errors[field]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${fieldIds[first]}`)?.focus();
      return;
    }

    // Демонстрационный режим: отправка не подключена, данные остаются только в этом окне браузера
    setDemoResult(true);
  };

  if (demoResult) {
    return (
      <div role="status" className="border border-gold/40 bg-gold/5 p-6 sm:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
          Tryb demonstracyjny
        </p>
        <p className="mt-4 font-display text-3xl leading-tight font-medium">
          Zgłoszenie nie zostało wysłane
        </p>
        <p className="mt-4 leading-7 text-white/80">
          Formularz jest wypełniony poprawnie, ale wysyłanie zgłoszeń nie jest jeszcze
          uruchomione. Twoje dane nie zostały nigdzie przesłane ani zapisane — widzisz je
          tylko w tym oknie przeglądarki.
        </p>

        <dl className="mt-8 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          {summaryLabels
            .filter(([key]) => String(values[key]).trim())
            .map(([key, label]) => (
              <div key={key} className="contents">
                <dt className="text-mist">{label}</dt>
                <dd className="break-words whitespace-pre-line text-white/90">
                  {String(values[key]).trim()}
                </dd>
              </div>
            ))}
        </dl>

        <button
          type="button"
          onClick={() => setDemoResult(false)}
          className="mt-8 border border-gold/60 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors duration-500 ease-luxe hover:bg-gold hover:text-ink"
        >
          Wróć do formularza
        </button>
      </div>
    );
  }

  const errorCount = fieldOrder.filter((field) => field !== "contact" && allErrors[field]).length +
    (allErrors.contact ? 1 : 0);

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-7">
      <p className="border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-5 text-gold-light">
        Formularz działa w trybie demonstracyjnym — wysyłanie zgłoszeń uruchomimy wkrótce.
        Dane z formularza nie są nigdzie przesyłane ani zapisywane.
      </p>

      {attempted && errorCount > 0 && (
        <p role="alert" className="border-l-2 border-red-400/70 pl-4 text-sm text-red-300">
          {errorCount === 1
            ? "Popraw 1 zaznaczone pole."
            : `Popraw zaznaczone pola (${errorCount}).`}
        </p>
      )}

      <Field id={fieldIds.name} label="Imię" required error={visible("name")}>
        <input
          id={fieldIds.name}
          name="name"
          autoComplete="given-name"
          maxLength={LIMITS.name}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          onBlur={touch("name")}
          aria-required="true"
          aria-invalid={Boolean(visible("name"))}
          aria-describedby={visible("name") ? `${fieldIds.name}-error` : undefined}
          className={fieldClass}
        />
      </Field>

      <fieldset>
        <legend className="text-sm text-white/80">
          Sposób kontaktu <span className="text-mist">— podaj telefon, e-mail lub oba</span>
        </legend>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <Field id={fieldIds.phone} label="Telefon" error={visible("phone")}>
            <input
              id={fieldIds.phone}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+48 600 000 000"
              value={values.phone}
              onChange={(event) => set("phone", event.target.value)}
              onBlur={touch("phone")}
              aria-invalid={Boolean(visible("phone") || contactError)}
              aria-describedby={
                [visible("phone") && `${fieldIds.phone}-error`, contactError && "kontakt-sposob-error"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className={fieldClass}
            />
          </Field>
          <Field id={fieldIds.email} label="E-mail" error={visible("email")}>
            <input
              id={fieldIds.email}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jan@przyklad.pl"
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
              onBlur={touch("email")}
              aria-invalid={Boolean(visible("email") || contactError)}
              aria-describedby={
                [visible("email") && `${fieldIds.email}-error`, contactError && "kontakt-sposob-error"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className={fieldClass}
            />
          </Field>
        </div>
        {contactError && (
          <p id="kontakt-sposob-error" className="mt-3 text-xs text-red-300">
            {contactError}
          </p>
        )}
      </fieldset>

      <Field
        id={fieldIds.car}
        label="Interesujący samochód"
        optional
        error={visible("car")}
        hint={
          fromCatalog && values.car === initialCar
            ? "Wybrano z katalogu — przykładowa oferta. Możesz zmienić opis."
            : "Marka, model, rocznik lub link do aukcji."
        }
      >
        <input
          id={fieldIds.car}
          name="car"
          maxLength={LIMITS.car}
          placeholder="Np. Ford Mustang GT, 2019"
          value={values.car}
          onChange={(event) => set("car", event.target.value)}
          onBlur={touch("car")}
          aria-invalid={Boolean(visible("car"))}
          aria-describedby={
            visible("car") ? `${fieldIds.car}-error` : `${fieldIds.car}-hint`
          }
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={fieldIds.budget} label="Budżet" optional error={visible("budget")}>
          <select
            id={fieldIds.budget}
            name="budget"
            value={values.budget}
            onChange={(event) => set("budget", event.target.value)}
            onBlur={touch("budget")}
            aria-invalid={Boolean(visible("budget"))}
            className={selectClass}
          >
            <option value="">Wybierz</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        id={fieldIds.message}
        label="Wiadomość"
        optional
        error={visible("message")}
        hint={`${values.message.length} / ${LIMITS.message} znaków`}
      >
        <textarea
          id={fieldIds.message}
          name="message"
          rows={5}
          maxLength={LIMITS.message}
          placeholder="Np. preferowany termin, wyposażenie, pytania o import"
          value={values.message}
          onChange={(event) => set("message", event.target.value)}
          onBlur={touch("message")}
          aria-invalid={Boolean(visible("message"))}
          aria-describedby={
            visible("message") ? `${fieldIds.message}-error` : `${fieldIds.message}-hint`
          }
          className={`${fieldClass} resize-y`}
        />
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-white/75">
          <input
            id={fieldIds.consent}
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={(event) => {
              set("consent", event.target.checked);
              touch("consent")();
            }}
            aria-required="true"
            aria-invalid={Boolean(visible("consent"))}
            aria-describedby={visible("consent") ? `${fieldIds.consent}-error` : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-[#c9a961]"
          />
          <span>
            Wyrażam zgodę na przetwarzanie moich danych osobowych w celu odpowiedzi na
            zapytanie. Szczegóły znajdziesz w{" "}
            <Link
              href={PRIVACY_POLICY_HREF}
              className="text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-light"
            >
              polityce prywatności
            </Link>
            . <span className="text-mist">*</span>
          </span>
        </label>
        {visible("consent") && (
          <p id={`${fieldIds.consent}-error`} className="mt-2 pl-7 text-xs text-red-300">
            {visible("consent")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-4 bg-[linear-gradient(135deg,#d4b47a,#b8955a)] px-8 py-4 text-sm font-medium tracking-[0.06em] text-ink transition-[filter] duration-500 ease-luxe hover:brightness-110"
        >
          Wyślij zapytanie
        </button>
        <p className="text-xs text-mist">
          <span aria-hidden="true">*</span> Pola wymagane: imię, telefon lub e-mail, zgoda.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  optional,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-gold"> *</span>}
        {optional && <span className="normal-case tracking-normal"> (opcjonalnie)</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-xs text-mist">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
