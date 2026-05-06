import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Sparkles, ChevronDown } from "lucide-react";
import { PlanBadge, type PlanKey } from "@/components/PlanBadge";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionCheckout } from "@/server/subscriptions.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs & Plans Agences — TerraFrique" },
      { name: "description", content: "4 plans pour agences immobilières : Starter gratuit, Pro $49/mo, Business $149/mo, Enterprise $499/mo. 14 jours d'essai gratuit." },
      { property: "og:title", content: "Plans Agences TerraFrique" },
      { property: "og:description", content: "Accédez à 44M d'acheteurs diaspora. Commencez gratuitement, évoluez selon vos besoins." },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  key: PlanKey;
  name: string;
  tagFr: string; tagEn: string;
  monthly: number; yearly: number;
  accent: string;
  borderClass: string;
  ctaTo: string;
  highlight?: "popular" | "best";
  featuresFr: string[];
  featuresEn: string[];
  excludedFr?: string[];
  excludedEn?: string[];
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    tagFr: "Pour commencer", tagEn: "To get started",
    monthly: 0, yearly: 0,
    accent: "#6B7280",
    borderClass: "border border-border",
    ctaTo: "/agency/register",
    featuresFr: ["3 annonces actives", "Profil agence basique", "Messagerie sécurisée", "Badge Agence TerraFrique", "Statistiques basiques"],
    featuresEn: ["3 active listings", "Basic agency profile", "Secure messaging", "TerraFrique Agency badge", "Basic stats"],
    excludedFr: ["Boosts inclus", "Traduction automatique", "Leads qualifiés"],
    excludedEn: ["Included boosts", "Auto translation", "Qualified leads"],
  },
  {
    key: "pro",
    name: "Pro",
    tagFr: "Pour agents individuels", tagEn: "For individual agents",
    monthly: 49, yearly: 470,
    accent: "#185FA5",
    borderClass: "border-2",
    ctaTo: "/agency/register",
    featuresFr: ["20 annonces actives", "Badge Agent Pro Certifié", "3 boosts inclus/mois", "Traduction auto FR/EN", "Analytics complets", "Priorité dans les résultats", "Profil featured sur /agents", "Accès leads diaspora", "Support email 48h"],
    featuresEn: ["20 active listings", "Pro Certified badge", "3 boosts/month", "Auto FR/EN translation", "Full analytics", "Priority in results", "Featured on /agents", "Diaspora leads access", "Email support 48h"],
  },
  {
    key: "business",
    name: "Business",
    tagFr: "Pour agences établies", tagEn: "For established agencies",
    monthly: 149, yearly: 1430,
    accent: "#1D9E75",
    borderClass: "border-2",
    ctaTo: "/agency/register",
    highlight: "popular",
    featuresFr: ["Annonces illimitées", "Badge Agence Certifiée Premium", "10 boosts inclus/mois", "Page agence dédiée brandée", "Logo sur toutes les annonces", "Featured newsletter 1x/mois", "Accès API TerraFrique", "5 comptes agents liés", "CRM leads intégré", "Support chat dédié 24h", "Rapport mensuel performance"],
    featuresEn: ["Unlimited listings", "Premium Certified badge", "10 boosts/month", "Branded agency page", "Logo on all listings", "Newsletter feature monthly", "TerraFrique API access", "5 linked agent accounts", "Built-in leads CRM", "24h dedicated chat support", "Monthly performance report"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    tagFr: "Pour grands réseaux", tagEn: "For large networks",
    monthly: 499, yearly: 4790,
    accent: "#EF9F27",
    borderClass: "border-2",
    ctaTo: "/agency/register",
    highlight: "best",
    featuresFr: ["Tout Business inclus", "Badge Partenaire Officiel Or", "Boosts illimités", "Page agence premium avec équipe", "Featured homepage rotation", "Newsletter diaspora trimestrielle", "Account manager dédié", "Agents illimités", "White-label sous-domaine", "Données marché exclusives", "Co-marketing réseaux sociaux", "Intégration CRM externe", "Rapport hebdomadaire", "Support téléphonique direct"],
    featuresEn: ["All Business included", "Gold Official Partner badge", "Unlimited boosts", "Premium team page", "Homepage featured rotation", "Quarterly diaspora newsletter", "Dedicated account manager", "Unlimited agents", "White-label subdomain", "Exclusive market data", "Social co-marketing", "External CRM integration", "Weekly report", "Direct phone support"],
  },
];

const COMPARISON_FR = [
  ["Annonces actives", "3", "20", "Illimité", "Illimité"],
  ["Comptes agents", "1", "1", "5", "Illimité"],
  ["Boosts inclus / mois", "0", "3", "10", "Illimité"],
  ["Badge certifié", "✗", "✓", "✓", "✓ Or"],
  ["Traduction auto FR/EN", "✗", "✓", "✓", "✓"],
  ["Analytics", "Basique", "Complet", "Complet", "Complet + export"],
  ["Leads qualifiés diaspora", "✗", "✓", "✓ + CRM", "✓ + CRM"],
  ["Page agence brandée", "✗", "✗", "✓", "✓ Premium"],
  ["Featured homepage", "✗", "✗", "✗", "✓"],
  ["Account manager", "✗", "✗", "✗", "✓"],
  ["Support", "Communauté", "Email 48h", "Chat 24h", "Téléphone direct"],
];
const COMPARISON_EN = [
  ["Active listings", "3", "20", "Unlimited", "Unlimited"],
  ["Agent seats", "1", "1", "5", "Unlimited"],
  ["Included boosts / month", "0", "3", "10", "Unlimited"],
  ["Verified badge", "✗", "✓", "✓", "✓ Gold"],
  ["Auto FR/EN translation", "✗", "✓", "✓", "✓"],
  ["Analytics", "Basic", "Full", "Full", "Full + export"],
  ["Qualified diaspora leads", "✗", "✓", "✓ + CRM", "✓ + CRM"],
  ["Branded agency page", "✗", "✗", "✓", "✓ Premium"],
  ["Featured homepage", "✗", "✗", "✗", "✓"],
  ["Account manager", "✗", "✗", "✗", "✓"],
  ["Support", "Community", "Email 48h", "Chat 24h", "Direct phone"],
];

const FAQS_FR: { q: string; a: string }[] = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui. Upgrade ou downgrade depuis votre dashboard, effet immédiat. La facturation est ajustée au prorata." },
  { q: "Y a-t-il une période d'engagement ?", a: "Non. Les plans mensuels sont sans engagement. Les plans annuels offrent 20% de réduction et peuvent être remboursés sous 30 jours." },
  { q: "Comment fonctionnent les boosts inclus ?", a: "Les boosts sont crédités le 1er de chaque mois. Ils ne se cumulent pas d'un mois à l'autre." },
  { q: "Qu'est-ce que le badge certifié ?", a: "Attribué après vérification de votre RCCM (Afrique) ou de votre licence immobilière (USA). Il renforce la confiance des acheteurs diaspora." },
  { q: "Puis-je tester avant de payer ?", a: "Oui. Le plan Starter est gratuit sans limite de temps. Les plans payants offrent 14 jours d'essai gratuit." },
];
const FAQS_EN: { q: string; a: string }[] = [
  { q: "Can I switch plans anytime?", a: "Yes. Upgrade or downgrade from your dashboard with immediate effect. Billing is prorated automatically." },
  { q: "Is there a commitment period?", a: "No. Monthly plans have no commitment. Yearly plans give 20% off and are refundable within 30 days." },
  { q: "How do included boosts work?", a: "Boosts are credited on the 1st of each month and do not roll over." },
  { q: "What is the certified badge?", a: "Granted after verification of your RCCM (Africa) or real-estate license (USA). It builds diaspora buyer trust." },
  { q: "Can I try before paying?", a: "Yes. Starter is free forever. Paid plans include a 14-day free trial." },
];

const TESTIMONIALS = [
  { fr: "Depuis TerraFrique Business, nous recevons 12-15 contacts diaspora par semaine. Impossible d'atteindre ces clients avant.", en: "Since TerraFrique Business, we get 12-15 diaspora leads per week. Unreachable before.", who: "AfriImmo Group · Abidjan CI" },
  { fr: "Le badge certifié a multiplié notre taux de conversion par 3. Les acheteurs diaspora font confiance au badge.", en: "The certified badge tripled our conversion rate. Diaspora buyers trust the badge.", who: "Cabinet Diallo · Dakar SN" },
  { fr: "L'API d'import nous permet de publier nos 200+ listings automatiquement. Gain de temps énorme.", en: "The import API lets us publish our 200+ listings automatically. Massive time saver.", who: "Regimanuel Gray · Accra GH" },
];

function PricingPage() {
  const { i18n } = useTranslation();
  const fr = (i18n.language ?? "fr").startsWith("fr");
  const [yearly, setYearly] = useState(false);

  const comparison = fr ? COMPARISON_FR : COMPARISON_EN;
  const faqs = fr ? FAQS_FR : FAQS_EN;

  return (
    <div className="bg-background">
      {/* HERO */}
      <section style={{ background: "#0A3060" }} className="text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10">
            <Sparkles size={12} /> {fr ? "Rejoignez 200+ agences" : "Join 200+ agencies"}
          </span>
          <h1 className="mt-4 text-2xl md:text-4xl font-display font-bold">
            {fr ? "Choisissez votre plan TerraFrique" : "Choose your TerraFrique plan"}
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
            {fr
              ? "Accédez à 44M d'acheteurs diaspora. Commencez gratuitement, évoluez selon vos besoins."
              : "Access 44M diaspora buyers. Start free, scale as you grow."}
          </p>

          {/* Toggle */}
          <div className="mt-6 inline-flex items-center gap-2 p-1 rounded-full bg-white/10">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${!yearly ? "bg-white text-[#0A3060]" : "text-white/80"}`}
            >
              {fr ? "Mensuel" : "Monthly"}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${yearly ? "bg-white text-[#0A3060]" : "text-white/80"}`}
            >
              {fr ? "Annuel" : "Yearly"}
            </button>
            {yearly && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1D9E75] text-white">
                -20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <PlanCard key={p.key} plan={p} yearly={yearly} fr={fr} />
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-xl md:text-2xl font-display font-bold text-center mb-6">
          {fr ? "Comparaison détaillée" : "Detailed comparison"}
        </h2>
        <div className="overflow-x-auto bg-card border border-border rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-muted-foreground">{fr ? "Fonctionnalité" : "Feature"}</th>
                {PLANS.map((p) => (
                  <th key={p.key} className="p-4 font-semibold text-center" style={{ color: p.accent }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{row[0]}</td>
                  {row.slice(1).map((cell, j) => (
                    <td key={j} className="p-4 text-center text-muted-foreground">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="text-amber-500 text-sm mb-2">★★★★★</div>
              <p className="text-sm text-foreground/80 italic">"{fr ? t.fr : t.en}"</p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">— {t.who}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-12 max-w-3xl">
        <h2 className="text-xl md:text-2xl font-display font-bold text-center mb-6">
          {fr ? "Questions fréquentes" : "Frequently asked questions"}
        </h2>
        <div className="space-y-2">
          {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0A3060" }} className="text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-xl md:text-3xl font-display font-bold">
            {fr ? "Prêt à toucher la diaspora africaine ?" : "Ready to reach the African diaspora?"}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/agency/register" className="px-6 py-2.5 rounded-full bg-white text-[#0A3060] text-sm font-semibold">
              {fr ? "Commencer gratuitement →" : "Start for free →"}
            </Link>
            <Link to="/agencies" className="px-6 py-2.5 rounded-full border border-white/30 text-white text-sm font-semibold">
              {fr ? "Voir les agences" : "Browse agencies"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan, yearly, fr }: { plan: Plan; yearly: boolean; fr: boolean }) {
  const checkout = useServerFn(createSubscriptionCheckout);
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = `/auth?redirect=/pricing`;
        return;
      }
      setLoading(true);
      const origin = window.location.origin;
      const res = await checkout({
        data: {
          planKey: plan.key as "pro" | "business" | "enterprise",
          cycle: yearly ? "yearly" : "monthly",
          successUrl: `${origin}/billing/success`,
          cancelUrl: `${origin}/pricing`,
        },
      });
      if (res?.url) window.location.href = res.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout error";
      // eslint-disable-next-line no-alert
      alert(msg);
      setLoading(false);
    }
  };

  const price = yearly ? plan.yearly : plan.monthly;
  const features = fr ? plan.featuresFr : plan.featuresEn;
  const excluded = fr ? (plan.excludedFr ?? []) : (plan.excludedEn ?? []);
  const isFree = plan.monthly === 0;

  const banner =
    plan.highlight === "popular" ? { fr: "LE PLUS POPULAIRE", en: "MOST POPULAR", color: "#1D9E75" } :
    plan.highlight === "best" ? { fr: "MEILLEUR ROI", en: "BEST ROI", color: "#EF9F27" } : null;

  const bgStyle = plan.key === "enterprise"
    ? { background: "linear-gradient(135deg,#FFFBEB,white)" }
    : { background: "hsl(var(--card))" };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex flex-col ${plan.borderClass}`}
      style={{ borderColor: plan.borderClass.includes("border-2") ? plan.accent : undefined, ...bgStyle }}
    >
      {banner && (
        <div className="text-center py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: banner.color }}>
          {fr ? banner.fr : banner.en}
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3">
          <PlanBadge planKey={plan.key} lang={fr ? "fr" : "en"} />
        </div>
        <h3 className="text-lg font-display font-bold" style={{ color: plan.accent }}>{plan.name}</h3>
        <p className="text-xs text-muted-foreground mb-3">{fr ? plan.tagFr : plan.tagEn}</p>

        <div className="mb-4">
          {isFree ? (
            <div className="text-2xl font-bold">{fr ? "Gratuit" : "Free"}</div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">${price}</span>
              <span className="text-xs text-muted-foreground">{yearly ? (fr ? "/an" : "/yr") : (fr ? "/mois" : "/mo")}</span>
            </div>
          )}
          {!isFree && yearly && (
            <p className="text-[11px] text-[#1D9E75] mt-1 font-semibold">
              {fr ? `Soit $${Math.round(plan.yearly / 12)}/mois` : `That's $${Math.round(plan.yearly / 12)}/mo`}
            </p>
          )}
        </div>

        <Link
          to={plan.ctaTo}
          search={{ plan: plan.key, cycle: yearly ? "yearly" : "monthly" } as never}
          className={`w-full text-center px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
            plan.key === "starter" ? "border" : "text-white"
          }`}
          style={{
            background: plan.key === "starter" ? "transparent" : plan.accent,
            borderColor: plan.key === "starter" ? plan.accent : undefined,
            color: plan.key === "starter" ? plan.accent : "white",
          }}
        >
          {plan.key === "enterprise"
            ? (fr ? "Contacter l'équipe →" : "Contact sales →")
            : isFree
              ? (fr ? "Commencer gratuitement →" : "Start for free →")
              : (fr ? `Démarrer ${plan.name} →` : `Start ${plan.name} →`)}
        </Link>

        <ul className="space-y-2 text-xs">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" style={{ color: plan.accent }} />
              <span className="text-foreground/80">{f}</span>
            </li>
          ))}
          {excluded.map((f, i) => (
            <li key={`x${i}`} className="flex items-start gap-2 opacity-60">
              <X size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
              <span className="line-through text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="font-semibold text-sm">{q}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}
