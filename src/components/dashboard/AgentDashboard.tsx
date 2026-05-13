import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, MessageCircle, Clock, Eye, Rocket, Plus, BarChart3, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import { EmptyState } from "./shared/EmptyState";
import { BoostButton } from "@/components/BoostModal";
import type { Profile } from "./DashboardRouter";

interface ListingRow { id: string; title: string; status: string; price_usd: number; cover_url: string | null; views_count: number; }

export function AgentDashboard({ profile }: { profile: Profile | null }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [counts, setCounts] = useState({ active: 0, pending: 0, totalViews: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,status,price_usd,cover_url,views_count")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      const rows = (data ?? []) as ListingRow[];
      setListings(rows);
      setCounts({
        active: rows.filter((r) => r.status === "active").length,
        pending: rows.filter((r) => r.status === "draft" || r.status === "pending").length,
        totalViews: rows.reduce((s, r) => s + (r.views_count ?? 0), 0),
      });
    })();
  }, [user]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      draft: "bg-slate-200 text-slate-700",
      pending: "bg-amber-100 text-amber-700",
      rejected: "bg-red-100 text-red-700",
    };
    return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[s] ?? "bg-muted"}`}>{s}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{profile?.full_name || "Agent"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Tableau de bord agent</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">Pro ✓</span>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold inline-flex items-center gap-1">
            <Rocket size={12} /> {profile?.diascoins ?? 0} crédits
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="blue" icon={Building2} value={counts.active} label="Annonces actives" />
        <KpiCard tone="green" icon={MessageCircle} value={0} label="Leads ce mois" trend="↑ Nouveau" />
        <KpiCard tone="amber" icon={Clock} value={counts.pending} label="En attente" badge={counts.pending > 0 ? "Action" : undefined} />
        <KpiCard tone="purple" icon={Eye} value={counts.totalViews} label="Vues totales" />
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-4">Mes annonces récentes</h2>
      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune annonce"
          description="Publiez votre premier bien pour commencer"
          action={
            <Link to="/listings/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold">
              <Plus size={16} /> Publier un bien
            </Link>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4 hover:bg-muted">
              {l.cover_url && <img src={l.cover_url} alt="" className="w-14 h-14 rounded object-cover" />}
              <Link to="/property/$id" params={{ id: l.id }} className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-2">{l.title} {statusBadge(l.status)}</div>
                <div className="text-xs text-muted-foreground">{l.views_count ?? 0} vues</div>
              </Link>
              <div className="text-primary font-display font-semibold whitespace-nowrap">${Number(l.price_usd).toLocaleString()}</div>
              <BoostButton itemType="property" itemId={l.id} itemTitle={l.title} itemPrice={l.price_usd} itemThumb={l.cover_url} />
            </div>
          ))}
        </div>
      )}

      <QuickActions
        actions={[
          { label: "+ Publier un bien", to: "/listings/new", tone: "green", icon: <Plus size={16} /> },
          { label: "🚀 Booster", to: "/pricing", tone: "amber" },
          { label: "📊 Analytics", to: "/dashboard", tone: "blue", icon: <BarChart3 size={16} /> },
          { label: "Mon agence", to: "/agency/dashboard", tone: "outline", icon: <Settings size={16} /> },
        ]}
      />
    </div>
  );
}
