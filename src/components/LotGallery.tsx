"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CarPhotoSlot } from "@/components/CarPhotoSlot";
import type { CarPhoto } from "@/lib/catalog";

const placeholderViews = ["Przód", "Tył", "Wnętrze", "Uszkodzenia"];

const frame =
  "rounded-md border border-white/10 bg-[#0e0e10] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.9)]";

const thumbSize = "w-[calc((100%-1.5rem)/4)] min-w-[4.5rem] shrink-0 snap-start";

/**
 * Галерея лота: крупное фото, полоса миниатюр и просмотр в увеличенном виде.
 * Пока фотографий нет — нейтральные заглушки без интерактивности и без увеличения.
 */
export function LotGallery({ photos, title }: { photos: CarPhoto[]; title: string }) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const mainButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const count = photos.length;
  const current = photos[Math.min(active, count - 1)];
  const step = (delta: number) => setActive((index) => (index + delta + count) % count);

  // Открытый просмотр: Escape и стрелки, блокировка прокрутки, возврат фокуса после закрытия
  useEffect(() => {
    if (!viewerOpen) return;
    const trigger = mainButton.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
      if (event.key === "ArrowRight") setActive((index) => (index + 1) % count);
      if (event.key === "ArrowLeft") setActive((index) => (index - 1 + count) % count);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [viewerOpen, count]);

  return (
    <section aria-label={`Galeria: ${title}`} className="min-w-0">
      <div
        className={`group relative aspect-[16/10] overflow-hidden ${frame} transition-[border-color,box-shadow] duration-500 ease-luxe hover:border-gold/35 hover:shadow-[0_0_0_1px_rgba(201,169,97,0.12),0_24px_48px_-28px_rgba(0,0,0,0.9)]`}
      >
        {current ? (
          <button
            ref={mainButton}
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Powiększ zdjęcie ${active + 1} z ${count}`}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-contain"
            />
            <span className="absolute right-4 bottom-4 rounded border border-white/15 bg-ink/70 px-2.5 py-1 text-[11px] text-white/80">
              {active + 1} / {count} · Powiększ
            </span>
          </button>
        ) : (
          <CarPhotoSlot />
        )}
        <span className="pointer-events-none absolute top-4 left-4 border border-gold/40 bg-ink/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gold-light">
          Przykładowa oferta
        </span>
      </div>

      <ul
        aria-label={count > 0 ? "Miniatury zdjęć" : undefined}
        className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1"
      >
        {count > 0
          ? photos.map((photo, index) => (
              <li key={photo.src} className={thumbSize}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Pokaż zdjęcie ${index + 1}`}
                  aria-current={index === active}
                  className={`relative block aspect-[4/3] w-full overflow-hidden rounded border transition-[border-color,box-shadow] duration-300 ease-luxe ${
                    index === active
                      ? "border-gold shadow-[0_0_0_1px_rgba(201,169,97,0.45)]"
                      : "border-white/10 hover:border-gold/40"
                  }`}
                >
                  <Image src={photo.src} alt="" fill sizes="160px" className="object-cover" />
                </button>
              </li>
            ))
          : placeholderViews.map((view) => (
              <li
                key={view}
                className={`${thumbSize} relative aspect-[4/3] overflow-hidden rounded border border-white/10`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#26262a,#18181b_62%,#111113)]" />
                <span className="absolute inset-x-0 bottom-2 text-center text-[9px] uppercase tracking-[0.08em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]">
                  {view}
                </span>
              </li>
            ))}
      </ul>
      {count === 0 && (
        <p className="mt-1.5 text-xs text-mist">
          Zdjęcia zostaną dodane po podłączeniu danych z aukcji.
        </p>
      )}

      {viewerOpen && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Zdjęcie ${active + 1} z ${count}: ${title}`}
          className="fixed inset-0 z-[70] flex flex-col bg-black/90"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewerOpen(false);
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 text-sm text-white/70">
            <span>
              {active + 1} / {count}
            </span>
            <button
              ref={closeButton}
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label="Zamknij podgląd"
              className="flex h-10 w-10 items-center justify-center rounded border border-white/20 text-lg text-white transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
            >
              ✕
            </button>
          </div>

          <div className="relative mx-4 mb-4 flex-1 sm:mx-16">
            <Image src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Poprzednie zdjęcie"
                className="absolute top-1/2 left-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded border border-white/20 bg-black/50 text-white transition-colors duration-300 hover:border-gold/60 hover:text-gold-light sm:left-4"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Następne zdjęcie"
                className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded border border-white/20 bg-black/50 text-white transition-colors duration-300 hover:border-gold/60 hover:text-gold-light sm:right-4"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
