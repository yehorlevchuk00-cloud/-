import Image from "next/image";

type CardPhoto = {
  /** Путь к файлу в папке public */
  src: string;
  alt: string;
};

/**
 * Нейтральная «студийная» область под фото автомобиля в карточке.
 * Когда появится фотография с подтверждёнными правами, передайте её в `photo`.
 */
export function CarPhotoSlot({ photo }: { photo?: CardPhoto }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#26262a,#18181b_62%,#111113)]">
      {/* Мягкий верхний свет, ярче при наведении на карточку */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,255,255,0.07),transparent_70%)] opacity-80 transition-opacity duration-700 ease-luxe group-hover:opacity-100"
      />
      {/* Линия горизонта студийного пола */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[62%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-white/30">
          Miejsce na zdjęcie
        </span>
      )}
    </div>
  );
}
