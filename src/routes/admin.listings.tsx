import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { toast } from "sonner";
import { Search, Eye, CheckCircle2, XCircle, Trash2, ShieldCheck } from "lucide-react";

interface ListingRow {
  id: string;
  title: string;
  city: string | null;
  country: string;
  price_usd: number;
  status: string;
  type: string;
  tf_verified: boolean;
  ai_score: number | null;
  agent_id: string;
  created_at: string;
  cover_url: string | null;
}

const STATUSES = ["all", "draft", "active", "sold", "rejected"] as const;

export const Route = createFileRoute("/admin/listings")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: () => <AdminGuard><ListingsPage /></AdminGuard>,
});

function ListingsPage() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<typeof STATUSES[number]>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("properties").select("id, title, city, country, price_usd, status, type, tf_verified, ai_score, agent_id, created_at, cover_url").order("created_at", { ascending: false }).limit(500);
    setRows((data ?? []) as ListingRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Annonce → ${status}`);
    setRows(rows.map((r) => r.id === id ? { ...r, status } : r));
  };

  const toggleVerified = async (r: ListingRow) => {
    const { error } = await supabase.from("properties").update({ tf_verified: !r.tf_verified }).eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows(rows.map((x) => x.id === r.id ? { ...x, tf_verified: !x.tf_verified } : x));
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimée");
    setRows(rows.filter((r) => r.id !== id));
  };

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q) {
      const s = `${r.title} ${r.city ?? ""} ${r.country}`.toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Annonces</h1>
          <p className="text-sm text-muted-foreground mt-1">{rows.length} annonces · {rows.filter(r => r.tf_verified).length} vérifiées</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9 pr-4 py-2 bg-muted rounded-xl text-sm outline-none w-64" />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Aucune annonce.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap gap-3 items-center">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                )}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.title}</span>
                    {r.tf_verified && <ShieldCheck className="w-4 h-4 text-success" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.city ?? "—"}, {r.country} · {r.type} · ${Number(r.price_usd).toLocaleString()}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded ${r.status === "active" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-muted"}`}>{r.status}</span>
                    {" · AI: "}{r.ai_score ?? "—"} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Link to="/property/$id" params={{ id: r.id }} className="text-xs px-3 py-1.5 rounded-full bg-muted inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Voir</Link>
                  {r.status !== "active" && (
                    <button onClick={() => setStatus(r.id, "active")} className="text-xs px-3 py-1.5 rounded-full bg-success/20 text-success inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approuver</button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => setStatus(r.id, "rejected")} className="text-xs px-3 py-1.5 rounded-full bg-destructive/20 text-destructive inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejeter</button>
                  )}
                  <button onClick={() => toggleVerified(r)} className="text-xs px-3 py-1.5 rounded-full bg-muted inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {r.tf_verified ? "Dé-vérifier" : "Vérifier"}</button>
                  <button onClick={() => remove(r.id)} className="text-xs px-3 py-1.5 rounded-full bg-muted text-destructive inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
