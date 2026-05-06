import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Building2, Heart, ShieldCheck, Clock, XCircle,
  FileText, Upload, CheckCircle2, AlertTriangle, Globe2, Phone, Mail, MapPin, Pencil,
  Star, Users, Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PlanBadge } from "@/components/PlanBadge";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionCheckout } from "@/server/subscriptions.functions";
import { createBillingPortalSession } from "@/server/billing-portal.functions";

export const Route = createFileRoute("/agency/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Agency dashboard — TerraFrique" }] }),
  component: AgencyDashboard,
});

type DocStatus = "missing" | "uploaded" | "approved" | "rejected";
type AgencyDoc = { key: string; url?: string; status: DocStatus; note?: string };

type Agency = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string;
  email: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  documents: AgencyDoc[];
  created_at: string;
  verified_at: string | null;
  plan_key: "starter" | "pro" | "business" | "enterprise" | null;
  active_listings: number | null;
  avg_rating: number | null;
  leads_received: number | null;
  reviews_count: number | null;
};

const REQUIRED_DOCS = [
  { key: "registration", fr: "Certificat d'enregistrement / RCCM", en: "Registration certificate / RCCM" },
  { key: "tax_id", fr: "Numéro fiscal / EIN", en: "Tax ID / EIN" },
  { key: "id_owner", fr: "Pièce d'identité du dirigeant", en: "Owner ID document" },
  { key: "address_proof", fr: "Justificatif d'adresse (< 3 mois)", en: "Proof of address (< 3 months)" },
];

function AgencyDashboard() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr") ?? true;
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, pending: 0, draft: 0, sold: 0 });
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loadingAgency, setLoadingAgency] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const checkout = useServerFn(createSubscriptionCheckout);

  const startUpgrade = async (planKey: "pro" | "business" | "enterprise" = "pro") => {
    try {
      setUpgrading(true);
      const origin = window.location.origin;
      const res = await checkout({
        data: {
          planKey,
          cycle: "monthly",
          successUrl: `${origin}/billing/success`,
          cancelUrl: `${origin}/agency/dashboard`,
        },
      });
      if (res?.url) window.location.href = res.url;
      else throw new Error("No checkout URL returned");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout error";
      toast.error(msg);
      setUpgrading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("properties").select("status").eq("agent_id", user.id);
      const s = { active: 0, pending: 0, draft: 0, sold: 0 };
      (data ?? []).forEach((r: { status: string }) => {
        if (r.status === "active") s.active++;
        else if (r.status === "draft") s.draft++;
        else if (r.status === "sold" || r.status === "reserved") s.sold++;
        else s.pending++;
      });
      setStats(s);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingAgency(true);
      const { data } = await supabase
        .from("agencies")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      setAgency((data as Agency | null) ?? null);
      setLoadingAgency(false);
    })();
  }, [user]);

  const docMap = useMemo(() => {
    const map = new Map<string, AgencyDoc>();
    (agency?.documents ?? []).forEach((d) => map.set(d.key, d));
    return map;
  }, [agency]);

  const completed = REQUIRED_DOCS.filter((d) => {
    const doc = docMap.get(d.key);
    return doc?.status === "uploaded" || doc?.status === "approved";
  }).length;
  const progressPct = Math.round((completed / REQUIRED_DOCS.length) * 100);

  const updateDoc = async (key: string, patch: Partial<AgencyDoc>) => {
    if (!agency) return;
    const next = REQUIRED_DOCS.map((r) => {
      const existing = docMap.get(r.key) ?? { key: r.key, status: "missing" as DocStatus };
      return r.key === key ? { ...existing, ...patch } : existing;
    });
    const { error } = await supabase
      .from("agencies")
      .update({ documents: next })
      .eq("id", agency.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAgency({ ...agency, documents: next });
    toast.success(fr ? "Mis à jour" : "Updated");
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-display font-bold">{t("agency.title")}</h1>
            {agency?.plan_key && <PlanBadge planKey={agency.plan_key} />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t("agency.subtitle")}</p>
        </div>
        <Link
          to="/listings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
          style={{ background: "var(--tf-blue)" }}
        >
          <Plus size={16} /> {t("agency.publishCta")}
        </Link>
      </div>


      {agency && (!agency.plan_key || agency.plan_key === "starter") && (
        <div className="mt-6 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border"
             style={{ background: "linear-gradient(135deg, rgba(59,130,246,.08), rgba(139,92,246,.08))" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--tf-blue)" }}>
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold">
                {fr ? "Passez au plan Pro" : "Upgrade to Pro"}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {fr
                  ? "Plus d'annonces, badge certifié, mise en avant et statistiques avancées."
                  : "More listings, certified badge, featured placement and advanced analytics."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => startUpgrade("pro")}
              disabled={upgrading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold whitespace-nowrap disabled:opacity-60"
              style={{ background: "var(--tf-blue)" }}
            >
              {upgrading ? (fr ? "Redirection…" : "Redirecting…") : (fr ? "Passer Pro — $49/mois" : "Upgrade to Pro — $49/mo")}
            </button>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap border border-border hover:bg-muted"
            >
              {fr ? "Comparer les plans" : "Compare plans"}
            </Link>
          </div>
        </div>
      )}

      {agency && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: fr ? "Annonces actives" : "Active listings", value: String(agency.active_listings ?? 0), Icon: Building2, color: "var(--tf-green)", suffix: "" },
            { label: fr ? "Note moyenne" : "Avg. rating", value: (Number(agency.avg_rating) || 0).toFixed(1), Icon: Star, color: "var(--tf-amber)", suffix: ` (${agency.reviews_count ?? 0})` },
            { label: fr ? "Leads reçus" : "Leads received", value: String(agency.leads_received ?? 0), Icon: Users, color: "var(--tf-blue)", suffix: "" },
            { label: fr ? "Plan actuel" : "Current plan", value: (agency.plan_key ?? "starter").toUpperCase(), Icon: Sparkles, color: "#8b5cf6", suffix: "" },
          ].map((c, i) => {
            const Icon = c.Icon;
            return (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Icon size={14} style={{ color: c.color }} /> {c.label}
                </div>
                <div className="text-2xl font-display font-bold mt-1" style={{ color: c.color }}>
                  {c.value}{c.suffix && <span className="text-sm text-muted-foreground font-normal">{c.suffix}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification + Profile preview */}
      {loadingAgency ? (
        <div className="mt-6 h-32 rounded-2xl bg-muted animate-pulse" />
      ) : !agency ? (
        <NoAgencyCard fr={fr} />
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <VerificationCard agency={agency} fr={fr} progressPct={progressPct} />
          <ProfilePreviewCard agency={agency} fr={fr} />
        </div>
      )}

      {/* Documents tracker */}
      {agency && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold">
              {fr ? "Documents de vérification" : "Verification documents"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {completed}/{REQUIRED_DOCS.length} {fr ? "fournis" : "submitted"}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {REQUIRED_DOCS.map((d) => {
              const doc = docMap.get(d.key) ?? { key: d.key, status: "missing" as DocStatus };
              return (
                <DocRow
                  key={d.key}
                  label={fr ? d.fr : d.en}
                  doc={doc}
                  fr={fr}
                  onChangeUrl={(url) => updateDoc(d.key, { url, status: "uploaded" })}
                  onRemove={() => updateDoc(d.key, { url: undefined, status: "missing" })}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Listing stats */}
      <h2 className="text-lg font-display font-bold mt-10 mb-3">
        {fr ? "Mes annonces" : "My listings"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("agency.stats.active"), value: stats.active, color: "var(--tf-green)" },
          { label: t("agency.stats.pending"), value: stats.pending, color: "var(--tf-amber)" },
          { label: t("agency.stats.draft"), value: stats.draft, color: "#9ca3af" },
          { label: t("agency.stats.sold"), value: stats.sold, color: "var(--tf-blue)" },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="text-3xl font-display font-bold mt-1" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-display font-bold mt-10 mb-3">{t("agency.quickActions")}</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/listings/new" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Plus className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">{t("agency.actions.publish")}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("agency.actions.publishSub")}</div>
        </Link>
        <Link to="/dashboard" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Building2 className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">{t("agency.actions.listings")}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("agency.actions.listingsSub")}</div>
        </Link>
        <Link to="/messages" className="bg-card border border-border rounded-2xl p-5 hover:border-tf-blue transition-colors">
          <Heart className="mb-2" style={{ color: "var(--tf-blue)" }} />
          <div className="font-semibold">{t("agency.actions.messages")}</div>
          <div className="text-xs text-muted-foreground mt-1">{t("agency.actions.messagesSub")}</div>
        </Link>
      </div>
    </div>
  );
}

/* -------------------- Sub-components -------------------- */

function NoAgencyCard({ fr }: { fr: boolean }) {
  return (
    <div className="mt-6 bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center bg-amber-100">
          <AlertTriangle className="text-amber-600" size={20} />
        </div>
        <div>
          <h2 className="font-display font-bold">
            {fr ? "Aucune agence enregistrée" : "No agency registered"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {fr
              ? "Inscrivez votre agence pour publier des annonces certifiées."
              : "Register your agency to publish certified listings."}
          </p>
        </div>
      </div>
      <Link
        to="/agency/register"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
        style={{ background: "var(--tf-blue)" }}
      >
        {fr ? "Inscrire mon agence" : "Register my agency"}
      </Link>
    </div>
  );
}

function VerificationCard({ agency, fr, progressPct }: { agency: Agency; fr: boolean; progressPct: number }) {
  const status = agency.status;
  const cfg = {
    verified: { Icon: ShieldCheck, color: "var(--tf-green)", bg: "rgba(34,197,94,.10)", label: fr ? "Vérifiée" : "Verified" },
    pending: { Icon: Clock, color: "var(--tf-amber)", bg: "rgba(245,158,11,.12)", label: fr ? "En cours de vérification" : "Under review" },
    rejected: { Icon: XCircle, color: "#ef4444", bg: "rgba(239,68,68,.10)", label: fr ? "Refusée" : "Rejected" },
  }[status];
  const Icon = cfg.Icon;

  return (
    <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: cfg.bg }}>
          <Icon style={{ color: cfg.color }} size={22} />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {fr ? "Statut de vérification" : "Verification status"}
          </div>
          <div className="font-display font-bold text-lg" style={{ color: cfg.color }}>{cfg.label}</div>
        </div>
        <span className="text-xs text-muted-foreground">
          {fr ? "Soumis le" : "Submitted"} {new Date(agency.created_at).toLocaleDateString()}
        </span>
      </div>

      {status === "rejected" && agency.rejection_reason && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <strong>{fr ? "Motif :" : "Reason:"}</strong> {agency.rejection_reason}
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{fr ? "Documents fournis" : "Documents provided"}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "var(--tf-blue)" }} />
        </div>
      </div>

      {status === "pending" && (
        <p className="text-xs text-muted-foreground mt-3">
          {fr
            ? "Notre équipe contrôle votre dossier sous 24–72h ouvrées."
            : "Our team reviews submissions within 24–72 business hours."}
        </p>
      )}
    </div>
  );
}

function ProfilePreviewCard({ agency, fr }: { agency: Agency; fr: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {fr ? "Aperçu fiche agence" : "Agency profile preview"}
        </div>
        <Link to="/agency/register" className="text-xs inline-flex items-center gap-1 text-tf-blue hover:underline">
          <Pencil size={12} /> {fr ? "Modifier" : "Edit"}
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-bold" style={{ background: "var(--tf-blue)" }}>
          {agency.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold truncate">{agency.name}</div>
          {agency.legal_name && <div className="text-xs text-muted-foreground truncate">{agency.legal_name}</div>}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2"><MapPin size={12} /> {[agency.city, agency.country].filter(Boolean).join(", ")}</li>
        <li className="flex items-center gap-2"><Phone size={12} /> {agency.phone}</li>
        <li className="flex items-center gap-2"><Mail size={12} /> {agency.email}</li>
        {agency.website && (
          <li className="flex items-center gap-2 truncate">
            <Globe2 size={12} />
            <a href={agency.website} target="_blank" rel="noreferrer" className="hover:underline truncate">{agency.website}</a>
          </li>
        )}
      </ul>
    </div>
  );
}

function DocRow({
  label, doc, fr, onChangeUrl, onRemove,
}: {
  label: string;
  doc: AgencyDoc;
  fr: boolean;
  onChangeUrl: (url: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(doc.url ?? "");

  const cfg = {
    missing: { Icon: Upload, color: "var(--muted-foreground)", label: fr ? "Manquant" : "Missing" },
    uploaded: { Icon: FileText, color: "var(--tf-amber)", label: fr ? "En attente" : "Pending review" },
    approved: { Icon: CheckCircle2, color: "var(--tf-green)", label: fr ? "Approuvé" : "Approved" },
    rejected: { Icon: XCircle, color: "#ef4444", label: fr ? "Refusé" : "Rejected" },
  }[doc.status];
  const Icon = cfg.Icon;

  const save = () => {
    try { new URL(url); } catch { toast.error(fr ? "URL invalide" : "Invalid URL"); return; }
    onChangeUrl(url);
    setEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Icon size={18} style={{ color: cfg.color }} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{label}</div>
          <div className="text-xs mt-0.5" style={{ color: cfg.color }}>{cfg.label}</div>
          {doc.url && !editing && (
            <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-tf-blue hover:underline truncate block mt-1">
              {doc.url}
            </a>
          )}
          {doc.note && <p className="text-xs text-muted-foreground mt-1 italic">{doc.note}</p>}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 text-xs px-3 py-2 bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={save} className="text-xs px-3 py-2 rounded-lg text-white font-semibold" style={{ background: "var(--tf-blue)" }}>
            {fr ? "OK" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs px-3 py-2 rounded-lg bg-muted">
            {fr ? "Annuler" : "Cancel"}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button onClick={() => { setUrl(doc.url ?? ""); setEditing(true); }} className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 inline-flex items-center gap-1.5">
            <Upload size={12} /> {doc.url ? (fr ? "Remplacer le lien" : "Replace link") : (fr ? "Ajouter un lien" : "Add link")}
          </button>
          {doc.url && (
            <button onClick={onRemove} className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-red-600">
              {fr ? "Retirer" : "Remove"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
