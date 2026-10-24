import Image, { getImageProps } from "next/image";

export type ImageFile = {
  /** Путь к файлу в папке public, например "/hero/porsche-hero-desktop.webp" */
  src: string;
  /** Реальные размеры файла в пикселях */
  width: number;
  height: number;
};

export type HeroPhoto = ImageFile & {
  alt: string;
  /** Необязательная отдельная версия для телефонов */
  mobile?: ImageFile;
};

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Фон hero: графитовая студия с мягким светом справа.
 * С фотографией (только на компьютере) снимок занимает всю ширину hero и прижат к низу,
 * поэтому автомобиль никогда не обрезается спереди и сзади. Верх снимка плавно
 * растворяется в графитовом фоне, а затемнение слева и сверху держит читаемость текста.
 */
export function HeroBackdrop({ photo }: { photo?: HeroPhoto }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1d1d20_0%,#151517_55%,#0c0c0d_100%)]" />
      {/* Софтбокс справа сверху, как в утверждённом макете */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_88%_22%,rgba(255,255,255,0.10),transparent_70%)]" />

      {photo ? (
        <>
          <DesktopPhoto photo={photo} />
          <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(12,12,13,0.75),rgba(12,12,13,0.15)_50%,transparent)] lg:block" />
          <div className="absolute inset-x-0 top-0 hidden h-1/2 bg-[linear-gradient(to_bottom,rgba(12,12,13,0.6),transparent)] lg:block" />
        </>
      ) : (
        <>
          {/* Пол студии с мягким отражением света */}
          <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.045)_20%,rgba(255,255,255,0.015)_60%,transparent)]" />
          <div className="absolute inset-x-[10%] bottom-[4%] h-[22%] bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.06),transparent_70%)]" />
        </>
      )}
    </div>
  );
}

/** Фото для компьютеров: через <picture>, чтобы телефоны не скачивали большой файл. */
function DesktopPhoto({ photo }: { photo: HeroPhoto }) {
  const {
    props: { srcSet },
  } = getImageProps({
    src: photo.src,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    sizes: "100vw",
    quality: 90,
  });

  return (
    <picture className="absolute inset-x-0 bottom-0 hidden lg:block">
      <source media="(min-width: 1024px)" srcSet={srcSet} sizes="100vw" />
      <img
        src={TRANSPARENT_PIXEL}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        fetchPriority="high"
        className="hero-photo-fade block h-auto w-full"
      />
    </picture>
  );
}

/**
 * Нижняя половина hero, где стоит автомобиль.
 * На компьютере — пустое место над фоновым фото; на телефоне — фото целиком
 * (по ширине экрана, без обрезки). Без фото — нейтральная рамка-заглушка.
 */
export function HeroCarSlot({ photo }: { photo?: HeroPhoto }) {
  if (photo) {
    const file = photo.mobile ?? photo;
    return (
      <div className="flex w-full flex-1 flex-col justify-end">
        <Image
          src={file.src}
          alt={photo.alt}
          width={file.width}
          height={file.height}
          sizes="100vw"
          quality={85}
          className="hero-photo-fade-mobile block h-auto w-full lg:hidden"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1">
      <div
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[10%] h-[8%] rounded-[50%] bg-black/60 blur-xl"
      />
      <div className="absolute inset-x-5 top-[8%] bottom-[14%] flex items-center justify-center border border-dashed border-white/10 sm:inset-x-[10%]">
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/30">
          Miejsce na zdjęcie samochodu
        </span>
      </div>
    </div>
  );
}
