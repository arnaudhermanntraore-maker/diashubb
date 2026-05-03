import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Users, Home, DollarSign, TrendingUp, Globe, Activity } from "lucide-react";

interface KPIs {
  users: number;
  newUsers7d: number;
  listings: number;
  activeListings: number;
  txTotal: number;
  txVolume: number;
  txReleased: number;
  byCountry: Record<string, number>;
  byType: Record<string, number>;
  recent7d: { date: string; count: number }[];
}

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: () => <AdminGuard><AnalyticsPage /></AdminGuard>,
});

function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);

  useEffect(() => {
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [
        { count: users },
        { count: newUsers7d },
        { count: listings },
        { count: activeListings },
        { data: txs },
        { data: props },
        { data: recentProps },
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("amount_usd, status"),
        supabase.from("properties").select("country, type"),
        supabase.from("properties").select("created_at").gte("created_at", sevenDaysAgo),
      ]);

      const txList = (txs ?? []) as { amount_usd: number; status: string }[];
      const byCountry: Record<string, number> = {};
      const byType: Record<string, number> = {};
      (props ?? []).forEach((p) => {
        byCountry[p.country] = (byCountry[p.country] ?? 0) + 1;
        byType[p.type] = (byType[p.type] ?? 0) + 1;
      });

      const recent7d: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const count = (recentProps ?? []).filter((p) => p.created_at.slice(0, 10) === key).length;
        recent7d.push({ date: key.slice(5), count });
      }

      setKpis({
        users: users ?? 0,
        newUsers7d: newUsers7d ?? 0,
        listings: listings ?? 0,
        activeListings: activeListings ?? 0,
        txTotal: txList.length,
        txVolume: txList.reduce((s, t) => s + Number(t.amount_usd), 0),
        txReleased: txList.filter(t => t.status === "released").length,
        byCountry,
        byType,
        recent7d,
      });
    })();
  }, []);

  if (!kpis) return <div className="text-center text-muted-foreground py-20">Chargement…</div>;

  const maxRecent = Math.max(1, ...kpis.recent7d.map(r => r.count));
  const sortedCountries = Object.entries(kpis.byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCountry = Math.max(1, ...sortedCountries.map(([, n]) => n));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Indicateurs clés de la plateforme</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI icon={Users} label="Utilisateurs" value={kpis.users.toString()} sub={`+${kpis.newUsers7d} (7j)`} />
        <KPI icon={Home} label="Annonces actives" value={kpis.activeListings.toString()} sub={`${kpis.listings} total`} />
        <KPI icon={DollarSign} label="Volume USD" value={`$${kpis.txVolume.toLocaleString()}`} sub={`${kpis.txTotal} tx`} />
        <KPI icon={TrendingUp} label="Tx libérées" value={kpis.txReleased.toString()} sub={`${kpis.txTotal > 0 ? Math.round((kpis.txReleased / kpis.txTotal) * 100) : 0}% taux`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Annonces créées (7 derniers jours)" icon={Activity}>
          <div className="flex items-end gap-2 h-40 mt-3">
            {kpis.recent7d.map((r) => (
              <div key={r.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary/20 rounded-t-md flex items-end justify-center" style={{ height: `${(r.count / maxRecent) * 100}%`, minHeight: "4px" }}>
                  <span className="text-[10px] font-medium text-primary mb-1">{r.count || ""}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{r.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top pays" icon={Globe}>
          <div className="space-y-2 mt-3">
            {sortedCountries.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
            {sortedCountries.map(([country, n]) => (
              <div key={country}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{country}</span>
                  <span className="text-muted-foreground">{n}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(n / maxCountry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Répartition par type" icon={Home}>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(kpis.byType).map(([type, n]) => (
              <div key={type} className="bg-muted/50 rounded-xl p-3">
                <div className="text-xl font-display font-bold">{n}</div>
                <div className="text-xs text-muted-foreground capitalize">{type}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-success mt-1">{sub}</div>}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}
