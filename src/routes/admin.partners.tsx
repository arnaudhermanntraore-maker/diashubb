import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  listPartnerApplications,
  updatePartnerApplicationStatus,
  getPartnerApplicationDocumentUrl,
} from "@/server/partner-applications-admin.functions";

export const Route = createFileRoute("/admin/partners")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AdminPartners,
});

const STATUSES = ["pending", "reviewing", "approved", "rejected"] as const;
const KINDS = ["all", "contractor", "broker", "agent", "surveyor"] as const;
type Status = typeof STATUSES[number];
type Kind = typeof KINDS[number];

interface Row {
  id: string; kind: string; name: string; email: string; phone: string;
  specialty: string | null; city: string | null; region: string | null;
  experience_years: number | null; license_number: string | null;
  bio: string | null; document_url: string | null;
  status: Status; created_at: string; updated_at: string; user_id: string | null;
}

const statusStyle: Record<Status, string> = {
  pending: "bg-muted text-foreground",
  reviewing: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  approved: "bg-green-500/15 text-green-700 dark:text-green-300",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
};

function AdminPartners() {
  const { isAdmin, loading } = useAuth();
  const list = useServerFn(listPartnerApplications);
  const updateStatus = useServerFn(updatePartnerApplicationStatus);
  const getDocUrl = useServerFn(getPartnerApplicationDocumentUrl);

  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterKind, setFilterKind] = useState<Kind>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const reload = async () => {
    setRefreshing(true);
    try {
      const res = await list({ data: { status: filterStatus, kind: filterKind } });
      setRows(res.rows as Row[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { if (isAdmin) reload(); /* eslint-disable-next-line */ }, [isAdmin, filterStatus, filterKind]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, reviewing: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const setStatus = async (id: string, status: Status) => {
    setBusy(id);
    try {
      await updateStatus({ data: { id, status } });
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Marked ${status}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openDoc = async (id: string) => {
    try {
      const { url } = await getDocUrl({ data: { id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (loading) return <div className="p-10">…</div>;
  if (!isAdmin) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-display font-bold">403</h1>
      <p className="text-muted-foreground mt-2">Admin access required.</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">← Admin</Link>
          <h1 className="text-3xl font-display font-bold mt-1">Partner Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">Review contractor, broker, agent and surveyor signups.</p>
        </div>
        <button onClick={reload} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full border border-border hover:bg-muted">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        {STATUSES.map((s) => (
          <div key={s} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s}</div>
            <div className="text-2xl font-display font-bold mt-1">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | Status)} className="px-3 py-2 bg-muted rounded-xl text-sm outline-none">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterKind} onChange={(e) => setFilterKind(e.target.value as Kind)} className="px-3 py-2 bg-muted rounded-xl text-sm outline-none">
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {rows.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm">No applications match these filters.</div>
        )}
        {rows.map((r) => {
          const isOpen = openId === r.id;
          return (
            <div key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusStyle[r.status]}`}>{r.status}</span>
                    <span className="text-xs uppercase text-muted-foreground">{r.kind}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="font-semibold mt-1">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.email} · {r.phone}</div>
                  {(r.city || r.region) && <div className="text-xs text-muted-foreground">{[r.city, r.region].filter(Boolean).join(", ")}</div>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {r.document_url && (
                    <button onClick={() => openDoc(r.id)} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">
                      <ExternalLink size={12} /> Document
                    </button>
                  )}
                  <button onClick={() => setOpenId(isOpen ? null : r.id)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">
                    {isOpen ? "Hide" : "Details"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs bg-muted/40 rounded-xl p-3">
                  <Field label="Specialty" v={r.specialty} />
                  <Field label="License #" v={r.license_number} />
                  <Field label="Experience" v={r.experience_years != null ? `${r.experience_years} yr` : null} />
                  <Field label="User ID" v={r.user_id ? r.user_id.slice(0, 8) + "…" : "anon"} />
                  {r.bio && (
                    <div className="sm:col-span-2">
                      <div className="text-muted-foreground mb-1">Bio</div>
                      <div className="whitespace-pre-wrap">{r.bio}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={busy === r.id || r.status === s}
                    onClick={() => setStatus(r.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${r.status === s ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-muted"} disabled:opacity-50`}
                  >
                    {busy === r.id ? <Loader2 size={12} className="animate-spin inline" /> : s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, v }: { label: string; v: string | null }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{v ?? "—"}</div>
    </div>
  );
}
