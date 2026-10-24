import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Polityka prywatności — USA AUTO IMPORT",
  description: "Polityka prywatności USA AUTO IMPORT jest w przygotowaniu.",
};

// Временная страница: настоящая политика конфиденциальности появится после подготовки юристом.
export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main id="tresc" className="flex flex-1 items-center py-40">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-gold">
            <span className="h-px w-10 bg-gold/60" aria-hidden="true" />
            Dokumenty
          </p>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-medium sm:text-6xl">
            Polityka prywatności
          </h1>
          <p className="mt-8 text-lg leading-8 text-white/75">
            Dokument jest w przygotowaniu i zostanie opublikowany przed uruchomieniem
            wysyłania zgłoszeń przez formularz kontaktowy.
          </p>
          <p className="mt-4 leading-7 text-mist">
            Obecnie formularz działa w trybie demonstracyjnym — wpisane dane nie są nigdzie
            przesyłane ani zapisywane.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex text-sm text-gold transition-colors hover:text-gold-light"
          >
            ← Wróć do formularza kontaktowego
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
