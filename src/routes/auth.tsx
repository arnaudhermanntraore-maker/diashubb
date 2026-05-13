import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Auth,
});

function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  if (loading || user) return <AuthLoadingSpinner />;
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
      });
      if (error) toast.error(error.message); else { toast.success("Check your email to confirm."); navigate({ to: "/" }); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message); else { toast.success("Welcome back"); navigate({ to: "/dashboard" }); }
    }
    setBusy(false);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-soft">
        <h1 className="text-2xl font-display font-bold mb-1">{mode === "in" ? t("auth.signIn") : t("auth.signUp")}</h1>
        <p className="text-sm text-muted-foreground mb-6">Diashubb</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")} required className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary" />}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")} required className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")} required minLength={6} className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary" />
          <button disabled={busy} className="w-full bg-primary text-primary-foreground rounded-full py-3 font-medium disabled:opacity-50">{busy ? "…" : t("auth.continue")}</button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted-foreground hover:text-primary">
          {mode === "in" ? t("auth.needAccount") : t("auth.haveAccount")} <span className="text-primary font-medium">{mode === "in" ? t("auth.signUp") : t("auth.signIn")}</span>
        </button>
        <Link to="/" className="block text-center mt-6 text-xs text-muted-foreground">← Home</Link>
      </div>
    </div>
  );
}
