export interface CountryEntry {
  code: string;
  name: string;
  flag: string;
  popular?: boolean;
}
export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  trend: number; // 24h, e.g. 0.001 = +0.1%
  countries: CountryEntry[];
}

export const CURRENCIES: CurrencyEntry[] = [
  { code: "XOF", name: "Franc CFA (UEMOA)", symbol: "FCFA", rate: 655.42, trend: 0.001, countries: [
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", popular: true },
    { code: "SN", name: "Sénégal", flag: "🇸🇳", popular: true },
    { code: "ML", name: "Mali", flag: "🇲🇱" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
    { code: "TG", name: "Togo", flag: "🇹🇬" },
    { code: "BJ", name: "Bénin", flag: "🇧🇯" },
    { code: "NE", name: "Niger", flag: "🇳🇪" },
    { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼" },
  ]},
  { code: "XAF", name: "Franc CFA (CEMAC)", symbol: "FCFA", rate: 655.96, trend: 0.001, countries: [
    { code: "CM", name: "Cameroun", flag: "🇨🇲" },
    { code: "GA", name: "Gabon", flag: "🇬🇦" },
    { code: "CG", name: "Congo", flag: "🇨🇬" },
    { code: "TD", name: "Tchad", flag: "🇹🇩" },
    { code: "CF", name: "Centrafrique", flag: "🇨🇫" },
    { code: "GQ", name: "Guinée Équatoriale", flag: "🇬🇶" },
  ]},
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", rate: 15.82, trend: -0.003, countries: [{ code: "GH", name: "Ghana", flag: "🇬🇭", popular: true }] },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rate: 1587.5, trend: 0.012, countries: [{ code: "NG", name: "Nigeria", flag: "🇳🇬", popular: true }] },
  { code: "MAD", name: "Dirham marocain", symbol: "DH", rate: 10.12, trend: 0, countries: [{ code: "MA", name: "Maroc", flag: "🇲🇦" }] },
  { code: "TND", name: "Dinar tunisien", symbol: "DT", rate: 3.12, trend: -0.001, countries: [{ code: "TN", name: "Tunisie", flag: "🇹🇳" }] },
  { code: "DZD", name: "Dinar algérien", symbol: "DA", rate: 134.75, trend: 0.002, countries: [{ code: "DZ", name: "Algérie", flag: "🇩🇿" }] },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rate: 129.5, trend: -0.005, countries: [{ code: "KE", name: "Kenya", flag: "🇰🇪" }] },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", rate: 1318, trend: 0, countries: [{ code: "RW", name: "Rwanda", flag: "🇷🇼" }] },
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs", rate: 45.8, trend: 0.001, countries: [{ code: "MU", name: "Maurice", flag: "🇲🇺" }] },
  { code: "MRU", name: "Ouguiya mauritanien", symbol: "UM", rate: 39.2, trend: 0, countries: [{ code: "MR", name: "Mauritanie", flag: "🇲🇷" }] },
  { code: "MGA", name: "Ariary malgache", symbol: "Ar", rate: 4512, trend: 0.003, countries: [{ code: "MG", name: "Madagascar", flag: "🇲🇬" }] },
  { code: "ZAR", name: "South African Rand", symbol: "R", rate: 18.45, trend: 0.008, countries: [{ code: "ZA", name: "Afrique du Sud", flag: "🇿🇦" }] },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rate: 2648, trend: 0.002, countries: [{ code: "TZ", name: "Tanzanie", flag: "🇹🇿" }] },
  { code: "GNF", name: "Franc guinéen", symbol: "FG", rate: 8620, trend: 0, countries: [{ code: "GN", name: "Guinée", flag: "🇬🇳" }] },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", rate: 113.5, trend: 0, countries: [{ code: "ET", name: "Éthiopie", flag: "🇪🇹" }] },
];

const NO_DECIMALS = new Set(["XOF", "XAF", "NGN", "GNF", "MGA", "RWF", "TZS"]);

export function findCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code);
}

export function convertFromUSD(amountUSD: number, code: string, rateOverride?: number): number {
  const c = findCurrency(code);
  if (!c) return 0;
  return amountUSD * (rateOverride ?? c.rate);
}

export function formatLocal(amount: number, code: string): string {
  const c = findCurrency(code);
  if (!c) return String(amount);
  if (NO_DECIMALS.has(code)) {
    return Math.round(amount).toLocaleString("fr-FR").replace(/,/g, " ") + " " + c.symbol;
  }
  return c.symbol + " " + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatRateOneUSD(code: string, rateOverride?: number): string {
  const c = findCurrency(code);
  if (!c) return "";
  const r = rateOverride ?? c.rate;
  if (NO_DECIMALS.has(code)) return Math.round(r).toLocaleString("fr-FR").replace(/,/g, " ") + " " + c.symbol;
  return r.toFixed(2) + " " + c.symbol;
}

