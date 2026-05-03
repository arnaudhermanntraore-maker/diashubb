import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, Coins, Gift, DollarSign, Search, Tv, Sparkles, FileCheck2, BellRing, Building2, Globe2, HardHat, BadgeCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraFrique — Your home in America. Your land in Africa." },
      { name: "description", content: "Bi-continental real estate platform. Verified titles, secure escrow, AI-scored listings across the US and Africa." },
      { property: "og:title", content: "TerraFrique Global" },
      { property: "og:description", content: "Your home in America. Your land in Africa." },
    ],
  }),
  component: Home,
});

const TF_NAVY = "#0A3060";
const TF_NAVY_DEEP = "#042C53";
const TF_BLUE = "#185FA5";
const TF_GREEN = "#1D9E75";
const TF_AMBER = "#EF9F27";
const TF_PURPLE = "#7C5DD3";
const TF_LIME = "#A6CE39";

function Home() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Property[]>([]);
  const [tab, setTab] = useState<"buy_us" | "rent_us" | "invest_af" | "contractor" | "estimate">("buy_us");
  const fr = i18n.language === "fr";

  useEffect(() => {
    supabase.from("properties").select("id,title,country,city,price_usd,type,cover_url,ai_score,tf_verified,boosted_until").eq("status", "active").order("boosted_until", { ascending: false, nullsFirst: false }).limit(8).then(({ data }) => {
      setItems((data ?? []) as Property[]);
    });
  }, []);

  const tabs = [
    { id: "buy_us",     label: fr ? "Acheter US"      : "Buy US",          color: TF_BLUE },
    { id: "rent_us",    label: fr ? "Louer US"        : "Rent US",         color: TF_BLUE },
    { id: "invest_af",  label: fr ? "Investir Afrique": "Invest Africa",   color: TF_GREEN },
    { id: "contractor", label: fr ? "Contractant"     : "Find contractor", color: TF_BLUE },
    { id: "estimate",   label: fr ? "Estimer"         : "Estimate value",  color: TF_BLUE },
  ] as const;

  const activeTab = tabs.find((x) => x.id === tab)!;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: TF_NAVY }}>
        <div className="absolute inset-0 bg-grid-overlay opacity-60 pointer-events-none" />
        {/* Floating circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full animate-tf-float" style={{ background: TF_BLUE, opacity: 0.12 }} />
          <div className="absolute top-40 right-1/3 w-96 h-96 rounded-full animate-tf-float" style={{ background: TF_GREEN, opacity: 0.12, animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full animate-tf-float" style={{ background: "#85B7EB", opacity: 0.1, animationDelay: "3s" }} />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28 max-w-7xl grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <span className="inline-block text-[11px] uppercase tracking-[0.3em] font-semibold mb-5" style={{ color: "#85B7EB" }}>
              {fr ? "Plateforme bi-continentale" : "Bi-continental platform"}
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-[1.05]">
              {fr ? "Votre maison en " : "Your home in "}
              <span style={{ color: "#85B7EB" }}>{fr ? "Amérique" : "America"}</span>.<br />
              {fr ? "Votre terre en " : "Your land in "}
              <span style={{ color: "#5DCAA5" }}>{fr ? "Afrique" : "Africa"}</span>.
            </h1>
            <p className="mt-5 text-base md:text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
              {fr
                ? "Achetez, vendez et investissez entre les États-Unis et l'Afrique. Titres vérifiés, paiements sécurisés, agents certifiés."
                : "Buy, sell and invest across the US and Africa. Verified titles, secure escrow, certified agents."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/listings" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm hover:scale-[1.02] transition-transform" style={{ color: TF_NAVY }}>
                {fr ? "Explorer les biens" : "Browse properties"} <ArrowRight size={16} />
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition" style={{ background: TF_GREEN }}>
                {fr ? "Créer un compte" : "Create free account"}
              </Link>
              <Link to="/agents" className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-full font-semibold text-sm hover:bg-white/10 transition" style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.7)" }}>
                {fr ? "Devenir agent" : "Become an agent"}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
              {[
                { icon: ShieldCheck, label: fr ? "Titres vérifiés par IA" : "AI-verified titles" },
                { icon: Coins,       label: fr ? "100 TerraCoins offerts" : "100 TerraCoins signup" },
                { icon: Gift,        label: fr ? "Inscription gratuite"   : "Free to join" },
                { icon: DollarSign,  label: fr ? "12 $ frais de transfert": "$12 flat transfer fee" },
              ].map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5"><b.icon size={14} className="text-tf-green-light" /> {b.label}</span>
              ))}
            </div>
          </div>

          {/* Floating data cards */}
          <div className="md:col-span-5 relative h-[320px] hidden md:block">
            <FloatCard className="absolute top-0 right-2 w-60" style={{ animationDelay: "0s" }} kicker={fr ? "Marché US Atlanta" : "US market · Atlanta"} value="$412,000" sub={fr ? "Prix médian" : "Median home price"} accent={TF_BLUE} />
            <FloatCard className="absolute top-32 left-0 w-60" style={{ animationDelay: "1s" }} kicker="Cocody · CI" value="+8% YoY" sub={fr ? "Croissance valeur" : "Value growth"} accent={TF_GREEN} />
            <FloatCard className="absolute bottom-0 right-10 w-60" style={{ animationDelay: "2s" }} kicker="USD → XOF" value="655 XOF" sub={fr ? "Taux en direct" : "Live FX rate"} accent={TF_AMBER} />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { icon: Building2, color: TF_BLUE,   num: "4.2M+",  label: fr ? "Annonces" : "Listings" },
            { icon: Globe2,    color: TF_GREEN,  num: "12,480", label: fr ? "Biens Afrique" : "Africa properties" },
            { icon: HardHat,   color: TF_AMBER,  num: "12k+",   label: fr ? "Contractants" : "Contractors" },
            { icon: BadgeCheck,color: TF_PURPLE, num: "96%",    label: fr ? "Vérifiés" : "Verified" },
            { icon: Users,     color: TF_LIME,   num: "44M+",   label: "Diaspora" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <s.icon size={28} style={{ color: s.color }} />
              <div className="mt-2 text-2xl font-display font-bold text-tf-navy">{s.num}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH BOX */}
      <section className="bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className="text-xs font-semibold px-4 py-2 rounded-full transition-colors border"
                  style={active
                    ? { background: tb.color, color: "#fff", borderColor: tb.color }
                    : { background: "#fff", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>
          <div className="bg-white border border-border rounded-2xl p-3 grid grid-cols-1 md:grid-cols-12 gap-2 shadow-soft">
            <select className="md:col-span-3 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none">
              <option>{fr ? "Pays" : "Country"}</option>
              <option>USA</option><option>Côte d'Ivoire</option><option>Sénégal</option><option>Ghana</option><option>Maroc</option>
            </select>
            <select className="md:col-span-3 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none">
              <option>{fr ? "Type" : "Type"}</option>
              <option>{fr ? "Maison" : "House"}</option><option>{fr ? "Terrain" : "Land"}</option><option>{fr ? "Appartement" : "Apartment"}</option>
            </select>
            <select className="md:col-span-3 px-3 py-2.5 bg-muted rounded-xl text-sm outline-none">
              <option>{fr ? "Prix max" : "Max price"}</option>
              <option>$100k</option><option>$300k</option><option>$1M</option>
            </select>
            <Link to="/listings" className="md:col-span-3 inline-flex items-center justify-center gap-2 text-white font-semibold rounded-xl text-sm" style={{ background: activeTab.color }}>
              <Search size={16} /> {fr ? "Rechercher" : "Search"}
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-display font-bold text-tf-navy">{fr ? "Biens à la une" : "Featured properties"}</h2>
          <Link to="/listings" className="text-sm font-semibold inline-flex items-center gap-1 text-tf-blue">{fr ? "Tout voir" : "View all"} <ArrowRight size={16} /></Link>
        </div>
        {items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-y border-border">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-tf-navy">{fr ? "Comment ça marche" : "How it works"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            {[
              { icon: Search,     color: TF_BLUE,   label: fr ? "Rechercher" : "Search" },
              { icon: Tv,         color: TF_PURPLE, label: fr ? "Visite 360°" : "Tour 360°" },
              { icon: Sparkles,   color: TF_GREEN,  label: fr ? "Score IA" : "AI Score" },
              { icon: FileCheck2, color: TF_LIME,   label: fr ? "Vérifier" : "Verify docs" },
              { icon: BellRing,   color: TF_AMBER,  label: fr ? "Alertes" : "Get alerts" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-soft" style={{ background: s.color }}>
                  <s.icon size={26} />
                </div>
                <div className="mt-3 text-sm font-semibold text-tf-navy">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIASPORA BANNER */}
      <section className="text-white" style={{ background: TF_NAVY_DEEP }}>
        <div className="container mx-auto px-4 py-14 max-w-5xl flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-16">
              <span className="absolute left-0 top-0 w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20 inline-flex items-center justify-center text-2xl" style={{ background: "#012169" }}>🇺🇸</span>
              <span className="absolute right-0 top-0 w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20 inline-flex items-center justify-center text-2xl" style={{ background: TF_GREEN }}>🌍</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl">{fr ? "Vous êtes de la diaspora africaine aux US ?" : "Part of the African diaspora in the US?"}</h3>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                {fr ? "Investissez chez vous, sans quitter chez vous." : "Invest back home, without leaving home."}
              </p>
            </div>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm shrink-0" style={{ color: TF_NAVY }}>
            {fr ? "Portail diaspora" : "Open diaspora portal"} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* CTA SIGNUP */}
      <section className="text-white text-center" style={{ background: TF_NAVY }}>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold">{fr ? "Prêt à commencer ?" : "Ready to get started?"}</h2>
          <p className="mt-3" style={{ color: "rgba(255,255,255,0.75)" }}>
            {fr ? "Rejoignez 44M+ membres de la diaspora qui investissent intelligemment." : "Join 44M+ diaspora members investing smarter."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/auth" className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full font-semibold text-sm" style={{ color: TF_NAVY }}>
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

function FloatCard({ className = "", style, kicker, value, sub, accent }: { className?: string; style?: React.CSSProperties; kicker: string; value: string; sub: string; accent: string }) {
  return (
    <div
      className={`bg-white text-foreground rounded-2xl shadow-elegant p-4 animate-tf-float ${className}`}
      style={{ borderLeft: `4px solid ${accent}`, ...style }}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{kicker}</div>
      <div className="mt-1 text-2xl font-display font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
