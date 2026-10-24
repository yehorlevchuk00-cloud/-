"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/navigation";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Пока мобильное меню открыто: закрытие по Escape, блокировка прокрутки,
  // автозакрытие при переходе на широкий экран.
  useEffect(() => {
    if (!menuOpen) return;

    const close = () => setMenuOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const desktop = window.matchMedia("(min-width: 768px)");

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", close);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", close);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-700 ease-luxe ${
        solid
          ? "border-line bg-ink/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/#top"
          className="group flex items-baseline gap-2 text-sm font-semibold tracking-[0.35em] text-white"
          onClick={() => setMenuOpen(false)}
        >
          USA AUTO
          <span className="text-gold transition-colors duration-500 group-hover:text-gold-light">
            IMPORT
          </span>
        </Link>

        <nav aria-label="Główna nawigacja" className="hidden md:block">
          <ul className="flex items-center gap-6 xl:gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group relative py-2 text-sm text-mist transition-colors duration-500 hover:text-white"
                >
                  {link.label}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 ease-luxe group-hover:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/kalkulator"
          className="hidden rounded-full border border-gold/60 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors duration-500 ease-luxe hover:bg-gold hover:text-ink lg:inline-flex"
        >
          Oblicz koszt
        </Link>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className={`absolute h-px w-5 bg-white transition-transform duration-500 ease-luxe ${
              menuOpen ? "rotate-45" : "-translate-y-1"
            }`}
          />
          <span
            className={`absolute h-px w-5 bg-white transition-transform duration-500 ease-luxe ${
              menuOpen ? "-rotate-45" : "translate-y-1"
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobilne"
          className="h-[calc(100svh-5rem)] border-t border-line bg-ink px-5 pt-10 md:hidden"
        >
          <ul className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 font-display text-4xl text-white transition-colors hover:text-gold-light"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/kalkulator"
            className="mt-10 inline-flex rounded-full bg-gold px-8 py-4 text-sm font-medium uppercase tracking-[0.18em] text-ink"
            onClick={() => setMenuOpen(false)}
          >
            Oblicz koszt
          </Link>
        </nav>
      )}
    </header>
  );
}
