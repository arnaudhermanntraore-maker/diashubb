import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Loading ou déjà connecté → spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Déjà connecté → dashboard
  if (user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Bienvenue sur Diashubb !");
      navigate({ to: "/dashboard" });
    }
    setBusy(false);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-soft">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: "var(--tf-blue)" }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="white">
              <path d="M8 1L2 5v8h4v-4h4v4h4V5L8 1z"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm">Diashubb</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Global
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-display font-bold mb-1">
          Connexion
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Accédez à votre espace Diashubb
        </p>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Adresse e-mail"
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            minLength={6}
            autoComplete="current-password"
            className="w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground rounded-full py-3 font-medium disabled:opacity-50"
          >
            {busy ? "Connexion…" : "Se connecter →"}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Signup CTA */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?
          </p>
          <Link
            to="/signup"
            className="block w-full py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm text-center hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Créer mon compte gratuitement →
          </Link>
          <p className="text-xs text-muted-foreground">
            ✓ Gratuit · ✓ 100 DiasCoins offerts · ✓ Sans carte bancaire
          </p>
        </div>

        {/* Back home */}
        <Link
          to="/"
          className="block text-center mt-6 text-xs text-muted-foreground hover:text-primary"
        >
          ← Accueil
        </Link>
      </div>
    </div>
  );
}
