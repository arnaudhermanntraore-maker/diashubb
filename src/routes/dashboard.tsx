import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Building2, Heart, Receipt, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BoostButton } from "@/components/BoostModal";
import { useServerFn } from "@tanstack/react-start";
import { cancelBoost } from "@/server/boosts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Dashboard,
});

type ListingRow = { id: string; title: string; country: string; price_usd: number; status: string; cover_url: string | null };
type BoostRow = { id: string; item_id: string; item_type: string; plan: string; status: string; starts_at: string | null; ends_at: string | null; amount_usd: number; stats: { views?: number; saves?: number; contacts?: number } };

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ listings: 0, txs: 0, terracoins: 0 });
  const [myListings, setMyListings] = useState<ListingRow[]>([]);
  const [boosts, setBoosts] = useState<BoostRow[]>([]);
  const cancelFn = useServerFn(cancelBoost);

  const refresh = async () => {
    if (!user) return;
    const [{ data: profile }, { count: l }, { count: tx }, { data: list }, { data: bs }] = await Promise.all([
      supabase.from("profiles").select("terracoins").eq("id", user.id).maybeSingle(),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", user.id),
      supabase.from("transactions").select("id", { count: "exact", head: true }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
      supabase.from("properties").select("id,title,country,price_usd,status,cover_url").eq("agent_id", user.id).limit(10),
      supabase.from("boosts").select("id,item_id,item_type,plan,status,starts_at,ends_at,amount_usd,stats").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setStats({ listings: l ?? 0, txs: tx ?? 0, terracoins: profile?.terracoins ?? 0 });
    setMyListings((list ?? []) as ListingRow[]);
    setBoosts((bs ?? []) as BoostRow[]);
  };

  useEffect(() => { refresh(); }, [user]);

  const stopBoost = async (id: string) => {
    if (!confirm("Arrêter ce boost ? Aucun remboursement.")) return;
    try { await cancelFn({ data: { boostId: id } }); toast.success("Boost arrêté"); refresh(); }
    catch (e) { toast.error((e as Error).message); }
  };

  const activeBoosts = boosts.filter((b) => b.status === "active");
  const titleFor = (id: string) => myListings.find((l) => l.id === id)?.title ?? id.slice(0, 8);
  const thumbFor = (id: string) => myListings.find((l) => l.id === id)?.cover_url ?? null;

  const cards = [
    { icon: Building2, label: t("dashboard.listings"), value: stats.listings },
    { icon: Heart, label: t("dashboard.saved"), value: 0 },
    { icon: Receipt, label: t("dashboard.txCount"), value: stats.txs },
    { icon: Coins, label: t("dashboard.terracoins"), value: stats.terracoins },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <Link
          to="/listings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
          style={{ background: "var(--tf-blue)" }}
        >
          + Publier un nouveau bien
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {cards.map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <c.icon className="text-primary mb-2" size={20} />
            <div className="text-2xl font-display font-bold">{c.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-10">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-semibold mb-3">{t("dashboard.us")}</h2>
          <p className="text-sm text-muted-foreground">{myListings.filter((l) => l.country === "USA").length} listings</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-semibold mb-3">{t("dashboard.africa")}</h2>
          <p className="text-sm text-muted-foreground">{myListings.filter((l) => l.country !== "USA").length} listings</p>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-4">{t("dashboard.listings")}</h2>
      {myListings.length === 0 ? (
        <p className="text-muted-foreground text-sm">No listings yet. <Link to="/listings/new" className="text-primary font-medium">Add your first.</Link></p>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {myListings.map((l) => (
            <Link key={l.id} to="/property/$id" params={{ id: l.id }} className="flex items-center justify-between p-4 hover:bg-muted">
              <div><div className="font-medium">{l.title}</div><div className="text-xs text-muted-foreground">{l.country} · {l.status}</div></div>
              <div className="text-primary font-display font-semibold">${Number(l.price_usd).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
