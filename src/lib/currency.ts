// Local currency mapping for African countries.
// Rates are approximate USD -> local. Used for display only.
export interface LocalCurrency {
  code: string;
  symbol: string;
  rate: number; // 1 USD = rate * local
  locale: string;
}

const MAP: Record<string, LocalCurrency> = {
  // CFA franc zone (XOF)
  SN: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  CI: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  ML: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  BF: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  BJ: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  TG: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  NE: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  GW: { code: "XOF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  // Central Africa CFA (XAF)
  CM: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  GA: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  CG: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  TD: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  CF: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  GQ: { code: "XAF", symbol: "FCFA", rate: 605, locale: "fr-FR" },
  // Other
  NG: { code: "NGN", symbol: "₦", rate: 1550, locale: "en-NG" },
  GH: { code: "GHS", symbol: "₵", rate: 15, locale: "en-GH" },
  KE: { code: "KES", symbol: "KSh", rate: 129, locale: "en-KE" },
  ZA: { code: "ZAR", symbol: "R", rate: 18, locale: "en-ZA" },
  MA: { code: "MAD", symbol: "DH", rate: 10, locale: "fr-MA" },
  EG: { code: "EGP", symbol: "E£", rate: 49, locale: "en-EG" },
  TN: { code: "TND", symbol: "DT", rate: 3.1, locale: "fr-TN" },
  DZ: { code: "DZD", symbol: "DA", rate: 134, locale: "fr-DZ" },
  RW: { code: "RWF", symbol: "FRw", rate: 1380, locale: "en-RW" },
  UG: { code: "UGX", symbol: "USh", rate: 3700, locale: "en-UG" },
  TZ: { code: "TZS", symbol: "TSh", rate: 2600, locale: "en-TZ" },
  ET: { code: "ETB", symbol: "Br", rate: 124, locale: "en-ET" },
};

export function getLocalCurrency(country: string | null | undefined): LocalCurrency | null {
  if (!country) return null;
  return MAP[country.toUpperCase()] ?? null;
}

export function formatUSD(amount: number): string {
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export function formatLocal(usd: number, c: LocalCurrency): string {
  const v = Math.round(usd * c.rate);
  return `${v.toLocaleString(c.locale)} ${c.symbol}`;
}
