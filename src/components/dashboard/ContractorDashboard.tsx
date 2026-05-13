import { Link } from "@tanstack/react-router";
import { Eye, Inbox, Wrench, CheckCircle2, Rocket, MessageCircle, Star, User } from "lucide-react";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import { EmptyState } from "./shared/EmptyState";
import type { Profile } from "./DashboardRouter";

export function ContractorDashboard({ profile }: { profile: Profile | null }) {
  const initials = (profile?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center font-bold">{initials}</div>
          <div>
            <h1 className="text-3xl font-display font-bold">{profile?.full_name || "Artisan"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Artisan · Contractor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${profile?.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {profile?.verified ? "✓ Profil vérifié" : "⏳ Vérification en cours"}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">⭐ — (0 avis)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="blue" icon={Eye} value={0} label="Vues du profil" />
        <KpiCard tone="green" icon={Inbox} value={0} label="Nouvelles demandes" />
        <KpiCard tone="amber" icon={Wrench} value={0} label="Missions en cours" />
        <KpiCard tone="purple" icon={CheckCircle2} value={0} label="Missions terminées" />
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-4">Demandes reçues</h2>
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={Wrench}
          title="Aucune demande pour le moment"
          description="Boostez votre profil pour recevoir plus de demandes"
          action={
            <Link to="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold">
              <Rocket size={16} /> Booster mon profil →
            </Link>
          }
        />
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-3">Profil à compléter</h2>
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: profile?.verified ? "80%" : "40%" }} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {profile?.verified ? "80%" : "40%"} complété — Complétez votre profil pour recevoir plus de demandes
        </div>
      </div>

      <QuickActions
        actions={[
          { label: "Modifier mon profil", to: "/profile", tone: "primary", icon: <User size={16} /> },
          { label: "Booster mon profil", to: "/pricing", tone: "amber", icon: <Rocket size={16} /> },
          { label: "Mes messages", to: "/messages", tone: "blue", icon: <MessageCircle size={16} /> },
          { label: "Voir mes avis", to: "/profile", tone: "outline", icon: <Star size={16} /> },
        ]}
      />
    </div>
  );
}
