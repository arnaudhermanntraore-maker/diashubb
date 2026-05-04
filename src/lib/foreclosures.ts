export interface Foreclosure {
  id: string;
  source: string;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surface_sqft: number | null;
  year_built: number | null;
  listing_price: number | null;
  estimated_market_value: number | null;
  discount_percent: number | null;
  outstanding_loan: number | null;
  opening_bid: number | null;
  foreclosure_type: string;
  foreclosure_stage: string | null;
  lender_name: string | null;
  default_date: string | null;
  auction_date: string | null;
  listing_date: string | null;
  photos: string[];
  ai_renovation_estimate: number | null;
  ai_investment_score: number | null;
  ai_analysis: Record<string, unknown>;
  status: string;
  fha_eligible: boolean;
  va_eligible: boolean;
  financing_available: string[];
  lat: number | null;
  lng: number | null;
  views_count: number;
  saves_count: number;
  created_at: string;
}

export const FORECLOSURE_TYPES = [
  { key: "all", label_fr: "Tous", label_en: "All" },
  { key: "hud_home", label_fr: "HUD", label_en: "HUD" },
  { key: "reo", label_fr: "Bank REO", label_en: "Bank REO" },
  { key: "preforeclosure", label_fr: "Pré-saisie", label_en: "Pre-foreclosure" },
  { key: "auction", label_fr: "Enchère", label_en: "Auction" },
  { key: "fannie_mae", label_fr: "Fannie Mae", label_en: "Fannie Mae" },
  { key: "va_home", label_fr: "VA", label_en: "VA" },
] as const;

export function typeBadge(type: string): { label: string; bg: string; emoji: string } {
  switch (type) {
    case "hud_home": return { label: "HUD Home", bg: "#1D4ED8", emoji: "🏛️" };
    case "reo": return { label: "Bank REO", bg: "#1F2937", emoji: "🏦" };
    case "preforeclosure": return { label: "Pre-foreclosure", bg: "#92400E", emoji: "⚠️" };
    case "auction": return { label: "Auction", bg: "#DC2626", emoji: "🔨" };
    case "fannie_mae": return { label: "Fannie Mae", bg: "#1D4ED8", emoji: "🏛️" };
    case "va_home": return { label: "VA Home", bg: "#065F46", emoji: "⭐" };
    default: return { label: type, bg: "#6B7280", emoji: "🏠" };
  }
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}
