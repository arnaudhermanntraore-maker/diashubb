import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useServerFn } from "@tanstack/react-start";
import { analyzeForeclosure } from "@/server/foreclosure-ai.functions";
import { typeBadge } from "@/lib/foreclosures";
import { Sparkles, RefreshCw, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/foreclosures")({
  head: () => ({ meta: [{ title: "Admin · Foreclosures" }] }),
  component: () => (
    <AdminGuard>
      <AdminForeclosures />
    </AdminGuard>
  ),
});

interface Row {
  id: string;
  source: string;
  address: string;
  city: string;
  state: string;
  foreclosure_type: string;
  listing_price: number | null;
  estimated_market_value: number | null;
  discount_percent: number | null;
  status: string;
  ai_investment_score: number | null;
  ai_renovation_estimate: number | null;
  last_synced_at: string;
}

function AdminForeclosures() {
  const analyze = useServerFn(analyzeForeclosure);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("foreclosures")
      .select("id, source, address, city, state, foreclosure_type, listing_price, estimated_market_value, discount_percent, status, ai_investment_score, ai_renovation_estimate, last_synced_at")
      .order("last_synced_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    !search || `${r.address} ${r.city} ${r.state}`.toLowerCase().includes(search.toLowerCase()),
  );

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("foreclosures").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); load(); }
  };

  const runAnalysis = async (id: string) => {
    setAnalyzingId(id);
    try {
      await analyze({ data: { foreclosureId: id } });
      toast.success("Analyse IA terminée");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur IA");
    } finally {
      setAnalyzingId(null);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/public/hooks/sync-hud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: "{}",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Sync failed");
      toast.success(`Sync HUD: +${j.inserted} / ~${j.updated}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Foreclosures</h1>
          <p className="text-sm text-muted-foreground">{rows.length} annonces · sync horaire automatique</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync HUD
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Recherche adresse, ville…"
        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Adresse</th>
              <th className="p-3">Type</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Décote</th>
              <th className="p-3">IA Score</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Chargement…</td></tr>
            ) : filtered.map((r) => {
              const badge = typeBadge(r.foreclosure_type);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium">{r.address}</div>
                    <div className="text-xs text-muted-foreground">{r.city}, {r.state} · {r.source}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded text-white" style={{ background: badge.bg }}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.listing_price ? `$${r.listing_price.toLocaleString()}` : "—"}
                    {r.estimated_market_value && <div className="text-xs text-muted-foreground line-through">${r.estimated_market_value.toLocaleString()}</div>}
                  </td>
                  <td className="p-3 font-medium" style={{ color: r.discount_percent && r.discount_percent > 20 ? "#DC2626" : undefined }}>
                    {r.discount_percent ? `-${Math.round(r.discount_percent)}%` : "—"}
                  </td>
                  <td className="p-3">
                    {r.ai_investment_score != null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold">
                        <Sparkles className="w-3 h-3" /> {r.ai_investment_score}/100
                      </span>
                    ) : <span className="text-xs text-muted-foreground">non analysé</span>}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${r.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runAnalysis(r.id)}
                        disabled={analyzingId === r.id}
                        className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
                        title="Analyser avec IA"
                      >
                        {analyzingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setStatus(r.id, r.status === "active" ? "archived" : "active")}
                        className="p-1.5 rounded hover:bg-muted"
                        title={r.status === "active" ? "Archiver" : "Réactiver"}
                      >
                        {r.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
