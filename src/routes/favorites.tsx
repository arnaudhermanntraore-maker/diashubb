import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { PropertyCard, type Property } from "@/components/PropertyCard";

export const Route = createFileRoute("/favorites")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Favorites,
});

function Favorites() {
  const enabled = useFeatureFlag("favorites");
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !enabled) { setLoading(false); return; }
    (async () => {
      const { data: favs } = await supabase.from("favorites").select("property_id").eq("user_id", user.id);
      const ids = (favs ?? []).map((f) => f.property_id);
      if (ids.length === 0) { setItems([]); setLoading(false); return; }
      const { data } = await supabase.from("properties").select("id,title,country,city,price_usd,type,cover_url,ai_score,tf_verified,lat,lng,boosted_until").in("id", ids);
      setItems((data ?? []) as Property[]); setLoading(false);
    })();
  }, [user, enabled]);

  if (!enabled) return <FeatureDisabled featureKey="favorites" />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-display font-bold">{fr ? "Mes favoris" : "My favorites"}</h1>
      <p className="text-sm text-muted-foreground mt-1">{items.length} {fr ? "biens sauvegardés" : "saved properties"}</p>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">{fr ? "Aucun bien sauvegardé" : "No saved properties yet"}</p>
          <Link to="/listings" className="inline-block mt-4 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm">{fr ? "Explorer les annonces →" : "Browse listings →"}</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {items.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
