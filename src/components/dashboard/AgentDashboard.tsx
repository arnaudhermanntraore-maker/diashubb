import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2, MessageCircle, Clock, Eye, Rocket,
  Plus, BarChart3, Settings, ShieldCheck, ArrowRight,
  AlertTriangle, CheckCircle2, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "./shared/KpiCard";
import { QuickActions } from "./shared/QuickActions";
import { EmptyState } from "./shared/EmptyState";
import { BoostButton } from "@/components/BoostModal";
import type { Profile } from "./DashboardRouter";

interface ListingRow {
  id: string;
  title: string;
  status: string;
  price_usd: number;
  cover_url: string | null;
  views_count: number;
}

type AgencyStatus = "none" | "pending" | "verified" | "rejected";

export function AgentDashboard({ profile }: { profile: Profile | null }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [counts, setCounts] = useState({ active: 0, pending: 0, totalViews: 0 });
  const [agencyStatus, setAgencyStatus] = useState<AgencyStatus>("none");
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(true);

  // Charger les annonces
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,status,price_usd,cover_url,views_count")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      const rows = (data ?? []) as ListingRow[];
      setListings(rows);
      setCounts({
        active: rows.filter((r) => r.status === "active").length,
        pending: rows.filter((r) => r.status === "draft" || r.status === "pending").length,
        totalViews: rows.reduce((s, r) => s + (r.views_count ?? 0), 0),
      });
    })();
  }, [user]);

  // Vérifier si l'agent a une agence enregistrée
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingAgency(true);
      const { data } = await supabase
        .from("agencies")
        .select("id, name, status")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!data) {
        setAgencyStatus("none");
      } else {
        setAgencyStatus(data.status as AgencyStatus);
        setAgencyName(data.name);
      }
      setLoadingAgency(false);
    })();
  }, [user]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      draft: "bg-slate-200 text-slate-700",
      pending: "bg-amber-100 text-amber-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[s] ?? "bg-muted"}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold">
            {profile?.full_name || "Agent"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tableau de bord agent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            Pro ✓
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold inline-flex items-center gap-1">
            <Rocket size={12} /> {profile?.diascoins ?? 0} crédits
          </span>
        </div>
      </div>

      {/* ── BANNIÈRE AGENCE — état selon statut ── */}
      {!loadingAgency && (
        <div className="mt-6">
          {/* Pas d'agence → CTA principal */}
          {agencyStatus === "none" && (
            <div className="rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-2"
              style={{
                background: "linear-gradient(135deg, #E6F1FB, #EEF5FF)",
                borderColor: "var(--tf-blue)",
              }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
                  style={{ background: "var(--tf-blue)" }}>
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-tf-navy">
                    Enregistrez votre agence immobilière
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    Pour publier des annonces certifiées Diashubb et recevoir des leads qualifiés,
                    vous devez d'abord enregistrer votre agence. C'est gratuit et prend 3 minutes.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
                    {[
                      "✓ Badge agence certifiée",
                      "✓ Annonces illimitées",
                      "✓ Leads qualifiés diaspora",
                      "✓ Tableau de bord agence",
                    ].map((b) => (
                      <li key={b} className="font-medium">{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to="/agency/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold whitespace-nowrap"
                  style={{ background: "var(--tf-blue)" }}
                >
                  Enregistrer mon agence <ArrowRight size={16} />
                </Link>
                <p className="text-[11px] text-center text-muted-foreground">
                  Gratuit · Validation 24-72h
                </p>
              </div>
            </div>
          )}

          {/* En attente de validation */}
          {agencyStatus === "pending" && (
            <div className="rounded-2xl p-4 flex items-center gap-4 border"
              style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
              <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-amber-100">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900">
                  {agencyName} — Vérification en cours
                </div>
                <p className="text-xs text-amber-700 mt-0.5">
                  Notre équipe examine votre dossier sous 24–72h ouvrées.
                  Vous recevrez un email dès la validation.
                </p>
              </div>
              <Link to="/agency/dashboard"
                className="text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
                Voir le dossier →
              </Link>
            </div>
          )}

          {/* Agence vérifiée */}
          {agencyStatus === "verified" && (
            <div className="rounded-2xl p-4 flex items-center gap-4 border"
              style={{ background: "#E1F5EE", borderColor: "#6EE7B7" }}>
              <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-green-100">
                <CheckCircle2 size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 flex items-center gap-2">
                  <ShieldCheck size={14} /> {agencyName} — Agence certifiée Diashubb
                </div>
                <p className="text-xs text-green-700 mt-0.5">
                  Votre agence est vérifiée. Vos annonces affichent le badge certifié.
                </p>
              </div>
              <Link to="/agency/dashboard"
                className="text-xs font-semibold text-green-700 hover:underline whitespace-nowrap">
                Tableau de bord agence →
              </Link>
            </div>
          )}

          {/* Agence rejetée */}
          {agencyStatus === "rejected" && (
            <div className="rounded-2xl p-4 flex items-center gap-4 border"
              style={{ background: "#FCEBEB", borderColor: "#FCA5A5" }}>
              <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-red-100">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-red-900">
                  Dossier refusé — action requise
                </div>
                <p className="text-xs text-red-700 mt-0.5">
                  Votre dossier a été refusé. Consultez le motif et corrigez les documents.
                </p>
              </div>
              <Link to="/agency/dashboard"
                className="text-xs font-semibold text-red-700 hover:underline whitespace-nowrap">
                Voir le motif →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <KpiCard tone="blue" icon={Building2} value={counts.active} label="Annonces actives" />
        <KpiCard tone="green" icon={MessageCircle} value={0} label="Leads ce mois" trend="↑ Nouveau" />
        <KpiCard tone="amber" icon={Clock} value={counts.pending} label="En attente"
          badge={counts.pending > 0 ? "Action" : undefined} />
        <KpiCard tone="purple" icon={Eye} value={counts.totalViews} label="Vues totales" />
      </div>

      {/* Guide 3 étapes si pas d'agence */}
      {!loadingAgency && agencyStatus === "none" && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              n: 1,
              icon: <Building2 size={20} style={{ color: "var(--tf-blue)" }} />,
              title: "Enregistrez votre agence",
              desc: "Nom, pays, contact — 3 minutes. Validation par notre équipe sous 72h.",
              cta: "Commencer →",
              to: "/agency/register",
              active: true,
            },
            {
              n: 2,
              icon: <ShieldCheck size={20} className="text-muted-foreground" />,
              title: "Fournissez vos documents",
              desc: "RCCM / EIN, pièce d'identité, justificatif d'adresse.",
              cta: null, to: null, active: false,
            },
            {
              n: 3,
              icon: <Sparkles size={20} className="text-muted-foreground" />,
              title: "Publiez vos annonces",
              desc: "Badge certifié, annonces illimitées, leads qualifiés.",
              cta: null, to: null, active: false,
            },
          ].map((s) => (
            <div key={s.n} className={`bg-card border rounded-2xl p-4 ${
              s.active ? "border-tf-blue" : "border-border opacity-60"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  s.active ? "" : "bg-muted-foreground/30"
                }`}
                  style={s.active ? { background: "var(--tf-blue)" } : undefined}>
                  {s.n}
                </div>
                {s.icon}
              </div>
              <h3 className="font-semibold text-sm text-tf-navy">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              {s.cta && s.to && (
                <Link to={s.to}
                  className="mt-3 inline-flex items-center text-xs font-semibold text-tf-blue hover:underline">
                  {s.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Annonces */}
      <h2 className="text-xl font-display font-bold mt-10 mb-4">
        Mes annonces récentes
      </h2>

      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune annonce"
          description={
            agencyStatus === "none"
              ? "Enregistrez d'abord votre agence pour pouvoir publier des annonces"
              : "Publiez votre premier bien pour commencer"
          }
          action={
            agencyStatus === "none" ? (
              <Link to="/agency/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
                style={{ background: "var(--tf-blue)" }}>
                <Building2 size={16} /> Enregistrer mon agence
              </Link>
            ) : (
              <Link to="/listings/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold">
                <Plus size={16} /> Publier un bien
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4 hover:bg-muted">
              {l.cover_url && (
                <img src={l.cover_url} alt="" className="w-14 h-14 rounded object-cover" />
              )}
              <Link to="/property/$id" params={{ id: l.id }} className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {l.title} {statusBadge(l.status)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {l.views_count ?? 0} vues
                </div>
              </Link>
              <div className="text-primary font-display font-semibold whitespace-nowrap">
                ${Number(l.price_usd).toLocaleString()}
              </div>
              <BoostButton
                itemType="property"
                itemId={l.id}
                itemTitle={l.title}
                itemPrice={l.price_usd}
                itemThumb={l.cover_url}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <QuickActions
        actions={[
          {
            label: agencyStatus === "none" ? "🏢 Enregistrer mon agence" : "🏢 Mon agence",
            to: agencyStatus === "none" ? "/agency/register" : "/agency/dashboard",
            tone: "blue",
            icon: <Building2 size={16} />,
          },
          {
            label: "+ Publier un bien",
            to: "/listings/new",
            tone: "green",
            icon: <Plus size={16} />,
          },
          { label: "🚀 Booster", to: "/pricing", tone: "amber" },
          {
            label: "📊 Analytics",
            to: "/dashboard",
            tone: "outline",
            icon: <BarChart3 size={16} />,
          },
        ]}
      />
    </div>
  );
}
