import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { refreshCurrencyRates } from "@/lib/currency";
import { Save, Plus, Trash2 } from "lucide-react";

interface Row {
  country: string;
  code: string;
  symbol: string;
  rate: number;
  locale: string;
  updated_at?: string;
}

export function CurrencyRatesTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [newRow, setNewRow] = useState<Row>({ country: "", code: "", symbol: "", rate: 1, locale: "fr-FR" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("currency_rates").select("*").order("country");
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setDirty({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (country: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.country === country ? { ...r, ...patch } : r)));
    setDirty((d) => ({ ...d, [country]: true }));
  };

  const saveOne = async (r: Row) => {
    if (!(r.rate > 0)) { toast.error("Le taux doit être > 0"); return; }
    setBusy(true);
    const { error } = await supabase.from("currency_rates").update({
      code: r.code, symbol: r.symbol, rate: r.rate, locale: r.locale,
    }).eq("country", r.country);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Taux ${r.country} mis à jour`);
      setDirty((d) => { const n = { ...d }; delete n[r.country]; return n; });
      await refreshCurrencyRates();
    }
  };

  const remove = async (country: string) => {
    if (!confirm(`Supprimer la monnaie pour ${country} ?`)) return;
    const { error } = await supabase.from("currency_rates").delete().eq("country", country);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); await load(); await refreshCurrencyRates(); }
  };

  const add = async () => {
    const country = newRow.country.trim().toUpperCase();
    if (!country || !newRow.code || !newRow.symbol || !(newRow.rate > 0)) {
      toast.error("Remplir tous les champs"); return;
    }
    const { error } = await supabase.from("currency_rates").insert({ ...newRow, country });
    if (error) toast.error(error.message);
    else {
      toast.success(`${country} ajouté`);
      setNewRow({ country: "", code: "", symbol: "", rate: 1, locale: "fr-FR" });
      await load(); await refreshCurrencyRates();
    }
  };

  if (loading) return <div className="mt-6 text-muted-foreground text-sm">Chargement…</div>;

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[80px_80px_80px_120px_120px_140px_auto] gap-2 p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-muted/30">
          <div>Pays (ISO)</div><div>Code</div><div>Symbole</div><div>Taux (1 USD =)</div><div>Locale</div><div>Maj</div><div></div>
        </div>
        {rows.map((r) => (
          <div key={r.country} className="grid grid-cols-[80px_80px_80px_120px_120px_140px_auto] gap-2 p-3 items-center border-b border-border last:border-b-0 text-sm">
            <div className="font-mono font-bold">{r.country}</div>
            <input value={r.code} onChange={(e) => update(r.country, { code: e.target.value.toUpperCase() })} className="px-2 py-1 bg-muted rounded text-sm" />
            <input value={r.symbol} onChange={(e) => update(r.country, { symbol: e.target.value })} className="px-2 py-1 bg-muted rounded text-sm" />
            <input type="number" step="0.0001" value={r.rate} onChange={(e) => update(r.country, { rate: Number(e.target.value) })} className="px-2 py-1 bg-muted rounded text-sm font-mono" />
            <input value={r.locale} onChange={(e) => update(r.country, { locale: e.target.value })} className="px-2 py-1 bg-muted rounded text-sm" />
            <div className="text-[10px] text-muted-foreground">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}</div>
            <div className="flex gap-1 justify-end">
              <button disabled={!dirty[r.country] || busy} onClick={() => saveOne(r)} className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs disabled:opacity-30 inline-flex items-center gap-1"><Save size={12} /> Save</button>
              <button onClick={() => remove(r.country)} className="bg-destructive/10 text-destructive rounded p-1.5"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Ajouter un pays</div>
        <div className="grid grid-cols-[80px_80px_80px_120px_120px_auto] gap-2 items-center">
          <input placeholder="SN" maxLength={2} value={newRow.country} onChange={(e) => setNewRow({ ...newRow, country: e.target.value.toUpperCase() })} className="px-2 py-1 bg-muted rounded text-sm font-mono" />
          <input placeholder="XOF" value={newRow.code} onChange={(e) => setNewRow({ ...newRow, code: e.target.value.toUpperCase() })} className="px-2 py-1 bg-muted rounded text-sm" />
          <input placeholder="FCFA" value={newRow.symbol} onChange={(e) => setNewRow({ ...newRow, symbol: e.target.value })} className="px-2 py-1 bg-muted rounded text-sm" />
          <input type="number" step="0.0001" value={newRow.rate} onChange={(e) => setNewRow({ ...newRow, rate: Number(e.target.value) })} className="px-2 py-1 bg-muted rounded text-sm font-mono" />
          <input value={newRow.locale} onChange={(e) => setNewRow({ ...newRow, locale: e.target.value })} className="px-2 py-1 bg-muted rounded text-sm" />
          <button onClick={add} className="bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs inline-flex items-center gap-1"><Plus size={12} /> Ajouter</button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Les changements s'appliquent immédiatement à tous les visiteurs (cache rafraîchi).</p>
    </div>
  );
}
