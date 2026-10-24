import Link from "next/link";
import { PRIVACY_POLICY_HREF } from "@/lib/contact";
import { navLinks } from "@/lib/navigation";

const container = "mx-auto w-full max-w-7xl px-5 sm:px-8";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-graphite-900">
      <div className={`${container} grid gap-12 py-16 md:grid-cols-[2fr_1fr]`}>
        <div>
          <p className="text-sm font-semibold tracking-[0.35em]">
            USA AUTO <span className="text-gold">IMPORT</span>
          </p>
          <p className="mt-6 max-w-sm leading-7 text-mist">
            Import samochodów z aukcji w USA do Polski. Dane kontaktowe i
            informacje o firmie zostaną uzupełnione wkrótce.
          </p>
        </div>
        <nav aria-label="Nawigacja w stopce">
          <ul className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-mist transition-colors duration-500 hover:text-gold-light"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className={`${container} flex flex-col gap-3 py-6 text-xs text-mist sm:flex-row sm:justify-between`}>
          <p>© USA AUTO IMPORT. Wszystkie prawa zastrzeżone.</p>
          <Link href={PRIVACY_POLICY_HREF} className="transition-colors hover:text-gold-light">
            Polityka prywatności
          </Link>
        </div>
      </div>
    </footer>
  );
}
