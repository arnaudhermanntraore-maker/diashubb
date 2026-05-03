import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { releaseEscrow, refundEscrow } from "@/server/payments.functions";
import { CurrencyRatesTab } from "@/components/admin/CurrencyRatesTab";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Admin,
});

interface FFlag { id: string; key: string; enabled: boolean; description: string | null; }
interface AuditRow { id: string; user_id: string | null; action: string; created_at: string; metadata: Record<string, unknown>; }
interface TxRow { id: string; buyer_id: string; seller_id: string; amount_usd: number; status: string; method: string; created_at: string; property_id: string | null; external_ref: string | null; }

function Admin() {
  const { t } = useTranslation();
  const { isAdmin, loading } = useAuth();
  const [flags, setFlags] = useState<FFlag[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [counts, setCounts] = useState({ users: 0, props: 0, txs: 0 });
  const [tab, setTab] = useState<"overview" | "flags" | "escrow" | "audit" | "rates">("overview");
  const [newFlag, setNewFlag] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const release = useServerFn(releaseEscrow);
  const refund = useServerFn(refundEscrow);

  const reloadTx = async () => {
    const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
    setTxs((data ?? []) as TxRow[]);
  };

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: f }, { data: a }, { count: u }, { count: p }, { count: tx }] = await Promise.all([
        supabase.from("feature_flags").select("*").order("key"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
      ]);
      setFlags((f ?? []) as FFlag[]); setAudit((a ?? []) as AuditRow[]);
      setCounts({ users: u ?? 0, props: p ?? 0, txs: tx ?? 0 });
      reloadTx();
    })();
  }, [isAdmin]);

  const handleRelease = async (id: string) => {
    setBusy(id);
    try { await release({ data: { transactionId: id } }); toast.success("Escrow released"); await reloadTx(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };
  const handleRefund = async (id: string) => {
    if (!confirm("Refund this transaction?")) return;
    setBusy(id);
    try { await refund({ data: { transactionId: id } }); toast.success("Refunded"); await reloadTx(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };



  const toggle = async (f: FFlag) => {
    const { error } = await supabase.from("feature_flags").update({ enabled: !f.enabled }).eq("id", f.id);
    if (error) toast.error(error.message); else setFlags(flags.map((x) => x.id === f.id ? { ...x, enabled: !x.enabled } : x));
  };
  const addFlag = async () => {
    if (!newFlag) return;
    const { data, error } = await supabase.from("feature_flags").insert({ key: newFlag, enabled: false }).select().single();
    if (error) toast.error(error.message); else { setFlags([...flags, data as FFlag]); setNewFlag(""); }
  };

  if (loading) return <div className="p-10">…</div>;
  if (!isAdmin) return <div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-display font-bold">403</h1><p className="text-muted-foreground mt-2">Admin access required.</p></div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-3xl font-display font-bold">{t("admin.title")}</h1>
      <div className="mt-6 flex gap-2 border-b border-border">
        {(["overview", "flags", "escrow", "audit"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{k}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Stat label={t("admin.users")} value={counts.users} />
          <Stat label={t("admin.listings")} value={counts.props} />
          <Stat label={t("admin.txs")} value={counts.txs} />
        </div>
      )}

      {tab === "flags" && (
        <div className="mt-6">
          <div className="flex gap-2 mb-4">
            <input value={newFlag} onChange={(e) => setNewFlag(e.target.value)} placeholder="new_flag_key" className="flex-1 px-4 py-2 bg-muted rounded-xl outline-none text-sm" />
            <button onClick={addFlag} className="bg-primary text-primary-foreground rounded-xl px-4 text-sm font-medium">Add</button>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {flags.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No flags yet.</div>}
            {flags.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4">
                <div><div className="font-mono text-sm">{f.key}</div><div className="text-xs text-muted-foreground">{f.description ?? ""}</div></div>
                <button onClick={() => toggle(f)} className={`relative w-12 h-6 rounded-full transition-colors ${f.enabled ? "bg-success" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-background rounded-full transition-all ${f.enabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "escrow" && (
        <div className="mt-6 bg-card border border-border rounded-2xl divide-y divide-border">
          {txs.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No transactions.</div>}
          {txs.map((tx) => {
            const canRelease = tx.status === "escrowed";
            const canRefund = ["escrowed", "pending"].includes(tx.status);
            const color = tx.status === "released" ? "text-success" : tx.status === "refunded" ? "text-muted-foreground" : tx.status === "escrowed" ? "text-accent-foreground" : "text-foreground";
            return (
              <div key={tx.id} className="flex items-center justify-between gap-3 p-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-display font-semibold">${Number(tx.amount_usd).toLocaleString()} <span className={`text-xs uppercase ml-2 ${color}`}>{tx.status}</span></div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{tx.method} · buyer {tx.buyer_id.slice(0,8)} → seller {tx.seller_id.slice(0,8)}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button disabled={!canRelease || busy === tx.id} onClick={() => handleRelease(tx.id)} className="bg-success text-success-foreground rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40">Release</button>
                  <button disabled={!canRefund || busy === tx.id} onClick={() => handleRefund(tx.id)} className="bg-muted rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40">Refund</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "audit" && (
        <div className="mt-6 bg-card border border-border rounded-2xl divide-y divide-border max-h-[600px] overflow-y-auto">
          {audit.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No audit entries.</div>}
          {audit.map((a) => (
            <div key={a.id} className="p-3 text-xs font-mono">
              <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              {" · "}<span className="text-primary">{a.action}</span>
              {a.user_id && <span className="text-muted-foreground"> · {a.user_id.slice(0, 8)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="text-3xl font-display font-bold text-primary">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
