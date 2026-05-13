import { Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, FileCheck, Award, FileText, MessageCircle, User, Upload } from "lucide-react";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import { EmptyState } from "./shared/EmptyState";
import type { Profile } from "./DashboardRouter";

export function SurveyorDashboard({ profile }: { profile: Profile | null }) {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">{profile?.full_name || "Géomètre"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Géomètre · Notaire</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${profile?.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {profile?.verified ? "✓ ONIG Certifié" : "⏳ ONIG en cours"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="blue" icon={Clock} value={0} label="Missions en attente" />
        <KpiCard tone="green" icon={CheckCircle2} value={0} label="Missions ce mois" />
        <KpiCard tone="amber" icon={FileCheck} value={0} label="Documents à vérifier" />
        <KpiCard tone="purple" icon={Award} value={0} label="Biens certifiés" />
      </div>

      <h2 className="text-xl font-display font-bold mt-10 mb-4">Demandes de certification</h2>
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={FileText}
          title="Aucune demande de certification"
          description="Les nouvelles missions apparaîtront ici"
        />
      </div>

      <QuickActions
        actions={[
          { label: "Mes certifications", to: "/dashboard", tone: "primary", icon: <Award size={16} /> },
          { label: "Uploader un rapport", to: "/dashboard", tone: "green", icon: <Upload size={16} /> },
          { label: "Mes messages", to: "/messages", tone: "blue", icon: <MessageCircle size={16} /> },
          { label: "Modifier mon profil", to: "/profile", tone: "outline", icon: <User size={16} /> },
        ]}
      />
    </div>
  );
}
