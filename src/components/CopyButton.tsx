"use client";

import { useEffect, useRef, useState } from "react";

/** Запасной путь для браузеров без Clipboard API или вне безопасного контекста */
function copyWithTextarea(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  return ok;
}

/** Кнопка копирования значения с коротким подтверждением «Skopiowano» */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      ok = copyWithTextarea(value);
    }
    setState(ok ? "copied" : "error");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded border border-gold/30 px-2.5 py-1.5 text-[11px] font-medium tracking-[0.06em] text-gold-light transition-colors duration-300 ease-luxe hover:border-gold/60 hover:bg-gold/10"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.5]"
        aria-hidden="true"
      >
        {state === "copied" ? (
          <path d="m5 12 5 5L20 7" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="1.5" />
            <path d="M5 15V5a1 1 0 0 1 1-1h10" />
          </>
        )}
      </svg>
      <span aria-live="polite">
        {state === "copied" ? "Skopiowano" : state === "error" ? "Nie udało się" : "Kopiuj"}
      </span>
    </button>
  );
}
