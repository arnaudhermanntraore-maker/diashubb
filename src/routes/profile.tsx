import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User as UserIcon, Mail, Globe, Shield, CheckCircle2, Coins, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Mon profil — Diashubb" }] }),
  component: ProfilePage,
});

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  lang_pref: string;
  verified: boolean;
  diascoins: number;
  created_at: string;
}

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { user, roles, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
        setCountry(data.country ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, country }).eq("id", user.id);
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setProfile((p) => p ? { ...p, full_name: fullName, country } : p);
    setEditing(false);
    setMsg(fr ? "Profil mis à jour ✓" : "Profile updated ✓");
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-10 max-w-3xl text-sm text-muted-foreground">{fr ? "Chargement…" : "Loading…"}</div>;
  }

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-display font-bold"
          style={{ background: "var(--tf-blue)" }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            {profile?.full_name || (fr ? "Sans nom" : "No name")}
            {profile?.verified && <CheckCircle2 size={18} style={{ color: "var(--tf-green)" }} />}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {roles.map((r) => (
              <span key={r} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-semibold">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {msg && <div className="mb-4 text-sm px-3 py-2 rounded-lg bg-muted">{msg}</div>}

      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold">{fr ? "Informations" : "Information"}</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-tf-blue">{fr ? "Modifier" : "Edit"}</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setFullName(profile?.full_name ?? ""); setCountry(profile?.country ?? ""); }} className="text-xs font-semibold text-muted-foreground">{fr ? "Annuler" : "Cancel"}</button>
              <button onClick={save} disabled={saving} className="text-xs font-semibold px-3 py-1 rounded-md text-white" style={{ background: "var(--tf-blue)" }}>
                {saving ? (fr ? "…" : "…") : (fr ? "Enregistrer" : "Save")}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <Row icon={<Mail size={14} />} label={fr ? "E-mail" : "Email"} value={profile?.email ?? "—"} />
          <Row
            icon={<UserIcon size={14} />}
            label={fr ? "Nom complet" : "Full name"}
            value={editing ? (
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border border-border rounded px-2 py-1 text-sm w-full" />
            ) : (profile?.full_name || "—")}
          />
          <Row
            icon={<Globe size={14} />}
            label={fr ? "Pays" : "Country"}
            value={editing ? (
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="border border-border rounded px-2 py-1 text-sm w-full" />
            ) : (profile?.country || "—")}
          />
          <Row icon={<Shield size={14} />} label={fr ? "Statut" : "Status"} value={profile?.verified ? (fr ? "Vérifié" : "Verified") : (fr ? "Non vérifié" : "Unverified")} />
          <Row icon={<Coins size={14} />} label="DiasCoins" value={String(profile?.diascoins ?? 0)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/dashboard" className="text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-muted">{fr ? "Mon espace" : "My dashboard"}</Link>
        <Link to="/messages" className="text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-muted">{fr ? "Messages" : "Messages"}</Link>
        <button
          onClick={() => signOut()}
          className="text-sm font-semibold px-4 py-2 rounded-full border border-border hover:bg-muted inline-flex items-center gap-1.5 ml-auto"
        >
          <LogOut size={14} /> {fr ? "Déconnexion" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground w-28 shrink-0">{label}</div>
      <div className="flex-1 text-foreground">{value}</div>
    </div>
  );
}
