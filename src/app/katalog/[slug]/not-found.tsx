import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function CarNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center py-40">
        <div className="mx-auto w-full max-w-7xl px-5 text-center sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">404</p>
          <h1 className="mt-6 font-display text-4xl font-medium sm:text-6xl">
            Nie znaleziono samochodu
          </h1>
          <p className="mx-auto mt-6 max-w-md leading-7 text-mist">
            Ta przykładowa oferta nie istnieje lub została usunięta z katalogu.
          </p>
          <Link
            href="/katalog"
            className="mt-10 inline-flex items-center justify-center bg-[linear-gradient(135deg,#d4b47a,#b8955a)] px-8 py-4 text-sm font-medium tracking-[0.06em] text-ink transition-[filter] duration-500 ease-luxe hover:brightness-110"
          >
            Wróć do katalogu
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
