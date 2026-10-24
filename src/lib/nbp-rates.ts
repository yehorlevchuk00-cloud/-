// Курсы NBP (таблица A) — запрашиваются из браузера: API отдаёт CORS-заголовок,
// поэтому серверные маршруты не нужны и решение совместимо со static export.

export type NbpCurrency = "USD" | "EUR";

export type NbpRate = {
  code: NbpCurrency;
  /** Средний курс NBP, PLN за 1 единицу валюты */
  mid: number;
  /** Дата публикации таблицы, YYYY-MM-DD */
  effectiveDate: string;
};

const ENDPOINT = "https://api.nbp.pl/api/exchangerates/rates/A";
const TIMEOUT_MS = 8000;

/**
 * Таблица A не публикуется в выходные и праздники, поэтому последний курс может быть
 * на несколько дней старше сегодняшней даты. Самые длинные перерывы (Пасха, Рождество
 * с выходными) — до 4–5 дней; предупреждаем только после 7 дней.
 */
export const STALE_AFTER_DAYS = 7;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Количество полных суток между датой курса и сегодняшним днём (по локальной дате браузера) */
export function daysSince(effectiveDate: string, now = new Date()) {
  const [year, month, day] = effectiveDate.split("-").map(Number);
  const rateDay = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - rateDay) / 86_400_000);
}

/** Проверка ответа NBP: валюта, таблица, число и дата должны быть корректными */
export function parseNbpResponse(code: NbpCurrency, data: unknown, now = new Date()): NbpRate {
  const body = data as {
    table?: unknown;
    code?: unknown;
    rates?: { mid?: unknown; effectiveDate?: unknown }[];
  };
  const rate = Array.isArray(body?.rates) ? body.rates[0] : undefined;

  if (body?.table !== "A" || body?.code !== code || !rate) {
    throw new Error("Nieoczekiwana odpowiedź NBP");
  }

  const { mid, effectiveDate } = rate;
  // Разумные границы для USD и EUR к PLN — защита от явно ошибочных данных
  if (typeof mid !== "number" || !Number.isFinite(mid) || mid <= 0.5 || mid >= 20) {
    throw new Error("Nieprawidłowy kurs w odpowiedzi NBP");
  }
  if (typeof effectiveDate !== "string" || !DATE.test(effectiveDate)) {
    throw new Error("Nieprawidłowa data w odpowiedzi NBP");
  }
  const [year, month, day] = effectiveDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error("Nieprawidłowa data w odpowiedzi NBP");
  }
  // Дата из будущего (с запасом на часовые пояса) — признак ошибки
  if (daysSince(effectiveDate, now) < -1) {
    throw new Error("Data kursu NBP jest z przyszłości");
  }

  return { code, mid, effectiveDate };
}

export async function fetchNbpRate(code: NbpCurrency): Promise<NbpRate> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ENDPOINT}/${code}/?format=json`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`NBP odpowiedział błędem ${response.status}`);
    return parseNbpResponse(code, await response.json());
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Przekroczono czas oczekiwania na NBP");
    }
    if (error instanceof TypeError) throw new Error("Brak połączenia z NBP");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** 2026-10-23 → 23.10.2026 */
export function formatRateDate(effectiveDate: string) {
  const [year, month, day] = effectiveDate.split("-");
  return `${day}.${month}.${year}`;
}

/** Курс для поля ввода: 4 знака после запятой, польский десятичный разделитель */
export function formatRate(mid: number) {
  return mid.toFixed(4).replace(".", ",");
}
