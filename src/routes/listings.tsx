import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { MapView } from "@/components/MapView";

export const Route = createFileRoute("/listings")({
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
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [type, setType] = useState<typeof TYPES[number]>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from("properties").select("id,title,country,city,price_usd,type,cover_url,ai_score,tf_verified,lat,lng").eq("status", "active").order("created_at", { ascending: false }).limit(60).then(({ data }) => {
      setItems((data ?? []) as Property[]); setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => items.filter((p) => {
    if (q && !`${p.title} ${p.country} ${p.city ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (country && p.country !== country) return false;
    if (maxPrice && Number(p.price_usd) > Number(maxPrice)) return false;
    if (type !== "all" && p.type !== type) return false;
    if (verifiedOnly && !p.tf_verified) return false;
    return true;
  }), [items, q, country, maxPrice, type, verifiedOnly]);

  const countries = useMemo(() => Array.from(new Set(items.map((p) => p.country))).sort(), [items]);

  return (
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
        <MapView
          height="380px"
          markers={filtered.filter((p) => p.lat != null && p.lng != null).map((p) => ({ id: p.id, lat: p.lat as number, lng: p.lng as number, title: p.title, price_usd: Number(p.price_usd) }))}
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
  );
}
