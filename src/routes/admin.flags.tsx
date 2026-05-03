import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFlags, type FlagRow } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";
import { Search, Pencil, Download, X } from "lucide-react";

export const Route = createFileRoute("/admin/flags")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: FlagsAdmin,
});

const CATEGORIES = ["all", "core", "ai", "payments", "boost", "diaspora", "market", "property", "gamification", "safety", "content", "notif"] as const;

function FlagsAdmin() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const { isAdmin, roles, user } = useAuth();
  const isSuper = roles.includes("super_admin");
  const { rows, refresh, loading } = useFlags();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof CATEGORIES[number]>("all");
  const [editing, setEditing] = useState<FlagRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!loading && !isAdmin) {
    return <div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-display font-bold">403</h1></div>;
  }

  const stats = useMemo(() => ({
    total: rows.length,
    enabled: rows.filter((r) => r.enabled).length,
    disabled: rows.filter((r) => !r.enabled).length,
    last: rows.reduce((acc, r) => (r.updated_at > acc ? r.updated_at : acc), ""),
  }), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (cat !== "all" && r.category !== cat) return false;
    if (q) {
      const s = `${r.key} ${r.label_fr ?? ""} ${r.label_en ?? ""}`.toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "") || a.key.localeCompare(b.key)), [rows, q, cat]);

  const grouped = useMemo(() => {
    const g: Record<string, FlagRow[]> = {};
    for (const r of filtered) { const k = r.category ?? "other"; (g[k] ??= []).push(r); }
    return g;
  }, [filtered]);

  const toggle = async (r: FlagRow, value?: boolean) => {
    if (!isSuper) { toast.error(fr ? "Lecture seule" : "Read-only"); return; }
    const next = value ?? !r.enabled;
    const { error } = await supabase.from("feature_flags").update({ enabled: next, updated_by: user?.id, updated_at: new Date().toISOString() }).eq("key", r.key);
    if (error) { toast.error(error.message); return; }
    toast.success(`${fr ? "✓" : "✓"} ${r.label_fr ?? r.key} ${next ? (fr ? "activé" : "enabled") : (fr ? "désactivé" : "disabled")}`);
    refresh();
  };

  const bulk = async (value: boolean) => {
    if (!isSuper || selected.size === 0) return;
    const { error } = await supabase.from("feature_flags").update({ enabled: value, updated_by: user?.id, updated_at: new Date().toISOString() }).in("key", Array.from(selected));
    if (error) toast.error(error.message); else { toast.success(fr ? `${selected.size} flags mis à jour` : `${selected.size} flags updated`); setSelected(new Set()); refresh(); }
  };

  const exportCsv = () => {
    const head = "key,label_fr,label_en,category,enabled,updated_at\n";
    const body = rows.map((r) => `${r.key},"${(r.label_fr ?? "").replace(/"/g, '""')}","${(r.label_en ?? "").replace(/"/g, '""')}",${r.category ?? ""},${r.enabled},${r.updated_at}`).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "feature_flags.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">Feature Flags</h1>
          <p className="text-sm text-muted-foreground mt-1">{fr ? "Activez ou désactivez les fonctionnalités instantanément — sans redéploiement." : "Enable or disable features instantly — no redeployment."}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">← Admin</Link>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm bg-card border border-border rounded-full px-4 py-2 hover:bg-muted"><Download size={14}/> CSV</button>
        </div>
      </div>

      {!isSuper && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm">
          {fr ? "Vous avez accès en lecture seule. Seul le super administrateur peut modifier les feature flags." : "Read-only access. Only the super admin can modify feature flags."}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat label={fr ? "Total" : "Total"} value={stats.total} />
        <Stat label={fr ? "Activés" : "Enabled"} value={stats.enabled} color="text-green-600" />
        <Stat label={fr ? "Désactivés" : "Disabled"} value={stats.disabled} color="text-muted-foreground" />
        <Stat label={fr ? "Dernière maj" : "Last update"} value={stats.last ? new Date(stats.last).toLocaleDateString() : "—"} small />
      </div>

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={fr ? "Rechercher..." : "Search flags..."} className="w-full pl-9 pr-3 py-2 bg-muted rounded-xl text-sm outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 text-xs rounded-full border ${cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      {selected.size > 0 && isSuper && (
        <div className="mt-4 bg-tf-navy text-white rounded-xl p-3 flex items-center justify-between gap-2 sticky top-14 z-20">
          <span className="text-sm">{selected.size} {fr ? "sélectionnés" : "selected"}</span>
          <div className="flex gap-2">
            <button onClick={() => bulk(true)} className="bg-green-600 rounded-full px-4 py-1.5 text-xs font-medium">{fr ? "Activer" : "Enable all"}</button>
            <button onClick={() => bulk(false)} className="bg-gray-600 rounded-full px-4 py-1.5 text-xs font-medium">{fr ? "Désactiver" : "Disable all"}</button>
            <button onClick={() => setSelected(new Set())} className="text-xs px-2"><X size={14}/></button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">── {category} ──</div>
            <div className="space-y-1.5">
              {items.map((r) => (
                <div key={r.key} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                  {isSuper && (
                    <input type="checkbox" checked={selected.has(r.key)} onChange={(e) => {
                      const s = new Set(selected); if (e.target.checked) s.add(r.key); else s.delete(r.key); setSelected(s);
                    }} className="accent-primary" />
                  )}
                  <button
                    type="button"
                    disabled={!isSuper}
                    onClick={() => toggle(r)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${r.enabled ? "bg-green-600" : "bg-gray-400"} ${!isSuper ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    aria-label="toggle"
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${r.enabled ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-muted-foreground">{r.key}</div>
                    <div className="font-semibold text-sm">{fr ? r.label_fr : r.label_en}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{fr ? r.description_fr : r.description_en}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${r.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {r.enabled ? (fr ? "● Actif" : "● Enabled") : (fr ? "○ Inactif" : "○ Disabled")}
                  </span>
                  {isSuper && (
                    <button onClick={() => setEditing(r)} className="text-muted-foreground hover:text-foreground p-1"><Pencil size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">{fr ? "Aucun flag" : "No flags"}</p>}
      </div>

      {editing && <EditModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} userId={user?.id} />}
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className={`${small ? "text-base" : "text-2xl"} font-display font-bold ${color ?? "text-primary"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function EditModal({ row, onClose, onSaved, userId }: { row: FlagRow; onClose: () => void; onSaved: () => void; userId?: string }) {
  const [labelFr, setLabelFr] = useState(row.label_fr ?? "");
  const [labelEn, setLabelEn] = useState(row.label_en ?? "");
  const [descFr, setDescFr] = useState(row.description_fr ?? "");
  const [descEn, setDescEn] = useState(row.description_en ?? "");
  const [enabled, setEnabled] = useState(row.enabled);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("feature_flags").update({
      label_fr: labelFr, label_en: labelEn, description_fr: descFr, description_en: descEn, enabled, updated_by: userId, updated_at: new Date().toISOString(),
    }).eq("key", row.key);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-display font-bold">Edit flag</h3>
        <div className="mt-1 text-xs font-mono text-muted-foreground">{row.key}</div>
        <div className="mt-4 space-y-3">
          <Field label="Label FR" value={labelFr} onChange={setLabelFr} />
          <Field label="Label EN" value={labelEn} onChange={setLabelEn} />
          <Field label="Description FR" value={descFr} onChange={setDescFr} textarea />
          <Field label="Description EN" value={descEn} onChange={setDescEn} textarea />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-primary w-4 h-4" /> Enabled
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-border text-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="px-4 py-2 rounded-full bg-green-600 text-white text-sm disabled:opacity-50">Save changes</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none" />
      )}
    </div>
  );
}
