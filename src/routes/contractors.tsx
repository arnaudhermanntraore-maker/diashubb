import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, MapPin, Star, Shield, Globe2, Languages,
  ArrowRight, HardHat, Loader2, X, ShieldCheck,
  BadgeCheck, Zap, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type ContractorsSearch = { trade?: string; city?: string };

const normalizeFreeText = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const cleaned = v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  if (!/^[\p{L}\p{N}\s'\-.,&()]+$/u.test(cleaned)) return undefined;
  return cleaned.slice(0, max);
};

export const Route = createFileRoute("/contractors")({
  validateSearch: (s: Record<string, unknown>): ContractorsSearch => ({
    trade: normalizeFreeText(s.trade, 40),
    city: normalizeFreeText(s.city, 60),
  }),
  head: () => ({
    meta: [
      { title: "Artisans & entrepreneurs certifiés — Diashubb" },
      { name: "description", content: "Trouvez un artisan vérifié pour vos travaux aux USA et en Afrique." },
    ],
  }),
  component: ContractorsPage,
});

interface Contractor {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  specialties?: string[] | null;
  country: string;
  city?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  since_year?: number | null;
  languages?: string[] | null;
  hourly_rate_usd?: number | null;
  is_verified?: boolean | null;
  is_online?: boolean | null;
  plan?: "free" | "pro" | "business" | null;
  portfolio_urls?: string[] | null;
  years_experience?: number | null;
  zone?: string | null;
}

// Fallback demo data when Supabase table doesn't exist yet
const DEMO_CONTRACTORS: Contractor[] = [
  {
    id: "ctr-1", full_name: "Marcus Johnson", country: "US", city: "Atlanta",
    bio: "General contractor with 12 years of experience in residential renovation and new construction.",
    specialties: ["Renovation", "New Construction", "ADU"],
    rating: 4.9, reviews_count: 87, since_year: 2012,
    languages: ["EN"], hourly_rate_usd: 85,
    is_verified: true, is_online: true, plan: "pro",
    years_experience: 12, zone: "Atlanta, GA · USA",
  },
  {
    id: "ctr-2", full_name: "Bâtisseurs CI", country: "CI", city: "Abidjan",
    bio: "Entreprise de construction et rénovation basée à Cocody, Abidjan. Spécialistes villas et immeubles.",
    specialties: ["Construction", "Rénovation", "Villas"],
    rating: 4.9, reviews_count: 41, since_year: 2022,
    languages: ["FR", "EN"], hourly_rate_usd: null,
    is_verified: true, is_online: true, plan: "business",
    years_experience: 8, zone: "Abidjan · Côte d'Ivoire",
  },
  {
    id: "ctr-3", full_name: "Rivera & Williams", country: "US", city: "Houston",
    bio: "Licensed electricians serving the greater Houston area. Residential and commercial projects.",
    specialties: ["Electrical", "Solar", "Smart Home"],
    rating: 4.8, reviews_count: 63, since_year: 2021,
    languages: ["EN", "ES"], hourly_rate_usd: 95,
    is_verified: true, is_online: false, plan: "pro",
    years_experience: 10, zone: "Houston, TX · USA",
  },
  {
    id: "ctr-4", full_name: "Sahel Build", country: "SN", city: "Dakar",
    bio: "Maçonnerie, gros œuvre et finitions haut de gamme à Dakar. 200+ projets livrés.",
    specialties: ["Maçonnerie", "Gros œuvre", "Finitions"],
    rating: 4.7, reviews_count: 29, since_year: 2023,
    languages: ["FR"], hourly_rate_usd: null,
    is_verified: true, is_online: false, plan: "pro",
    years_experience: 5, zone: "Dakar · Sénégal",
  },
  {
    id: "ctr-5", full_name: "Kwame Design Build", country: "US", city: "Washington",
    bio: "Award-winning renovation firm serving the DC-Maryland-Virginia area. Luxury kitchen and bath.",
    specialties: ["Kitchen", "Bath", "Luxury Renovation"],
    rating: 4.9, reviews_count: 112, since_year: 2020,
    languages: ["EN", "FR"], hourly_rate_usd: 120,
    is_verified: true, is_online: true, plan: "business",
    years_experience: 15, zone: "Washington DC · USA",
  },
  {
    id: "ctr-6", full_name: "BuildRight Cameroun", country: "CM", city: "Douala",
    bio: "Promoteur et entrepreneur général à Douala. Projets résidentiels clé en main.",
    specialties: ["Construction", "Promotion", "Clé en main"],
    rating: 4.6, reviews_count: 18, since_year: 2021,
    languages: ["FR", "EN"], hourly_rate_usd: null,
    is_verified: false, is_online: true, plan: "free",
    years_experience: 6, zone: "Douala · Cameroun",
  },
];

const TRADES = [
  { value: "", label_fr: "Tous les métiers", label_en: "All trades" },
  { value: "renovation", label_fr: "Rénovation", label_en: "Renovation" },
  { value: "construction", label_fr: "Construction", label_en: "Construction" },
  { value: "electrical", label_fr: "Électricité", label_en: "Electrical" },
  { value: "plumbing", label_fr: "Plomberie", label_en: "Plumbing" },
  { value: "kitchen", label_fr: "Cuisine", label_en: "Kitchen" },
  { value: "solar", label_fr: "Solaire", label_en: "Solar" },
];

const PLAN_BADGE: Record<string, { label: string; icon: React.ReactNode; bg: string; color: string }> = {
  business: { label: "Business", icon: <Crown size={10} />, bg: "#FEF3C7", color: "#92400E" },
  pro: { label: "Pro", icon: <Zap size={10} />, bg: "#EDE9FE", color: "#5B21B6" },
  free: { label: "Starter", icon: <Shield size={10} />, bg: "#F3F4F6", color: "#6B7280" },
};

function ContractorsPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | "us" | "africa">("all");
  const [tradeFilter, setTradeFilter] = useState("");
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const [geoCountry, setGeoCountry] = useState<string | null>(null);
  const [authWall, setAuthWall] = useState<Contractor | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);

  // 1. Géolocalisation du visiteur
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const j = await r.json();
          const city = j.address?.city || j.address?.town || j.address?.village || null;
          const cc = j.address?.country_code?.toUpperCase() || null;
          setGeoCity(city);
          setGeoCountry(cc);
          // Auto-filtrer selon continent
          if (cc === "US") setRegionFilter("us");
          else if (cc) setRegionFilter("africa");
        } catch {
          // Géoloc échoue silencieusement
        }
      },
      () => {},
      { timeout: 6000 }
    );
  }, []);

  // 2. Charger les artisans depuis Supabase (ou fallback demo)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contractors")
        .select(`
          id, full_name, avatar_url, bio,
          specialties, country, city,
          rating, reviews_count, since_year,
          languages, hourly_rate_usd,
          is_verified, is_online, plan,
          portfolio_urls, years_experience, zone
        `)
        .order("plan", { ascending: false })
        .order("rating", { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        // Table n'existe pas encore → utiliser données demo
        setContractors(DEMO_CONTRACTORS);
        setUsingDemo(true);
      } else {
        setContractors(data as Contractor[]);
        setUsingDemo(false);
      }
      setLoading(false);
    })();
  }, []);

  // 3. Filtrage
  const US_CODES = ["US"];
  const filtered = contractors.filter((c) => {
    const isUSA = US_CODES.includes(c.country);

    // Filtre géographique
    if (regionFilter === "us" && !isUSA) return false;
    if (regionFilter === "africa" && isUSA) return false;

    // Filtre recherche texte
    if (q) {
      const haystack = `${c.full_name} ${c.city} ${c.country} ${(c.specialties || []).join(" ")} ${c.bio || ""}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }

    // Filtre métier
    if (tradeFilter) {
      const haystack = `${(c.specialties || []).join(" ")} ${c.bio || ""}`.toLowerCase();
      if (!haystack.includes(tradeFilter.toLowerCase())) return false;
    }

    return true;
  });

  const handleContact = (c: Contractor) => {
    if (!user) { setAuthWall(c); return; }
    navigate({ to: "/messages", search: { subject: `Demande — ${c.full_name}` } as never });
  };

  const nearbyCount = geoCountry
    ? filtered.filter((c) => c.country === geoCountry).length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-tf-navy flex items-center gap-2">
          <HardHat size={28} aria-hidden="true" />
          {fr ? "Artisans & entrepreneurs certifiés" : "Certified contractors"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fr
            ? "Trouvez un artisan de confiance pour vos travaux aux USA ou en Afrique."
            : "Find a trusted contractor for your renovation in the US or Africa."}
        </p>

        {/* Géolocalisation banner */}
        {geoCity && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "#E1F5EE", color: "#085041" }}>
            <MapPin size={12} />
            {fr ? `Votre position : ${geoCity}` : `Your location: ${geoCity}`}
            {nearbyCount > 0 && (
              <span className="font-bold">
                · {nearbyCount} {fr ? "artisan(s) proche(s)" : "nearby contractor(s)"}
              </span>
            )}
          </div>
        )}

        {usingDemo && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background: "#FEF3C7", color: "#92400E" }}>
            ⚠️ {fr ? "Données de démonstration — connectez Supabase pour afficher de vrais artisans" : "Demo data — connect Supabase to show real contractors"}
          </div>
        )}
      </div>

      {/* Search + filtres */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft mb-6 sticky top-[50px] z-20 backdrop-blur">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={fr ? "Rechercher un artisan, spécialité, ville…" : "Search contractor, trade, city…"}
            className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Région pills */}
        <div className="flex gap-2 flex-wrap mb-2">
          {[
            { key: "all", label: fr ? "Tous" : "All" },
            { key: "us", label: "🇺🇸 USA" },
            { key: "africa", label: `🌍 ${fr ? "Afrique" : "Africa"}` },
          ].map((f) => (
            <button key={f.key} onClick={() => setRegionFilter(f.key as typeof regionFilter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                regionFilter === f.key
                  ? "text-white border-transparent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
              style={regionFilter === f.key ? { background: "var(--tf-blue)" } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Métier pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {TRADES.map((t) => (
            <button key={t.value} onClick={() => setTradeFilter(t.value)}
              className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                tradeFilter === t.value
                  ? "text-white border-transparent"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={tradeFilter === t.value ? { background: "var(--tf-green)" } : undefined}
            >
              {fr ? t.label_fr : t.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {fr ? "artisan(s) trouvé(s)" : "contractor(s) found"}
          {geoCity && regionFilter !== "all" && (
            <span className="ml-1 text-primary font-medium">
              · {fr ? `près de ${geoCity}` : `near ${geoCity}`}
            </span>
          )}
        </p>
        <Link to="/contractors/register" className="text-xs text-primary font-medium hover:underline">
          + {fr ? "Devenir artisan partenaire" : "Join as contractor"}
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <HardHat size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {fr ? "Aucun artisan trouvé. Essayez d'élargir vos filtres." : "No contractors found. Try broadening your filters."}
          </p>
          <button onClick={() => { setQ(""); setRegionFilter("all"); setTradeFilter(""); }}
            className="mt-3 text-primary text-sm underline">
            {fr ? "Réinitialiser les filtres" : "Reset filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContractorCard key={c.id} c={c} fr={fr} onContact={handleContact} />
          ))}
        </div>
      )}

      {/* CTA rejoindre */}
      <div className="mt-12 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ background: "#E6F1FB" }}>
        <div>
          <h2 className="font-display font-bold text-lg text-tf-navy">
            {fr ? "Vous êtes artisan ou entreprise du bâtiment ?" : "Are you a contractor or construction company?"}
          </h2>
          <p className="text-sm text-foreground/80 mt-1 max-w-xl">
            {fr
              ? "Rejoignez Diashubb et recevez des chantiers qualifiés de la diaspora africaine. Démarrez gratuitement."
              : "Join Diashubb and receive qualified jobs from the African diaspora. Start for free."}
          </p>

          {/* Plans freemium */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {[
              { plan: "free", label: fr ? "Starter — Gratuit" : "Starter — Free", desc: fr ? "Profil basique, 5 leads/mois" : "Basic profile, 5 leads/month" },
              { plan: "pro", label: fr ? "Pro — $29/mois" : "Pro — $29/mo", desc: fr ? "Photo + bio + leads illimités" : "Photo + bio + unlimited leads" },
              { plan: "business", label: fr ? "Business — $79/mois" : "Business — $79/mo", desc: fr ? "Badge vérifié + priorité + portfolio" : "Verified badge + priority + portfolio" },
            ].map((p) => {
              const badge = PLAN_BADGE[p.plan];
              return (
                <div key={p.plan} className="bg-white rounded-xl p-3 border border-border flex items-start gap-2 min-w-[160px]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                    style={{ background: badge.bg, color: badge.color }}>
                    {badge.icon} {badge.label}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-tf-navy">{p.label}</div>
                    <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Link to="/signup"
          className="inline-flex items-center justify-center gap-2 text-white font-semibold text-sm px-5 py-3 rounded-xl shrink-0 w-full md:w-auto"
          style={{ background: "var(--tf-blue)" }}>
          {fr ? "Devenir partenaire →" : "Become a partner →"}
        </Link>
      </div>

      {/* Comment ça marche */}
      <div className="mt-10">
        <h2 className="font-display font-bold text-xl text-tf-navy mb-5">
          {fr ? "Comment ça marche" : "How it works"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              n: 1,
              title: fr ? "Créez votre profil vérifié" : "Create your verified profile",
              text: fr ? "Photo, bio, spécialités, zone d'intervention et portfolio de chantiers." : "Photo, bio, specialties, coverage area and project portfolio.",
            },
            {
              n: 2,
              title: fr ? "Publiez vos services FR/EN" : "List your services FR/EN",
              text: fr ? "Photos de chantiers, devis types, langues parlées." : "Project photos, sample quotes, languages spoken.",
            },
            {
              n: 3,
              title: fr ? "Recevez des chantiers qualifiés" : "Receive qualified jobs",
              text: fr ? "Clients diaspora et locaux, paiement sécurisé escrow." : "Diaspora and local clients, secure escrow payment.",
            },
          ].map((s) => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center mb-3"
                style={{ background: "var(--tf-blue)" }}>{s.n}</div>
              <h3 className="font-semibold text-sm text-tf-navy">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth wall modal */}
      {authWall && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setAuthWall(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              onClick={() => setAuthWall(null)}>
              <X size={18} />
            </button>
            <h3 className="font-display font-bold text-lg text-tf-navy">
              {fr ? "Connectez-vous pour contacter cet artisan" : "Sign in to contact this contractor"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{authWall.full_name}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                fr ? "Messagerie sécurisée chiffrée" : "Encrypted secure messaging",
                fr ? "Suivi de vos demandes" : "Track your requests",
                fr ? "Devis et documents vérifiés" : "Verified quotes and documents",
                fr ? "Paiement escrow sécurisé" : "Secure escrow payment",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-tf-green mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <Link to="/signup"
              className="mt-5 block text-center text-white font-semibold py-2.5 rounded-lg"
              style={{ background: "var(--tf-blue)" }}>
              {fr ? "Créer un compte gratuit →" : "Create free account →"}
            </Link>
            <Link to="/auth"
              className="mt-2 block text-center text-sm text-tf-blue font-semibold">
              {fr ? "J'ai déjà un compte" : "I already have an account"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ContractorCard({
  c, fr, onContact,
}: {
  c: Contractor;
  fr: boolean;
  onContact: (c: Contractor) => void;
}) {
  const badge = PLAN_BADGE[c.plan || "free"];
  const isUSA = c.country === "US";

  return (
    <article
      className="bg-card rounded-2xl p-5 shadow-soft border transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
      style={{
        borderWidth: c.plan === "business" ? 2 : 1,
        borderColor: c.plan === "business" ? "var(--tf-blue)" : "hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt={c.full_name}
              className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: isUSA ? "var(--tf-blue)" : "var(--tf-green)" }}>
              {c.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
          )}
          {c.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {c.is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: "var(--tf-green)" }}>
                <BadgeCheck size={10} />
                {fr ? "Certifié" : "Verified"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: badge.bg, color: badge.color }}>
              {badge.icon} {badge.label}
            </span>
          </div>

          <h3 className="font-bold text-sm mt-1 text-tf-navy truncate">{c.full_name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{c.zone || `${c.city}, ${c.country}`}</span>
          </p>
        </div>
      </div>

      {/* Bio */}
      {c.bio && (
        <p className="text-xs text-foreground/75 mt-3 line-clamp-2">{c.bio}</p>
      )}

      {/* Spécialités */}
      {c.specialties && c.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {c.specialties.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-3">
        {c.rating && (
          <span className="flex items-center gap-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {c.rating.toFixed(1)}
            {c.reviews_count ? ` (${c.reviews_count})` : ""}
          </span>
        )}
        {c.years_experience && (
          <span>{c.years_experience} {fr ? "ans d'exp." : "yrs exp."}</span>
        )}
        {c.hourly_rate_usd && (
          <span className="font-semibold text-foreground">${c.hourly_rate_usd}/hr</span>
        )}
      </div>

      {c.languages && c.languages.length > 0 && (
        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
          <Languages size={11} className="shrink-0" />
          {c.languages.join(" · ")}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border/60">
        <Link
          to="/listings"
          search={{ contractor: c.id } as never}
          className="flex-1 inline-flex items-center justify-center gap-1 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90"
          style={{ background: "var(--tf-blue)" }}
        >
          {fr ? "Voir projets" : "View projects"} <ArrowRight size={12} />
        </Link>
        <button
          onClick={() => onContact(c)}
          className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 hover:bg-muted transition-colors"
          style={{ borderColor: "var(--tf-blue)", color: "var(--tf-blue)" }}
        >
          {fr ? "Contacter" : "Contact"}
        </button>
      </div>

      {/* Plan upgrade nudge for free */}
      {c.plan === "free" && (
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          {fr ? "Profil limité · " : "Limited profile · "}
          <Link to="/pricing" className="text-primary underline">
            {fr ? "Passer Pro" : "Upgrade to Pro"}
          </Link>
        </p>
      )}
    </article>
  );
}
