import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, ShieldCheck, Coins, Gift, DollarSign, Search, Eye, Star, FileCheck2, BellRing,
  Building2, Globe2, HardHat, BadgeCheck, Users, Plus, Home as HomeIcon, MapPin,
} from "lucide-react";
import { HeroSearchBox } from "@/components/HeroSearchBox";
import { PropertyCarousel } from "@/components/PropertyCarousel";
import { DemoBanner } from "@/components/DemoBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diashubb — Your home in America. Your land in Africa." },
      { name: "description", content: "Bi-continental real estate. AI-verified titles, secure escrow, trusted contractors across the US and Africa." },
      { property: "og:title", content: "Diashubb" },
      { property: "og:description", content: "Your home in America. Your land in Africa." },
    ],
  }),
  component: Home,
});

const TF_NAVY = "#0A3060";
const TF_NAVY_DEEP = "#042C53";
const TF_BLUE = "#185FA5";
const TF_BLUE_LIGHT = "#85B7EB";
const TF_GREEN = "#1D9E75";
const TF_GREEN_LIGHT = "#5DCAA5";
const TF_GREEN_DEEP = "#0F6E56";
const TF_AMBER = "#EF9F27";
const TF_PURPLE = "#7C5DD3";
const TF_LIME = "#A6CE39";
const TF_CORAL = "#E76F51";

function Home() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div>
      <DemoBanner />
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: TF_NAVY }}>
        <div className="absolute inset-0 bg-grid-overlay opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-10 w-80 h-80 rounded-full blur-3xl animate-tf-float" style={{ background: TF_BLUE, opacity: 0.12 }} />
          <div className="absolute top-32 right-1/4 w-96 h-96 rounded-full blur-3xl animate-tf-float" style={{ background: TF_GREEN, opacity: 0.12, animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full blur-3xl animate-tf-float" style={{ background: "#378ADD", opacity: 0.12, animationDelay: "3s" }} />
          <div className="absolute -bottom-10 right-10 w-72 h-72 rounded-full blur-3xl animate-tf-float" style={{ background: TF_GREEN_DEEP, opacity: 0.12, animationDelay: "4.5s" }} />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-7xl grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(24,95,165,0.25)", border: `1px solid ${TF_BLUE_LIGHT}`, color: TF_BLUE_LIGHT }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: TF_BLUE_LIGHT }} /> USA · MLS · 50 states
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(29,158,117,0.25)", border: `1px solid ${TF_GREEN_LIGHT}`, color: TF_GREEN_LIGHT }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: TF_GREEN_LIGHT }} /> Africa · 18 countries
              </span>
            </div>

            <h1 className="font-display font-medium leading-[1.1]" style={{ fontSize: "clamp(26px, 4.2vw, 44px)" }}>
              {fr ? "Votre maison en " : "Your home in "}
              <span style={{ color: TF_BLUE_LIGHT }}>{fr ? "Amérique" : "America"}</span>.<br />
              {fr ? "Votre terre en " : "Your land in "}
              <span style={{ color: TF_GREEN_LIGHT }}>{fr ? "Afrique" : "Africa"}</span>.
            </h1>

            <p className="mt-4 text-[13px] md:text-sm max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
              {fr
                ? "La seule plateforme conçue pour la diaspora africaine — recherche dopée à l'IA, titres vérifiés, artisans de confiance et investissement bi-continental."
                : "The only platform built for the African diaspora — AI-powered search, verified titles, trusted contractors and bi-continental investment."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/listings" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm hover:scale-[1.02] transition-transform" style={{ color: TF_NAVY }}>
                {fr ? "Trouver un logement" : "Find a home"} <ArrowRight size={16} />
              </Link>
              <Link to="/listings" className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition" style={{ background: TF_GREEN }}>
                {fr ? "Investir en Afrique" : "Invest in Africa"} <ArrowRight size={16} />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-full font-semibold text-sm hover:bg-white/10 transition" style={{ border: "1.5px solid rgba(255,255,255,0.85)" }}>
                {fr ? "Comment ça marche" : "How it works"}
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
              {[
                { icon: ShieldCheck, label: fr ? "Titres vérifiés par IA" : "AI-verified titles" },
                { icon: Coins,       label: fr ? "100 DiasCoins offerts" : "100 DiasCoins on signup" },
                { icon: Gift,        label: fr ? "Inscription gratuite"   : "Free to join" },
                { icon: DollarSign,  label: fr ? "12 $ frais de transfert": "$12 flat transfer fee" },
              ].map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5"><b.icon size={14} style={{ color: TF_GREEN_LIGHT }} /> {b.label}</span>
              ))}
            </div>
          </div>

          {/* Floating data cards */}
          <div className="md:col-span-5 relative h-[360px] hidden md:block">
            <GlassCard className="absolute top-0 right-2 w-72" delay="0s"
              kicker="US market · Atlanta GA" badge="Live MLS" badgeColor={TF_BLUE_LIGHT}
              value="$412,000" sub={fr ? "Prix médian · +9% YoY" : "Median home price · +9% YoY"}
              bars={[28, 38, 48, 60, 76]} barColor={TF_BLUE_LIGHT} />
            <GlassCard className="absolute top-36 left-0 w-72" delay="1s"
              kicker="Africa · Cocody CI" badge="Trending" badgeColor={TF_GREEN_LIGHT}
              value="+8% YoY" sub={fr ? "Valeur des lots · secteur Angré" : "Plot values · Angré sector"}
              bars={[22, 34, 46, 58, 72]} barColor={TF_GREEN_LIGHT} />
            <GlassCard className="absolute bottom-0 right-10 w-72" delay="2s"
              kicker="Transfer · USD → XOF" badge="Live rate" badgeColor={TF_AMBER}
              value="655 XOF" sub={fr ? "Par USD · 12 $ frais · Wave CI" : "Per USD · $12 flat fee · Wave CI"} />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-border">
          {[
            { icon: Building2, color: TF_BLUE,   num: "4.2M+",  label: fr ? "Annonces US (MLS)" : "US listings (MLS)" },
            { icon: Globe2,    color: TF_GREEN,  num: "12,480", label: fr ? "Annonces Afrique" : "Africa listings" },
            { icon: HardHat,   color: TF_AMBER,  num: "12k+",   label: fr ? "Artisans vérifiés" : "Verified contractors" },
            { icon: BadgeCheck,color: TF_LIME,   num: "96%",    label: fr ? "Docs vérifiés IA" : "Docs verified by AI" },
            { icon: Users,     color: TF_PURPLE, num: "44M+",   label: fr ? "Diaspora servie" : "Diaspora served" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center px-2 first:border-l-0">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div className="mt-2 text-2xl font-display font-bold text-tf-navy">{s.num}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH BOX */}
      <HeroSearchBox />

      {/* HOW IT WORKS */}
      <section id="how" className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-tf-navy">{fr ? "Comment fonctionne Diashubb" : "How Diashubb works"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-border" />
            {[
              { icon: Search,     color: TF_BLUE,   title: fr ? "Rechercher" : "Search",      sub: fr ? "US + Afrique en un seul endroit" : "US + Africa in one bar" },
              { icon: Eye,        color: TF_PURPLE, title: fr ? "Visite 360°" : "Tour 360°",  sub: fr ? "Visitez d'abord virtuellement" : "Visit virtually first" },
              { icon: Star,       color: TF_GREEN,  title: fr ? "Score IA" : "AI score",      sub: fr ? "Note sur 12 signaux" : "12-signal rating" },
              { icon: FileCheck2, color: TF_LIME,   title: fr ? "Vérifier" : "Verify docs",   sub: fr ? "IA + contrôle notaire" : "AI + notary check" },
              { icon: BellRing,   color: TF_AMBER,  title: fr ? "Alertes" : "Get alerts",     sub: fr ? "Match = notification" : "Match = notification" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative bg-muted/30">
                <div className="text-[10px] font-bold mb-2 px-2 py-0.5 rounded-full text-white" style={{ background: s.color }}>{i + 1}</div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-soft relative z-10" style={{ background: s.color }}>
                  <s.icon size={26} />
                </div>
                <div className="mt-3 text-sm font-semibold text-tf-navy">{s.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground max-w-[160px]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED US HOMES — auto-scrolling carousel */}
      <PropertyCarousel
        region="us"
        title={fr ? "Biens immobiliers USA" : "US Properties"}
        subtitle={fr ? "Défile automatiquement · Cliquez pour voir les détails" : "Auto-scrolling · Click to view details"}
        viewAllLabel={fr ? "Voir tout" : "View all"}
      />

      {/* AFRICA — auto-scrolling carousel */}
      <PropertyCarousel
        region="africa"
        title={fr ? "Biens immobiliers Afrique" : "Africa Properties"}
        subtitle={fr ? "Défile automatiquement · Cliquez pour voir les détails" : "Auto-scrolling · Click to view details"}
        viewAllLabel={fr ? "Voir tout" : "View all"}
      />

      {/* CONTRACTORS */}
      <SectionHeader title={fr ? "Artisans vérifiés près de chez vous" : "Verified contractors near you"} link={fr ? "Voir tous les artisans" : "See all contractors"} linkTo="/contractors" />
      <div className="container mx-auto px-4 pb-12 max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ContractorCard featured initials="MJ" color={TF_BLUE} name="Marcus Johnson" meta={fr ? "Entrepreneur général · 4.9★ · Atlanta GA" : "General contractor · 4.9★ · Atlanta GA"} rate="$85/hr" badge={fr ? "Antécédents vérifiés" : "Background checked"} badgeColor={TF_BLUE} />
        <ContractorCard initials="RW" color={TF_GREEN} name="Rivera & Williams" meta={fr ? "Électriciens · 4.8★ · Houston TX" : "Electricians · 4.8★ · Houston TX"} rate="$95/hr" badge={fr ? "Disponible" : "Available now"} badgeColor={TF_GREEN} />
        <ContractorCard initials="AO" color={TF_AMBER} name="Adebayo Oluwole" meta={fr ? "Plombier · 4.7★ · Atlanta GA" : "Plumber · 4.7★ · Atlanta GA"} rate="$80/hr" badge={fr ? "Disponible" : "Available"} badgeColor={TF_GREEN} />
        <ContractorCard initials="KD" color={TF_PURPLE} name="Kwame Design Build" meta={fr ? "Rénovation · 4.9★ · Washington DC" : "Renovation · 4.9★ · Washington DC"} rate={fr ? "Devis projet" : "Project quote"} badge={fr ? "Antécédents vérifiés" : "Background checked"} badgeColor={TF_BLUE} />
        <AddCard label={fr ? "Rejoindre comme artisan" : "Join as contractor"} to="/contractors/register" />
      </div>

      {/* MARKET INTELLIGENCE */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-tf-navy">{fr ? "Intelligence de marché" : "Live Market Intelligence"}</h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#E1F5EE", color: "#085041" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#1D9E75" }} />
            {fr ? "En direct" : "Live"}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <MarketCardV2
            flag="🇨🇮" location="Cocody · Abidjan" trend="+8% YoY" trendPositive
            subtitle={fr ? "Prix terrain m² · FCFA" : "Plot price per m² · FCFA"}
            bars={[
              { month: "Jan", value: 60, label: "98,000" },
              { month: fr ? "Fév" : "Feb", value: 70, label: "103,000" },
              { month: fr ? "Mar" : "Mar", value: 75, label: "106,000" },
              { month: fr ? "Avr" : "Apr", value: 85, label: "109,000" },
              { month: fr ? "Mai" : "May", value: 100, label: "112,500" },
            ]}
            stats={[
              { value: "112,500 FCFA", label: fr ? "Prix moyen m²" : "Avg price m²" },
              { value: fr ? "34 jours" : "34 days", label: fr ? "Jours sur le marché" : "Days on market" },
              { value: "🔥 Bingerville +14%", label: fr ? "Zone chaude" : "Hot zone" },
            ]}
            accent="#1D9E75" gradFrom="#9FE1CB" gradTo="#0F6E56" lastBar="#1D9E75"
          />
          <MarketCardV2
            flag="🇺🇸" location="Atlanta · Georgia" trend="+9% YoY" trendPositive
            subtitle={fr ? "Prix médian · USD" : "Median home price · USD"}
            bars={[
              { month: "Jan", value: 60, label: "$378k" },
              { month: "Feb", value: 68, label: "$385k" },
              { month: "Mar", value: 75, label: "$392k" },
              { month: "Apr", value: 88, label: "$402k" },
              { month: "May", value: 100, label: "$412k" },
            ]}
            stats={[
              { value: "$412,000", label: fr ? "Prix médian" : "Median price" },
              { value: fr ? "28 jours" : "28 days", label: fr ? "Jours sur le marché" : "Days on market" },
              { value: "🔥 SW Atlanta +12%", label: fr ? "Zone chaude" : "Hot zone" },
            ]}
            accent="#185FA5" gradFrom="#B5D4F4" gradTo="#0C447C" lastBar="#185FA5"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "🏠 4.2M+ " + (fr ? "annonces US" : "US listings"),
            "🌍 12,480 " + (fr ? "biens Afrique" : "Africa properties"),
            "📈 +9% Atlanta YoY",
            "💰 $412k " + (fr ? "prix médian" : "median price"),
          ].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full" style={{ background: "#F9FAFB", border: "0.5px solid #E5E7EB", color: "#6B7280" }}>{t}</span>
          ))}
        </div>
      </section>

      {/* DIASPORA BANNER */}
      <section className="text-white" style={{ background: TF_NAVY_DEEP }}>
        <div className="container mx-auto px-4 py-12 max-w-5xl flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-16 shrink-0">
              <span className="absolute left-0 top-0 w-16 h-16 rounded-full ring-4 ring-white/20 inline-flex items-center justify-center text-2xl" style={{ background: "#012169" }}>🇺🇸</span>
              <span className="absolute right-0 top-0 w-16 h-16 rounded-full ring-4 ring-white/20 inline-flex items-center justify-center text-2xl" style={{ background: TF_GREEN }}>🌍</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl">{fr ? "Membre de la diaspora africaine aux US ?" : "Part of the African diaspora in the US?"}</h3>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                {fr ? "Votre maison US + votre investissement africain — un seul tableau de bord, une seule plateforme." : "Your US home + your African investment — one dashboard, one platform."}
              </p>
            </div>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm shrink-0" style={{ color: TF_NAVY_DEEP }}>
            {fr ? "Ouvrir le portail diaspora" : "Open diaspora portal"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <h2 className="text-2xl font-display font-bold text-tf-navy mb-8">{fr ? "Ce que disent nos membres" : "What our members say"}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <Testimonial initials="KO" color={TF_GREEN} name="Kwame Osei" loc={fr ? "Atlanta GA · Investisseur en CI" : "Atlanta GA · Invested in CI"} quote={fr ? "Acheté mon terrain à Cocody depuis Atlanta en 3 semaines. Titre vérifié, payé en USD, suivi depuis mon téléphone." : "Bought my plot in Cocody from Atlanta in 3 weeks. Title verified, paid in USD, tracked from my phone."} />
          <Testimonial initials="AN" color={TF_PURPLE} name="Amara N'Diaye" loc={fr ? "Houston TX · Premier achat" : "Houston TX · First-time buyer"} quote={fr ? "L'IA m'a trouvé un prêteur acceptant mon ITIN. Pré-approuvé en 48h. Acheter aux US n'a jamais été aussi fluide." : "AI matched me with a lender accepting my ITIN. Pre-approved in 48h. Never thought buying a US home could be this smooth."} />
          <Testimonial initials="MJ" color={TF_GREEN} name="Marcus Johnson" loc={fr ? "Atlanta GA · Artisan" : "Atlanta GA · Contractor"} quote={fr ? "Passé de 2 chantiers par mois à 14. Les paiements sont garantis et mes avis parlent." : "From 2 jobs per month to 14. Payments are guaranteed and my reviews speak."} />
        </div>
      </section>

      {/* CTA SIGNUP */}
      <section className="text-white relative overflow-hidden" style={{ background: TF_NAVY }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-10 w-72 h-72 rounded-full blur-3xl animate-tf-float" style={{ background: TF_BLUE, opacity: 0.08 }} />
          <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full blur-3xl animate-tf-float" style={{ background: TF_GREEN, opacity: 0.08, animationDelay: "2s" }} />
        </div>
        <div className="relative container mx-auto px-4 py-14 max-w-6xl flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold">{fr ? "Rejoignez Diashubb — gratuit pour toujours" : "Join Diashubb — free forever"}</h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              {fr ? "3 minutes · 100 DiasCoins offerts · Sans carte bancaire" : "3 minutes · 100 DiasCoins on signup · No credit card"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm" style={{ color: TF_NAVY }}>
              {fr ? "Créer un compte gratuit" : "Create free account"} <ArrowRight size={16} />
            </Link>
            <Link to="/listings" className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-full font-semibold text-sm" style={{ background: TF_GREEN }}>
              {fr ? "Voir les annonces" : "Browse listings"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============== Sub-components ============== */

function GlassCard({ className = "", delay = "0s", kicker, badge, badgeColor, value, sub, bars, barColor }: {
  className?: string; delay?: string; kicker: string; badge: string; badgeColor: string; value: string; sub: string; bars?: number[]; barColor?: string;
}) {
  return (
    <div className={`rounded-2xl p-4 animate-tf-float backdrop-blur-md ${className}`}
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)", animationDelay: delay }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{kicker}</div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badgeColor}25`, color: badgeColor }}>{badge}</span>
      </div>
      <div className="mt-2 text-[18px] font-display font-bold text-white">{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{sub}</div>
      {bars && barColor && (
        <div className="mt-3 flex items-end gap-1.5 h-10">
          {bars.map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: barColor, opacity: 0.3 + i * 0.15 }} />)}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, link, linkTo = "/listings" }: { title: string; link: string; linkTo?: string }) {
  return (
    <section className="container mx-auto px-4 pt-14 pb-4 max-w-7xl">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-display font-bold text-tf-navy">{title}</h2>
        <Link to={linkTo} className="text-sm font-semibold inline-flex items-center gap-1 text-tf-blue">{link} <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}

function PropertyShell({ children, boosted, accent }: { children: React.ReactNode; boosted?: boolean; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: boosted ? TF_AMBER : (accent || "var(--border)"), borderWidth: boosted ? 1.5 : 1 }}>
      {children}
    </div>
  );
}

function USCard(props: { boosted?: boolean; location: string; locColor?: string; status: string; statusColor: string; title: string; subtitle: string; price: string; tags: string[]; ribbon?: string; bg: string; icon?: "house" | "building" | "apt" }) {
  const Icon = props.icon === "building" ? Building2 : props.icon === "apt" ? Building2 : HomeIcon;
  return (
    <PropertyShell boosted={props.boosted} accent={TF_BLUE}>
      <div className="relative h-20 flex items-center justify-center" style={{ background: `${props.bg}30` }}>
        <Icon size={36} style={{ color: props.bg }} />
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: props.locColor || TF_BLUE }}>{props.location}</span>
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: props.statusColor }}>{props.status}</span>
        {props.ribbon && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: TF_AMBER }}>{props.ribbon}</span>}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-sm font-semibold text-tf-navy">{props.title}</div>
        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5"><MapPin size={10} />{props.subtitle}</div>
        <div className="mt-2 text-lg font-display font-bold" style={{ color: TF_BLUE }}>{props.price}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {props.tags.map((t) => <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>)}
        </div>
      </div>
    </PropertyShell>
  );
}

function AfCard(props: { boosted?: boolean; location: string; locColor?: string; status: string; title: string; subtitle: string; price: string; tags: string[]; ribbon?: string; bg: string }) {
  return (
    <PropertyShell boosted={props.boosted} accent={TF_GREEN}>
      <div className="relative h-20 flex items-center justify-center" style={{ background: `${props.bg}30` }}>
        <Globe2 size={36} style={{ color: props.bg }} />
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: props.locColor || TF_GREEN }}>{props.location}</span>
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: TF_GREEN }}>{props.status}</span>
        {props.ribbon && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: TF_AMBER }}>{props.ribbon}</span>}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="text-sm font-semibold text-tf-navy">{props.title}</div>
        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5"><MapPin size={10} />{props.subtitle}</div>
        <div className="mt-2 text-lg font-display font-bold" style={{ color: TF_GREEN_DEEP }}>{props.price}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {props.tags.map((t) => <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>)}
        </div>
      </div>
    </PropertyShell>
  );
}

function AddCard({ label, to = "/listings_/new" }: { label: string; to?: string }) {
  return (
    <Link to={to} className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-6 hover:border-tf-blue hover:bg-muted/30 transition-colors min-h-[200px]">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-tf-blue"><Plus size={20} /></div>
      <div className="mt-2 text-sm font-semibold text-tf-navy">{label}</div>
    </Link>
  );
}

function ContractorCard(props: { featured?: boolean; initials: string; color: string; name: string; meta: string; rate: string; badge: string; badgeColor: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border flex flex-col"
      style={{ borderColor: props.featured ? TF_BLUE : "var(--border)", borderWidth: props.featured ? 2 : 1 }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: props.color }}>{props.initials}</div>
      <div className="mt-3 text-sm font-semibold text-tf-navy">{props.name}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{props.meta}</div>
      <div className="mt-3 text-base font-display font-bold" style={{ color: TF_BLUE }}>{props.rate}</div>
      <span className="mt-2 text-[10px] font-semibold px-2 py-1 rounded-full self-start text-white" style={{ background: props.badgeColor }}>{props.badge}</span>
    </div>
  );
}

function MarketCard({ title, badge, badgeColor, subtitle, bars, barFrom, barTo, stats }: {
  title: string; badge: string; badgeColor: string; subtitle: string;
  bars: number[]; barFrom: string; barTo: string;
  stats: { label: string; value: string; color?: string; pillColor?: string }[];
}) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];
  const colors = [barFrom, mix(barFrom, barTo, 0.25), mix(barFrom, barTo, 0.5), mix(barFrom, barTo, 0.75), barTo];
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-base font-display font-semibold text-tf-navy">{title}</div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: badgeColor }}>{badge}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{subtitle}</div>
      <div className="mt-4 flex items-end gap-3 h-32">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${h}%`, background: colors[i] }} />
            <div className="text-[10px] font-semibold" style={{ color: i === bars.length - 1 ? barTo : "var(--muted-foreground)" }}>{months[i]}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            {s.pillColor
              ? <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: s.pillColor }}>{s.value}</span>
              : <span className="font-semibold" style={{ color: s.color || "var(--foreground)" }}>{s.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketCardV2({ flag, location, trend, trendPositive, subtitle, bars, stats, accent, gradFrom, gradTo, lastBar }: {
  flag: string; location: string; trend: string; trendPositive: boolean;
  subtitle: string;
  bars: { month: string; value: number; label: string }[];
  stats: { value: string; label: string }[];
  accent: string; gradFrom: string; gradTo: string; lastBar: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-3.5" style={{ borderColor: "rgba(0,0,0,0.08)", borderWidth: 0.5 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>{flag}</span>
          <span className="text-[13px] font-bold text-tf-navy">{location}</span>
        </div>
        <span className="text-[10px] font-semibold rounded-full" style={{
          background: trendPositive ? "#E1F5EE" : "#FCEBEB",
          color: trendPositive ? "#085041" : "#791F1F",
          padding: "2px 8px",
        }}>{trend}</span>
      </div>
      <div className="text-[11px] mt-1 mb-3" style={{ color: "#6B7280" }}>{subtitle}</div>
      <div className="flex items-end gap-1.5" style={{ height: 80 }}>
        {bars.map((b, i) => {
          const isLast = i === bars.length - 1;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div title={b.label} style={{
                width: "100%",
                height: `${b.value}%`,
                borderRadius: "3px 3px 0 0",
                background: isLast ? lastBar : `linear-gradient(to top, ${gradTo}, ${gradFrom})`,
                boxShadow: isLast ? `0 0 8px ${accent}55` : "none",
                animation: `tfBarGrow .6s ${i * 0.1}s ease-out both`,
                transformOrigin: "bottom",
              }} />
              <div className="mt-1" style={{
                fontSize: 9,
                color: isLast ? accent : "#9CA3AF",
                fontWeight: isLast ? 500 : 400,
              }}>{b.month}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-[12px] font-semibold" style={{ color: i === 0 ? accent : "#111827" }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "#9CA3AF" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-right">
        <Link to="/market" className="text-[11px] underline" style={{ color: accent }}>
          {location.includes("Atlanta") ? "View full analysis →" : "Voir l'analyse complète →"}
        </Link>
      </div>
      <style>{`@keyframes tfBarGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}

function Testimonial({ initials, color, name, loc, quote }: { initials: string; color: string; name: string; loc: string; quote: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-soft flex flex-col">
      <div className="flex gap-0.5" style={{ color: TF_AMBER }}>
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="text-sm mt-3 text-foreground/85 flex-1">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: color }}>{initials}</div>
        <div>
          <div className="text-sm font-semibold text-tf-navy">{name}</div>
          <div className="text-[11px] text-muted-foreground">{loc}</div>
        </div>
      </div>
    </div>
  );
}

function mix(a: string, b: string, t: number) {
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
function hex(h: string): [number, number, number] {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
