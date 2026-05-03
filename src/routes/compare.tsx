import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { PriceDisplay } from "@/components/PriceDisplay";
import { X } from "lucide-react";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): { ids?: string } => ({ ids: typeof s.ids === "string" ? s.ids.slice(0, 200) : undefined }),
  component: Compare,
});

interface FullProperty {
  id: string; title: string; country: string; city: string | null;
  price_usd: number; type: string; cover_url: string | null;
  ai_score: number | null; tf_verified: boolean; tour_360_url: string | null;
}

function Compare() {
  const enabled = useFeatureFlag("property_comparison");
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const sp = Route.useSearch();
  const [items, setItems] = useState<FullProperty[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const ids = (sp.ids ?? "").split(",").filter(Boolean).slice(0, 4);
    if (ids.length === 0) { setItems([]); return; }
    supabase.from("properties").select("id,title,country,city,price_usd,type,cover_url,ai_score,tf_verified,tour_360_url").in("id", ids).then(({ data }) => setItems((data ?? []) as FullProperty[]));
  }, [sp.ids, enabled]);

  if (!enabled) return <FeatureDisabled featureKey="property_comparison" />;

  const remove = (id: string) => {
    const next = items.filter((p) => p.id !== id).map((p) => p.id).join(",");
    window.history.replaceState(null, "", `/compare?ids=${next}`);
    setItems(items.filter((p) => p.id !== id));
  };

  const minPrice = Math.min(...items.map((p) => Number(p.price_usd)));
  const maxScore = Math.max(...items.map((p) => p.ai_score ?? 0));

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-display font-bold">{fr ? "Comparer les biens" : "Compare properties"}</h1>
      <p className="text-sm text-muted-foreground mt-1">{items.length} / 4 {fr ? "biens sélectionnés" : "selected"}</p>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">{fr ? "Aucun bien à comparer" : "No properties to compare"}</p>
          <Link to="/listings" className="inline-block mt-4 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm">{fr ? "Choisir des biens" : "Pick properties"}</Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(220px, 1fr))` }}>
            {items.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-4 relative">
                <button onClick={() => remove(p.id)} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-soft"><X size={14} /></button>
                <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden mb-3">
                  {p.cover_url && <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />}
                </div>
                <Link to="/property/$id" params={{ id: p.id }} className="font-semibold text-sm hover:text-primary line-clamp-1">{p.title}</Link>
                <div className="text-xs text-muted-foreground">{p.city ? `${p.city}, ` : ""}{p.country}</div>
                <Row label={fr ? "Prix" : "Price"} highlight={Number(p.price_usd) === minPrice}>
                  <PriceDisplay priceUsd={Number(p.price_usd)} country={p.country} size="sm" />
                </Row>
                <Row label={fr ? "Type" : "Type"}>{p.type}</Row>
                <Row label={fr ? "Score IA" : "AI Score"} highlight={(p.ai_score ?? 0) === maxScore && maxScore > 0}>{p.ai_score ?? "—"}</Row>
                <Row label={fr ? "Vérifié" : "Verified"}>{p.tf_verified ? "✓" : "—"}</Row>
                <Row label="360°">{p.tour_360_url ? "✓" : "—"}</Row>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`mt-2 pt-2 border-t border-border flex justify-between items-center text-xs ${highlight ? "text-green-600 font-bold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
