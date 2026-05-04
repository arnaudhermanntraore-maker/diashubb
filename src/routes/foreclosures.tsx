import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { ForeclosureCard } from "@/components/ForeclosureCard";
import { FORECLOSURE_TYPES, US_STATES, type Foreclosure } from "@/lib/foreclosures";
import { Gavel, BookOpen } from "lucide-react";

export const Route = createFileRoute("/foreclosures")({
  head: () => ({
    meta: [
      { title: "Foreclosures — TerraFrique" },
      { name: "description", content: "Bank-owned, HUD and auction properties up to 50% below market value." },
      { property: "og:title", content: "Foreclosures — TerraFrique" },
    ],
  }),
  component: ForeclosuresPage,
});

type SortKey = "discount" | "newest" | "price_asc" | "auction" | "ai_score";

function ForeclosuresPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const enabled = useFeatureFlag("foreclosures");
  const [items, setItems] = useState<Foreclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("");
  const [type, setType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [financing, setFinancing] = useState("");
  const [sort, setSort] = useState<SortKey>("discount");

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("foreclosures").select("*").eq("status", "active").limit(200);
      setItems((data ?? []) as Foreclosure[]);
      setLoading(false);
    })();
  }, [enabled]);

  const filtered = useMemo(() => {
    let r = items;
    if (state) r = r.filter((x) => x.state === state);
    if (type !== "all") r = r.filter((x) => x.foreclosure_type === type);
    if (maxPrice) r = r.filter((x) => (x.listing_price ?? 0) <= Number(maxPrice));
    if (financing === "FHA") r = r.filter((x) => x.fha_eligible);
    if (financing === "VA") r = r.filter((x) => x.va_eligible);
    if (financing === "Cash") r = r.filter((x) => x.financing_available?.includes("Cash only"));
    const sorted = [...r];
    sorted.sort((a, b) => {
      switch (sort) {
        case "discount": return (b.discount_percent ?? 0) - (a.discount_percent ?? 0);
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price_asc": return (a.listing_price ?? 0) - (b.listing_price ?? 0);
        case "auction": return (a.auction_date ?? "9999").localeCompare(b.auction_date ?? "9999");
        case "ai_score": return (b.ai_investment_score ?? 0) - (a.ai_investment_score ?? 0);
      }
    });
    return sorted;
  }, [items, state, type, maxPrice, financing, sort]);

  if (!enabled) return <FeatureDisabled featureKey="foreclosures" />;

  const avgDiscount = items.length ? Math.round(items.reduce((s, x) => s + (x.discount_percent ?? 0), 0) / items.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="text-white" style={{ background: "linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)" }}>
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
            <Gavel className="w-4 h-4" /> Foreclosures · USA
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
            {fr ? "Saisies immobilières — jusqu'à -50% du prix du marché" : "Foreclosures & Distressed Properties"}
          </h1>
          <p className="mt-3 text-sm md:text-base opacity-90 max-w-2xl">
            {fr
              ? "Trouvez des biens saisis par les banques, HUD et aux enchères à des prix exceptionnels. Idéal pour investisseurs diaspora."
              : "Find bank-owned, HUD and auctioned properties at below-market prices. Ideal for diaspora investors."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill>🏠 {items.length} {fr ? "biens disponibles" : "properties available"}</Pill>
            <Pill>💰 {fr ? `-${avgDiscount}% en moyenne` : `Avg -${avgDiscount}% below market`}</Pill>
            <Pill>⚡ {fr ? "Mis à jour quotidiennement" : "Updated daily"}</Pill>
            <Link to="/foreclosures/guide" className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-red-700 hover:bg-red-50">
              <BookOpen className="w-3 h-3" /> {fr ? "Guide d'achat" : "Buying guide"}
            </Link>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 max-w-6xl flex flex-wrap items-center gap-2">
          <select value={state} onChange={(e) => setState(e.target.value)} className="text-sm px-3 py-2 bg-gray-100 rounded-lg outline-none">
            <option value="">{fr ? "Tous les États" : "All states"}</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="flex flex-wrap gap-1">
            {FORECLOSURE_TYPES.map((ft) => (
              <button key={ft.key} onClick={() => setType(ft.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${type === ft.key ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                {fr ? ft.label_fr : ft.label_en}
              </button>
            ))}
          </div>

          <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="text-sm px-3 py-2 bg-gray-100 rounded-lg outline-none">
            <option value="">{fr ? "Prix max" : "Max price"}</option>
            <option value="100000">&lt; $100k</option>
            <option value="200000">&lt; $200k</option>
            <option value="350000">&lt; $350k</option>
            <option value="500000">&lt; $500k</option>
          </select>

          <select value={financing} onChange={(e) => setFinancing(e.target.value)} className="text-sm px-3 py-2 bg-gray-100 rounded-lg outline-none">
            <option value="">{fr ? "Financement" : "Financing"}</option>
            <option value="FHA">FHA eligible</option>
            <option value="VA">VA eligible</option>
            <option value="Cash">Cash only</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="text-sm px-3 py-2 bg-gray-100 rounded-lg outline-none ml-auto">
            <option value="discount">{fr ? "Meilleure décote" : "Best deal"}</option>
            <option value="newest">{fr ? "Plus récents" : "Newest"}</option>
            <option value="price_asc">{fr ? "Prix ↑" : "Price ↑"}</option>
            <option value="auction">{fr ? "Date d'enchère" : "Auction date"}</option>
            <option value="ai_score">{fr ? "Score IA" : "AI Score"}</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-sm text-gray-600 mb-4">
          {loading ? (fr ? "Chargement…" : "Loading…") : `${filtered.length} ${fr ? "saisies trouvées" : "foreclosures found"}`}
        </div>
        {!loading && filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">{fr ? "Aucun résultat avec ces filtres." : "No results with these filters."}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((f) => <ForeclosureCard key={f.id} f={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white border border-white/20">{children}</span>;
}
