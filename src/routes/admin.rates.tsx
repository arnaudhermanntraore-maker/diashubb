import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Save, Plus, Trash2, Search, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { upsertRate, deleteRate } from "@/server/rates.functions";

interface RateRow {
  id: string;
  currency_code: string;
  rate_from_usd: number;
  trend_24h: number;
  source: string;
  updated_at: string;
  updated_by: string | null;
}

export const Route = createFileRoute("/admin/rates")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: RatesAdmin,
});

function validate(code: string, rate: number, trend: number): string | null {
  if (!/^[A-Z]{3}$/.test(code)) return "Code ISO 4217 invalide (3 lettres majuscules)";
  if (!Number.isFinite(rate) || rate <= 0) return "Le taux doit être > 0";
  if (rate > 1_000_000) return "Taux improbable (> 1 000 000)";
  if (!Number.isFinite(trend) || trend < -1 || trend > 1) return "Trend 24h doit être entre -1 et +1 (ex: 0.012 = +1.2%)";
  return null;
}

function RatesAdmin() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const { isAdmin, roles, user, loading: authLoading } = useAuth();
  const isSuper = roles.includes("super_admin");
  const canEdit = isSuper;

  const [rows, setRows] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, Partial<RateRow>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [newRow, setNewRow] = useState({ currency_code: "", rate_from_usd: 1, trend_24h: 0 });

  const upsertFn = useServerFn(upsertRate);
  const deleteFn = useServerFn(deleteRate);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("rate_config").select("*").order("currency_code");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as RateRow[]);
    setDirty({});
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const knownNames = useMemo(() => Object.fromEntries(CURRENCIES.map((c) => [c.code, c.name])), []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (!q) return true;
    const s = `${r.currency_code} ${knownNames[r.currency_code] ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  }), [rows, q, knownNames]);

  const patch = (id: string, p: Partial<RateRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDirty((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...p } }));
  };

  const saveOne = async (r: RateRow) => {
    if (!canEdit) return;
    const err = validate(r.currency_code, Number(r.rate_from_usd), Number(r.trend_24h));
    if (err) { toast.error(err); return; }
    setBusy(r.id);
    try {
      await upsertFn({ data: { currency_code: r.currency_code, rate_from_usd: Number(r.rate_from_usd), trend_24h: Number(r.trend_24h) } });
      toast.success(`${r.currency_code} ${fr ? "mis à jour" : "updated"}`);
      setDirty((d) => { const n = { ...d }; delete n[r.id]; return n; });
    } catch (e) {
      toast.error((e as Error).message ?? "Error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (r: RateRow) => {
    if (!canEdit) return;
    if (!confirm(fr ? `Supprimer le taux ${r.currency_code} ?` : `Delete rate ${r.currency_code}?`)) return;
    try {
      await deleteFn({ data: { currency_code: r.currency_code } });
      toast.success(fr ? "Supprimé" : "Deleted");
      load();
    } catch (e) {
      toast.error((e as Error).message ?? "Error");
    }
  };

  const add = async () => {
    if (!canEdit) return;
    const code = newRow.currency_code.trim().toUpperCase();
    const err = validate(code, Number(newRow.rate_from_usd), Number(newRow.trend_24h));
    if (err) { toast.error(err); return; }
    if (rows.some((r) => r.currency_code === code)) { toast.error(fr ? "Devise déjà existante" : "Currency already exists"); return; }
    try {
      await upsertFn({ data: { currency_code: code, rate_from_usd: Number(newRow.rate_from_usd), trend_24h: Number(newRow.trend_24h) } });
      toast.success(`${code} ${fr ? "ajouté" : "added"}`);
      setNewRow({ currency_code: "", rate_from_usd: 1, trend_24h: 0 });
      load();
    } catch (e) {
      toast.error((e as Error).message ?? "Error");
    }
  };

  if (authLoading) return <div className="p-10 text-muted-foreground">…</div>;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold">403</h1>
        <p className="text-muted-foreground mt-2">{fr ? "Accès admin requis." : "Admin access required."}</p>
      </div>
    );
  }

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{fr ? "Taux de change" : "Exchange Rates"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fr ? "Gérez les taux servis aux convertisseurs et widgets diaspora." : "Manage rates served to the diaspora converters and widgets."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">← Admin</Link>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-sm bg-card border border-border rounded-full px-4 py-2 hover:bg-muted">
            <RefreshCw size={14} /> {fr ? "Rafraîchir" : "Refresh"}
          </button>
        </div>
      </div>

      {!canEdit && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm">
          {fr
            ? "Lecture seule — seul le super administrateur peut modifier les taux."
            : "Read-only — only the super admin can edit rates."}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={fr ? "Rechercher une devise…" : "Search currency…"}
            className="w-full pl-9 pr-3 py-2 bg-muted rounded-xl text-sm outline-none"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length} · {dirtyCount > 0 && (fr ? `${dirtyCount} non sauvegardés` : `${dirtyCount} unsaved`)}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 text-muted-foreground text-sm">{fr ? "Chargement…" : "Loading…"}</div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[90px_1fr_140px_140px_120px_140px_auto] gap-2 p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-muted/30">
            <div>Code</div>
            <div>{fr ? "Devise" : "Currency"}</div>
            <div>1 USD =</div>
            <div>Trend 24h</div>
            <div>Source</div>
            <div>{fr ? "Mis à jour" : "Updated"}</div>
            <div></div>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">{fr ? "Aucun taux." : "No rates."}</div>
          )}
          {filtered.map((r) => {
            const isDirty = !!dirty[r.id];
            const trendIcon = r.trend_24h > 0 ? <TrendingUp size={12} className="text-success" /> : r.trend_24h < 0 ? <TrendingDown size={12} className="text-destructive" /> : <Minus size={12} className="text-muted-foreground" />;
            return (
              <div key={r.id} className={`grid grid-cols-[90px_1fr_140px_140px_120px_140px_auto] gap-2 p-3 items-center border-b border-border last:border-b-0 text-sm ${isDirty ? "bg-amber-50/50" : ""}`}>
                <div className="font-mono font-bold">{r.currency_code}</div>
                <div className="text-muted-foreground truncate">{knownNames[r.currency_code] ?? "—"}</div>
                <input
                  type="number"
                  step="0.0001"
                  min={0}
                  disabled={!canEdit}
                  value={r.rate_from_usd}
                  onChange={(e) => patch(r.id, { rate_from_usd: Number(e.target.value) })}
                  className="px-2 py-1 bg-muted rounded text-sm font-mono disabled:opacity-60"
                />
                <div className="flex items-center gap-1.5">
                  {trendIcon}
                  <input
                    type="number"
                    step="0.001"
                    min={-1}
                    max={1}
                    disabled={!canEdit}
                    value={r.trend_24h}
                    onChange={(e) => patch(r.id, { trend_24h: Number(e.target.value) })}
                    className="px-2 py-1 bg-muted rounded text-sm font-mono w-full disabled:opacity-60"
                  />
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">{r.source}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</div>
                <div className="flex gap-1 justify-end">
                  <button
                    disabled={!canEdit || !isDirty || busy === r.id}
                    onClick={() => saveOne(r)}
                    className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs disabled:opacity-30 inline-flex items-center gap-1"
                  >
                    <Save size={12} /> {fr ? "Save" : "Save"}
                  </button>
                  <button
                    disabled={!canEdit}
                    onClick={() => remove(r)}
                    className="bg-destructive/10 text-destructive rounded p-1.5 disabled:opacity-30"
                    aria-label="delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            {fr ? "Ajouter une devise" : "Add a currency"}
          </div>
          <div className="grid grid-cols-[100px_140px_140px_auto] gap-2 items-center">
            <input
              placeholder="XOF"
              maxLength={3}
              value={newRow.currency_code}
              onChange={(e) => setNewRow({ ...newRow, currency_code: e.target.value.toUpperCase() })}
              className="px-2 py-1 bg-muted rounded text-sm font-mono"
            />
            <input
              type="number"
              step="0.0001"
              placeholder="1 USD ="
              value={newRow.rate_from_usd}
              onChange={(e) => setNewRow({ ...newRow, rate_from_usd: Number(e.target.value) })}
              className="px-2 py-1 bg-muted rounded text-sm font-mono"
            />
            <input
              type="number"
              step="0.001"
              placeholder="Trend (e.g. 0.01)"
              value={newRow.trend_24h}
              onChange={(e) => setNewRow({ ...newRow, trend_24h: Number(e.target.value) })}
              className="px-2 py-1 bg-muted rounded text-sm font-mono"
            />
            <button onClick={add} className="bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs inline-flex items-center gap-1 justify-center">
              <Plus size={12} /> {fr ? "Ajouter" : "Add"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {fr
          ? "Format trend : 0.012 = +1.2 % sur 24 h. Les changements s'appliquent aux nouveaux chargements (cache 1 h)."
          : "Trend format: 0.012 = +1.2% over 24h. Changes apply on next load (1h cache)."}
      </p>
    </div>
  );
}
