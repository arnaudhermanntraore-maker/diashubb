import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Bell, Eye, MessageCircle, Home, Globe, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import { EmptyState } from "./shared/EmptyState";
import type { Profile } from "./DashboardRouter";

interface SavedProperty { id: string; title: string; country: string; price_usd: number; cover_url: string | null; }

export function BuyerDashboard({ profile }: { profile: Profile | null }) {
  const { user } = useAuth();
  const [saves, setSaves] = useState<SavedProperty[]>([]);
  const [counts, setCounts] = useState({ saves: 0, alerts: 0, messages: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: favs }, { count: alerts }, { count: msgs }] = await Promise.all([
        supabase.from("favorites").select("property_id").eq("user_id", user.id).limit(20),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("active", true),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).is("read_at", null),
      ]);
      const ids = (favs ?? []).map((f) => f.property_id);
      let props: SavedProperty[] = [];
      if (ids.length) {
        const { data: ps } = await supabase.from("properties").select("id,title,country,price_usd,cover_url").in("id", ids);
        props = (ps ?? []) as SavedProperty[];
      }
      setSaves(props);
      setCounts({ saves: props.length, alerts: alerts ?? 0, messages: msgs ?? 0 });
    })();
  }, [user]);

  const usProps = saves.filter((s) => s.country === "USA" || s.country === "US");
  const afrProps = saves.filter((s) => s.country !== "USA" && s.country !== "US");
  const firstName = profile?.full_name?.split(" ")[0] || "👋";

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Bonjour {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Votre tableau de bord acheteur</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold text-sm">
          <Coins size={16} /> {profile?.terracoins ?? 0} DiasCoins
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="blue" icon={Heart} value={counts.saves} label="Biens sauvegardés" ctaLabel="Voir mes favoris" ctaTo="/favorites" />
        <KpiCard tone="amber" icon={Bell} value={counts.alerts} label="Alertes actives" ctaLabel="Gérer mes alertes" ctaTo="/alerts" />
        <KpiCard tone="green" icon={Eye} value={0} label="Biens consultés" ctaLabel="Voir l'historique" ctaTo="/listings" />
        <KpiCard tone="purple" icon={MessageCircle} value={counts.messages} label="Messages reçus" ctaLabel="Voir les messages" ctaTo="/messages" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <div className="rounded-2xl p-5 border border-border" style={{ background: "#E6F1FB", borderLeft: "3px solid #185FA5" }}>
          <h2 className="font-display font-semibold mb-3">🇺🇸 Portefeuille USA</h2>
          {usProps.length ? (
            <ul className="space-y-2">
              {usProps.map((p) => (
                <li key={p.id}>
                  <Link to="/property/$id" params={{ id: p.id }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60">
                    {p.cover_url && <img src={p.cover_url} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-600">${Number(p.price_usd).toLocaleString()}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Home}
              title="Aucun bien US sauvegardé"
              action={
                <Link to="/listings" className="inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "#185FA5" }}>
                  Chercher aux USA →
                </Link>
              }
            />
          )}
        </div>

        <div className="rounded-2xl p-5 border border-border" style={{ background: "#E1F5EE", borderLeft: "3px solid #1D9E75" }}>
          <h2 className="font-display font-semibold mb-3">🌍 Portefeuille Afrique</h2>
          {afrProps.length ? (
            <ul className="space-y-2">
              {afrProps.map((p) => (
                <li key={p.id}>
                  <Link to="/property/$id" params={{ id: p.id }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60">
                    {p.cover_url && <img src={p.cover_url} alt="" className="w-12 h-12 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-slate-900">{p.title}</div>
                      <div className="text-xs text-slate-600">${Number(p.price_usd).toLocaleString()}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Globe}
              title="Aucun bien Afrique sauvegardé"
              action={
                <Link to="/diaspora" className="inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "#1D9E75" }}>
                  Investir en Afrique →
                </Link>
              }
            />
          )}
        </div>
      </div>

      <QuickActions
        actions={[
          { label: "🔍 Chercher un bien", to: "/listings", tone: "primary" },
          { label: "🌍 Investir en Afrique", to: "/diaspora", tone: "green" },
          { label: "💸 Envoyer de l'argent", to: "/transfers", tone: "blue" },
          { label: "🔔 Créer une alerte", to: "/alerts", tone: "amber" },
        ]}
      />
    </div>
  );
}
