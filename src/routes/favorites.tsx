import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Globe, Home } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "us" | "africa">("all");

  const fetchFavorites = useCallback(async () => {
    if (!user || !enabled) {
      setLoading(false);
      return;
    }

    const { data: favs } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const ids = (favs ?? []).map((f) => f.property_id);

    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("properties")
      .select(
        `id, title, title_fr, title_en,
         country, city, neighborhood,
         price_usd, type,
         cover_url, images,
         ai_score, tf_verified,
         bedrooms, bathrooms, surface_m2,
         has_360_tour,
         lat, lng, boosted_until`
      )
      .in("id", ids);

    setItems((data ?? []) as Property[]);
    setLoading(false);
  }, [user, enabled]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Real-time sync — update when favorites change
  useEffect(() => {
    if (!user || !enabled) return;

    const channel = supabase
      .channel("favorites_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enabled, fetchFavorites]);

  if (!enabled) return <FeatureDisabled featureKey="favorites" />;

  // Filter by continent
  const filtered =
    filter === "us"
      ? items.filter((p) => p.country === "US")
      : filter === "africa"
        ? items.filter((p) => p.country !== "US")
        : items;

  const usCount = items.filter((p) => p.country === "US").length;
  const africaCount = items.filter((p) => p.country !== "US").length;

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Heart
              size={28}
              className="fill-red-500 text-red-500"
              aria-hidden="true"
            />
            {fr ? "Mes favoris" : "My favorites"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length}{" "}
            {fr ? "bien(s) sauvegardé(s)" : "saved propert(ies)"}
          </p>
        </div>

        {/* Filter pills */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fr ? "Tous" : "All"} ({items.length})
            </button>
            {usCount > 0 && (
              <button
                onClick={() => setFilter("us")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === "us"
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  filter === "us"
                    ? { background: "var(--tf-blue)" }
                    : {}
                }
              >
                🇺🇸 USA ({usCount})
              </button>
            )}
            {africaCount > 0 && (
              <button
                onClick={() => setFilter("africa")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === "africa"
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  filter === "africa"
                    ? { background: "var(--tf-green)" }
                    : {}
                }
              >
                🌍 {fr ? "Afrique" : "Africa"} ({africaCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] bg-muted rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-red-300" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            {fr ? "Aucun bien sauvegardé" : "No saved properties yet"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {fr
              ? "Cliquez sur ❤️ sur n'importe quel bien pour le retrouver ici."
              : "Click ❤️ on any property to save it here."}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: "var(--tf-blue)" }}
            >
              <Home size={16} />
              {fr ? "Explorer les biens USA" : "Browse US listings"}
            </Link>
            <Link
              to="/listings"
              search={{ region: "africa" } as never}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: "var(--tf-green)" }}
            >
              <Globe size={16} />
              {fr ? "Investir en Afrique" : "Invest in Africa"}
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Filtered empty state */
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {fr
              ? "Aucun bien dans cette catégorie"
              : "No properties in this category"}
          </p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-primary text-sm underline"
          >
            {fr ? "Voir tous les favoris" : "Show all favorites"}
          </button>
        </div>
      ) : (
        /* Properties grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* Bi-continental summary (if both US and Africa) */}
      {!loading && usCount > 0 && africaCount > 0 && filter === "all" && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: "#E6F1FB",
              borderLeft: "3px solid var(--tf-blue)",
              borderRadius: "12px",
            }}
          >
            <div className="text-xs text-muted-foreground mb-1">
              🇺🇸 {fr ? "Portefeuille USA" : "US Portfolio"}
            </div>
            <div
              className="text-2xl font-display font-bold"
              style={{ color: "var(--tf-blue)" }}
            >
              {usCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {fr ? "biens sauvegardés" : "saved properties"}
            </div>
          </div>
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: "#E1F5EE",
              borderLeft: "3px solid var(--tf-green)",
              borderRadius: "12px",
            }}
          >
            <div className="text-xs text-muted-foreground mb-1">
              🌍 {fr ? "Portefeuille Afrique" : "Africa Portfolio"}
            </div>
            <div
              className="text-2xl font-display font-bold"
              style={{ color: "var(--tf-green)" }}
            >
              {africaCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {fr ? "biens sauvegardés" : "saved properties"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
