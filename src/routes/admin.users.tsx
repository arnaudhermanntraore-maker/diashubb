import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, Shield, UserCheck, Ban } from "lucide-react";

type Role = "super_admin" | "admin" | "agent" | "buyer" | "contractor" | "broker" | "surveyor";
const ALL_ROLES: Role[] = ["super_admin", "admin", "agent", "buyer", "contractor", "broker", "surveyor"];

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  verified: boolean;
  diascoins: number;
  created_at: string;
  roles: Role[];
}

export const Route = createFileRoute("/admin/users")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: () => <AdminGuard><UsersPage /></AdminGuard>,
});

function UsersPage() {
  const { roles: myRoles } = useAuth();
  const isSuper = myRoles.includes("super_admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, country, verified, diascoins, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, Role[]>();
    (rolesData ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      byUser.set(r.user_id, arr);
    });
    setUsers((profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] })) as UserRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: Role, has: boolean) => {
    if (!isSuper) { toast.error("Réservé au Super Admin"); return; }
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Rôle mis à jour");
    load();
  };

  const toggleVerified = async (u: UserRow) => {
    const { error } = await supabase.from("profiles").update({ verified: !u.verified }).eq("id", u.id);
    if (error) return toast.error(error.message);
    setUsers(users.map((x) => x.id === u.id ? { ...x, verified: !x.verified } : x));
  };

  const filtered = users.filter((u) => {
    if (!q) return true;
    const s = `${u.email ?? ""} ${u.full_name ?? ""} ${u.country ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} comptes · {users.filter(u => u.verified).length} vérifiés</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9 pr-4 py-2 bg-muted rounded-xl text-sm outline-none w-64" />
        </div>
      </div>

      {!isSuper && (
        <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm">
          Vous avez accès en lecture seule. Seul le super administrateur peut modifier les rôles.
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Aucun utilisateur.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap gap-4 items-start">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.full_name || "—"}</span>
                    {u.verified && <UserCheck className="w-4 h-4 text-success" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{u.country ?? "?"} · {u.diascoins} TC · {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((r) => {
                    const has = u.roles.includes(r);
                    return (
                      <button
                        key={r}
                        disabled={!isSuper}
                        onClick={() => toggleRole(u.id, r, has)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                          has ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVerified(u)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 inline-flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {u.verified ? "Dé-vérifier" : "Vérifier"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
