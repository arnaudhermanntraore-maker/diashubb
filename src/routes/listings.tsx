import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { MapView } from "@/components/MapView";

type PropertyType = "all" | "land" | "house" | "apartment" | "commercial" | "farm";

type ListingsSearch = {
  q?: string;
  maxPrice?: number;
  type?: PropertyType;
  region?: "usa" | "africa";
  tab?: string;
  agent?: string;
};

const AFRICA_COUNTRIES = new Set(["CI", "SN", "GH", "MA", "NG", "KE", "CM", "BJ", "TG", "ML", "BF", "RW", "ZA", "ET", "TN", "DZ", "EG", "UG"]);

const ALLOWED_TYPES: ReadonlySet<PropertyType> = new Set(["all", "land", "house", "apartment", "commercial", "farm"]);
const MAX_Q_LEN = 80;
const MAX_PRICE_CAP = 1_000_000_000;

const normalizeQ = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  // strip control chars, collapse whitespace, trim, cap length
  const cleaned = v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, MAX_Q_LEN);
};

const normalizePrice = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(Math.floor(n), MAX_PRICE_CAP);
};

const normalizeAgent = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  // accept UUID or short alnum slug only
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(t)) return undefined;
  return t;
};

export const Route = createFileRoute("/listings")({
  validateSearch: (s: Record<string, unknown>): ListingsSearch => {
    const type = typeof s.type === "string" && ALLOWED_TYPES.has(s.type as PropertyType) ? (s.type as PropertyType) : undefined;
    const tab = typeof s.tab === "string" ? s.tab.trim().slice(0, 32) || undefined : undefined;
    return {
      q: normalizeQ(s.q),
      maxPrice: normalizePrice(s.maxPrice),
      type,
      region: s.region === "usa" || s.region === "africa" ? s.region : undefined,
      tab,
      agent: normalizeAgent(s.agent),
    };
  },
  head: () => ({
    meta: [
      { title: "Browse properties — TerraFrique" },
      { name: "description", content: "Search verified properties across the US and Africa with country, price, and type filters." },
    ],
  }),
  component: Listings,
});

const TYPES = ["all", "land", "house", "apartment", "commercial", "farm"] as const;

function Listings() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const sp = Route.useSearch();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(sp.q ?? "");
  const [country, setCountry] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>(sp.maxPrice ? String(sp.maxPrice) : "");
  const initialType = (sp.type && (TYPES as readonly string[]).includes(sp.type) ? sp.type : "all") as typeof TYPES[number];
  const [type, setType] = useState<typeof TYPES[number]>(initialType);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [region, setRegion] = useState<"all" | "usa" | "africa">(sp.region ?? "all");
  const [mapRegion, setMapRegion] = useState<"usa" | "africa">(sp.region === "africa" ? "africa" : "usa");

  useEffect(() => {
    if (sp.q !== undefined) setQ(sp.q);
    if (sp.maxPrice !== undefined) setMaxPrice(String(sp.maxPrice));
    if (sp.type && (TYPES as readonly string[]).includes(sp.type)) setType(sp.type as typeof TYPES[number]);
    if (sp.region) { setRegion(sp.region); setMapRegion(sp.region); }
  }, [sp.q, sp.maxPrice, sp.type, sp.region]);

  useEffect(() => {
    setLoading(true);
    supabase.from("properties").select("id,title,title_fr,title_en,country,city,neighborhood,price_usd,type,cover_url,images,ai_score,tf_verified,bedrooms,bathrooms,surface_m2,has_360_tour,lat,lng,boosted_until").eq("status", "active").order("boosted_until", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(60).then(({ data }) => {
      setItems((data ?? []) as Property[]); setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => items.filter((p) => {
    if (q && !`${p.title} ${p.country} ${p.city ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (country && p.country !== country) return false;
    if (maxPrice && Number(p.price_usd) > Number(maxPrice)) return false;
    if (type !== "all" && p.type !== type) return false;
    if (verifiedOnly && !p.tf_verified) return false;
    if (region === "usa" && p.country !== "US") return false;
    if (region === "africa" && !AFRICA_COUNTRIES.has(p.country)) return false;
    return true;
  }), [items, q, country, maxPrice, type, verifiedOnly, region]);

  const countries = useMemo(() => Array.from(new Set(items.map((p) => p.country))).sort(), [items]);

  return (
    <>
    <DemoBanner />
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="md:col-span-2 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none">
            <option value="">{t("search.country")}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("search.price")} className="md:col-span-2 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none" />
          <select value={type} onChange={(e) => setType(e.target.value as typeof TYPES[number])} className="md:col-span-2 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none">
            {TYPES.map((tp) => <option key={tp} value={tp}>{t(`filters.${tp}`)}</option>)}
          </select>
          <label className="md:col-span-2 flex items-center gap-2 px-3 text-sm cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-primary" />
            {t("search.verified")}
          </label>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-end gap-2 mb-3">
          <button onClick={() => setMapRegion("usa")} className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${mapRegion === "usa" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>🇺🇸 USA</button>
          <button onClick={() => setMapRegion("africa")} className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${mapRegion === "africa" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>🌍 Africa</button>
        </div>
        <MapView
          height="380px"
          center={mapRegion === "usa" ? [-84.3880, 33.7490] : [10, 5]}
          zoom={mapRegion === "usa" ? 4 : 3}
          markers={filtered.filter((p) => p.lat != null && p.lng != null).map((p) => ({ id: p.id, lat: p.lat as number, lng: p.lng as number, title: p.title, price_usd: Number(p.price_usd), region: (p.country === "US" ? "usa" : "africa") as "usa" | "africa" }))}
          onMarkerClick={(id) => nav({ to: "/property/$id", params: { id } })}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">{t("property.noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
    </>
  );
}
