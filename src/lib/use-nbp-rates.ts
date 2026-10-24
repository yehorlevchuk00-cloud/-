"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  daysSince,
  fetchNbpRate,
  STALE_AFTER_DAYS,
  type NbpCurrency,
  type NbpRate,
} from "@/lib/nbp-rates";

export type NbpRateState = {
  /** Последний корректно полученный курс; null — курса нет */
  rate: NbpRate | null;
  /** Ошибка последней попытки; при ошибке обновления прежний курс NBP сохраняется */
  error: string | null;
  /** Курс старше STALE_AFTER_DAYS дней — выходные и праздники сюда не попадают */
  stale: boolean;
};

export type NbpRatesState = {
  loading: boolean;
  USD: NbpRateState;
  EUR: NbpRateState;
  refresh: () => void;
};

const currencies: NbpCurrency[] = ["USD", "EUR"];
const empty: NbpRateState = { rate: null, error: null, stale: false };

/** Загружает курсы NBP при монтировании и по запросу; валюты обрабатываются независимо */
export function useNbpRates(): NbpRatesState {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<NbpCurrency, NbpRateState>>({
    USD: empty,
    EUR: empty,
  });
  // Ответы устаревших запросов (повторное нажатие, размонтирование) игнорируются
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const results = await Promise.allSettled(currencies.map((code) => fetchNbpRate(code)));
    if (id !== requestId.current) return;

    const now = new Date();
    setRates((previous) => {
      const next = { ...previous };
      results.forEach((result, index) => {
        const code = currencies[index];
        next[code] =
          result.status === "fulfilled"
            ? {
                rate: result.value,
                error: null,
                stale: daysSince(result.value.effectiveDate, now) > STALE_AFTER_DAYS,
              }
            : {
                ...previous[code],
                error: result.reason instanceof Error ? result.reason.message : "Błąd NBP",
              };
      });
      return next;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const requests = requestId;
    void load();
    // После размонтирования ответ уже начатого запроса будет проигнорирован
    return () => {
      requests.current++;
    };
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  return { loading, ...rates, refresh };
}
