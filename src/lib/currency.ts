import { supabase } from "@/integrations/supabase/client";

export interface LocalCurrency {
  code: string;
  symbol: string;
  rate: number;
  locale: string;
}

let cache: Record<string, LocalCurrency> | null = null;
let loadingPromise: Promise<Record<string, LocalCurrency>> | null = null;
const listeners = new Set<() => void>();

async function fetchRates(): Promise<Record<string, LocalCurrency>> {
  const { data, error } = await supabase.from("currency_rates").select("country,code,symbol,rate,locale");
  const map: Record<string, LocalCurrency> = {};
  if (!error && data) {
    for (const r of data as Array<{ country: string; code: string; symbol: string; rate: number; locale: string }>) {
      map[r.country.toUpperCase()] = { code: r.code, symbol: r.symbol, rate: Number(r.rate), locale: r.locale };
    }
  }
  return map;
}

export function loadCurrencyRates() {
  if (cache) return Promise.resolve(cache);
  if (loadingPromise) return loadingPromise;
  loadingPromise = fetchRates().then((m) => {
    cache = m;
    listeners.forEach((l) => l());
    return m;
  });
  return loadingPromise;
}

export function refreshCurrencyRates() {
  cache = null;
  loadingPromise = null;
  return loadCurrencyRates();
}

export function subscribeCurrencyRates(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLocalCurrency(country: string | null | undefined): LocalCurrency | null {
  if (!country || !cache) return null;
  return cache[country.toUpperCase()] ?? null;
}

export function formatUSD(amount: number): string {
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export function formatLocal(usd: number, c: LocalCurrency): string {
  const v = Math.round(usd * c.rate);
  return `${v.toLocaleString(c.locale)} ${c.symbol}`;
}
