import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Building2, Eye, Heart } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/agency/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Agency dashboard — TerraFrique" }] }),
  component: AgencyDashboard,
});

function AgencyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, pending: 0, draft: 0, sold: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("properties").select("status").eq("agent_id", user.id);
      const s = { active: 0, pending: 0, draft: 0, sold: 0 };
      (data ?? []).forEach((r: { status: string }) => {
        if (r.status === "active") s.active++;
        else if (r.status === "draft") s.draft++;
        else if (r.status === "sold" || r.status === "reserved") s.sold++;
        else s.pending++;
      });
      setStats(s);
    })();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Espace Agence</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos annonces et vos prospects</p>
        </div>
        <Link
          to="/listings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
          style={{ background: "var(--tf-blue)" }}
        >
          <Plus size={16} /> Publier un nouveau bien
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          { label: "Actives", value: stats.active, color: "var(--tf-green)" },
          { label: "En attente", value: stats.pending, color: "var(--tf-amber)" },
          { label: "Brouillons", value: stats.draft, color: "#9ca3af" },
          { label: "Vendues", value: stats.sold, color: "var(--tf-blue)" },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-3xl font-display font-bold mt-1" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-display font-bold mt-10 mb-3">Actions rapides</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/listings/new" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Plus className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">Publier un bien</div>
          <div className="text-xs text-muted-foreground mt-1">Formulaire en 5 étapes</div>
        </Link>
        <Link to="/dashboard" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Building2 className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">Mes annonces</div>
          <div className="text-xs text-muted-foreground mt-1">Voir, modifier, booster</div>
        </Link>
        <Link to="/messages" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Heart className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">Messagerie</div>
          <div className="text-xs text-muted-foreground mt-1">Vos prospects en attente</div>
        </Link>
      </div>
    </div>
  );
}
