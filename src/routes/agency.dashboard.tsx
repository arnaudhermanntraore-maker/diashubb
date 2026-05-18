import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { toast } from "sonner";
import { AlertTriangle, MessageSquareWarning, FileWarning } from "lucide-react";

interface AuditRow { id: string; user_id: string | null; action: string; created_at: string; ip: string | null; metadata: Record<string, unknown>; }
interface DisputeRow { id: string; transaction_id: string; opened_by: string; reason: string; description: string; status: string; created_at: string; }
interface FlaggedMsg { id: string; sender_id: string; receiver_id: string; flag_reason: string | null; created_at: string; }

export const Route = createFileRoute("/admin/security")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: () => <AdminGuard><SecurityPage /></AdminGuard>,
});

function SecurityPage() {
  const [tab, setTab] = useState<"audit" | "disputes" | "flagged">("audit");
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [flagged, setFlagged] = useState<FlaggedMsg[]>([]);

  useEffect(() => {
    (async () => {
      const [a, d, m] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("messages").select("id, sender_id, receiver_id, flag_reason, created_at").eq("flagged", true).order("created_at", { ascending: false }).limit(200),
      ]);
      setAudit((a.data ?? []) as AuditRow[]);
      setDisputes((d.data ?? []) as DisputeRow[]);
      setFlagged((m.data ?? []) as FlaggedMsg[]);
    })();
  }, []);

  const resolveDispute = async (id: string, resolution: string) => {
    const { error } = await supabase.from("disputes").update({ status: "resolved", resolution }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Litige résolu");
    setDisputes(disputes.map((d) => d.id === id ? { ...d, status: "resolved", resolution } : d));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Sécurité & Modération</h1>
        <p className="text-sm text-muted-foreground mt-1">Audit logs, litiges, messages signalés</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Audit logs" value={audit.length} icon={FileWarning} />
        <Stat label="Litiges ouverts" value={disputes.filter(d => d.status === "open").length} icon={AlertTriangle} accent />
        <Stat label="Messages signalés" value={flagged.length} icon={MessageSquareWarning} />
      </div>

      <div className="flex gap-2 border-b border-border mb-4">
        {([
          ["audit", "Audit logs"],
          ["disputes", "Litiges"],
          ["flagged", "Messages signalés"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium ${tab === k ? "border-b-2 border-primary text-primary -mb-px" : "text-muted-foreground"}`}>{label}</button>
        ))}
      </div>

      {tab === "audit" && (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border max-h-[600px] overflow-y-auto">
          {audit.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Aucune entrée.</div>}
          {audit.map((a) => (
            <div key={a.id} className="p-3 text-xs font-mono">
              <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              {" · "}<span className="text-primary">{a.action}</span>
              {a.user_id && <span className="text-muted-foreground"> · user {a.user_id.slice(0, 8)}</span>}
              {a.ip && <span className="text-muted-foreground"> · {a.ip}</span>}
              {Object.keys(a.metadata ?? {}).length > 0 && (
                <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap">{JSON.stringify(a.metadata, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "disputes" && (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {disputes.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Aucun litige.</div>}
          {disputes.map((d) => (
            <div key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.reason}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${d.status === "open" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>{d.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
                  <div className="text-[11px] text-muted-foreground mt-1 font-mono">tx {d.transaction_id.slice(0, 8)} · ouvert par {d.opened_by.slice(0, 8)} · {new Date(d.created_at).toLocaleString()}</div>
                </div>
                {d.status === "open" && (
                  <div className="flex gap-1.5">
                    <button onClick={() => resolveDispute(d.id, "Résolu en faveur de l'acheteur")} className="text-xs px-3 py-1.5 rounded-full bg-muted">Acheteur</button>
                    <button onClick={() => resolveDispute(d.id, "Résolu en faveur du vendeur")} className="text-xs px-3 py-1.5 rounded-full bg-muted">Vendeur</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "flagged" && (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {flagged.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Aucun message signalé.</div>}
          {flagged.map((m) => (
            <div key={m.id} className="p-3 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-destructive" />
                <span className="text-xs font-mono text-muted-foreground">{m.sender_id.slice(0, 8)} → {m.receiver_id.slice(0, 8)}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              {m.flag_reason && <p className="text-xs text-muted-foreground mt-1">Raison : {m.flag_reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof AlertTriangle; accent?: boolean }) {
  return (
    <div className={`bg-card border rounded-2xl p-4 ${accent && value > 0 ? "border-destructive/40" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-display font-bold ${accent && value > 0 ? "text-destructive" : "text-primary"}`}>{value}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
        </div>
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
    </div>
  );
}
