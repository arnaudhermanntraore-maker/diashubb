import { useEffect, useState } from "react";
import { getRates, type RateRow } from "@/server/rates.functions";
import { CURRENCIES } from "@/lib/currencies";

export interface LiveRatesState {
  rates: Record<string, { rate: number; trend: number }>;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
}

// Fallback to hardcoded rates if API fails
const fallback: Record<string, { rate: number; trend: number }> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, { rate: c.rate, trend: c.trend }])
);

let cache: { data: LiveRatesState; ts: number } | null = null;
const TTL = 60 * 60 * 1000; // 1h

export function useLiveRates(): LiveRatesState {
  const [state, setState] = useState<LiveRatesState>(() =>
    cache && Date.now() - cache.ts < TTL
      ? cache.data
      : { rates: fallback, updatedAt: null, loading: true, error: null }
  );

  useEffect(() => {
    let cancelled = false;
    if (cache && Date.now() - cache.ts < TTL) {
      setState(cache.data);
      return;
    }
    (async () => {
      try {
        const { rates, updatedAt } = await getRates();
        if (cancelled) return;
        const map: Record<string, { rate: number; trend: number }> = { ...fallback };
        for (const r of rates as RateRow[]) {
          map[r.currency_code] = { rate: Number(r.rate_from_usd), trend: Number(r.trend_24h) };
        }
        const next: LiveRatesState = { rates: map, updatedAt, loading: false, error: null };
        cache = { data: next, ts: Date.now() };
        setState(next);
      } catch (e: any) {
        if (cancelled) return;
        setState({ rates: fallback, updatedAt: null, loading: false, error: e?.message ?? "load_failed" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

export function liveRate(state: LiveRatesState, code: string): { rate: number; trend: number } {
  return state.rates[code] ?? fallback[code] ?? { rate: 0, trend: 0 };
}
