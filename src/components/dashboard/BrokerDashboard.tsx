import { useEffect, useState } from "react";
import { DollarSign, Wallet, Users, Briefcase, Copy, MessageCircle, BarChart3, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import type { Profile } from "./DashboardRouter";

interface CommissionRow { id: string; amount_usd: number; rate: number; paid_at: string | null; created_at: string; }

export function BrokerDashboard({ profile }: { profile: Profile | null }) {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("commissions").select("id,amount_usd,rate,paid_at,created_at").eq("broker_id", user.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      setCommissions((data ?? []) as CommissionRow[]);
    });
  }, [user]);

  const pending = commissions.filter((c) => !c.paid_at).reduce((s, c) => s + Number(c.amount_usd), 0);
  const paid = commissions.filter((c) => c.paid_at).reduce((s, c) => s + Number(c.amount_usd), 0);
  const dealsCount = commissions.length;
  const level = dealsCount >= 30 ? "💎 Platine" : dealsCount >= 15 ? "🥇 Or" : dealsCount >= 5 ? "🥈 Argent" : "🥉 Bronze";
  const refCode = (user?.id ?? "").slice(0, 8);
  const refUrl = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${refCode}` : `/signup?ref=${refCode}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(refUrl); toast.success("Copié !"); } catch { toast.error("Copie impossible"); }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{profile?.full_name || "Démarcheur"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Démarcheur TerraFrique</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">{level}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="green" icon={DollarSign} value={`$${pending.toLocaleString()}`} label="Commissions en attente" />
        <KpiCard tone="blue" icon={Wallet} value={`$${paid.toLocaleString()}`} label="Commissions payées" />
        <KpiCard tone="amber" icon={Users} value={0} label="Filleuls actifs" />
        <KpiCard tone="purple" icon={Briefcase} value={dealsCount} label="Deals total" />
      </div>

      <div className="rounded-2xl p-5 mt-10" style={{ background: "#E6F1FB" }}>
        <h2 className="font-display font-semibold mb-3 text-slate-900">Votre lien de parrainage</h2>
        <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
          <code className="flex-1 text-sm truncate text-slate-700">{refUrl}</code>
          <button onClick={copyLink} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold">
            <Copy size={14} /> Copier
          </button>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-3">Mes commissions</h2>
      {commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune commission pour le moment.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase">
              <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Taux</th><th className="text-left p-3">Montant</th><th className="text-left p-3">Statut</th></tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{Number(c.rate) * 100}%</td>
                  <td className="p-3 font-semibold">${Number(c.amount_usd).toLocaleString()}</td>
                  <td className="p-3">
                    {c.paid_at ? <span className="text-emerald-600 font-semibold">Payée ✓</span> : <span className="text-amber-600 font-semibold">En attente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuickActions
        actions={[
          { label: "Copier mon lien", to: "/dashboard", tone: "primary", icon: <Copy size={16} /> },
          { label: "Mes messages", to: "/messages", tone: "blue", icon: <MessageCircle size={16} /> },
          { label: "Mes stats", to: "/dashboard", tone: "outline", icon: <BarChart3 size={16} /> },
          { label: "Trouver des biens", to: "/listings", tone: "green", icon: <Search size={16} /> },
        ]}
      />
    </div>
  );
}
