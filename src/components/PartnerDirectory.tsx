import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Globe2, ShieldCheck, Star, Languages, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export type PartnerCard = {
  id: string;
  initials: string;
  avatarColor: string; // tailwind bg class or css color
  badge: { label: string; tone: "green" | "blue" };
  name: string;
  location: string;
  region: "usa" | "africa";
  speciality: string;
  listings: number;
  rating: number;
  reviews?: number;
  since: number;
  languages: string[];
  online?: boolean;
  certified?: boolean;
  featured?: boolean;
};

type Props = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  cards: PartnerCard[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  steps: { title: string; text: string }[];
  partnerKind: "agent" | "contractor" | "broker"; // used for messaging subject
};

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "usa", label: "USA" },
  { key: "africa", label: "Afrique" },
  { key: "certified", label: "Certifiés" },
  { key: "online", label: "En ligne" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

export function PartnerDirectory({ title, subtitle, searchPlaceholder, cards, ctaTitle, ctaText, ctaButton, steps, partnerKind }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [authWall, setAuthWall] = useState<PartnerCard | null>(null);
  const { user } = useAuth();
  const nav = useNavigate();

  const filtered = cards.filter((c) => {
    if (q && !`${c.name} ${c.location} ${c.speciality}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "usa" && c.region !== "usa") return false;
    if (filter === "africa" && c.region !== "africa") return false;
    if (filter === "certified" && !c.certified) return false;
    if (filter === "online" && !c.online) return false;
    return true;
  });

  const handleContact = (card: PartnerCard) => {
    if (!user) { setAuthWall(card); return; }
    const subject = `Demande de renseignement — ${card.name}`;
    nav({ to: "/messages", search: { subject } as never });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-tf-navy">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
      </div>

      {/* Search + filters */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft mb-6">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                filter === f.key
                  ? "text-white border-transparent"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
              style={filter === f.key ? { background: "var(--tf-blue)" } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((c) => (
          <article
            key={c.id}
            className="bg-card rounded-2xl p-5 shadow-soft border transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              borderWidth: c.featured ? 2 : 1,
              borderColor: c.featured ? "var(--tf-blue)" : "hsl(var(--border))",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: c.avatarColor }}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: c.badge.tone === "green" ? "var(--tf-green)" : "var(--tf-blue)" }}
                  >
                    <ShieldCheck size={10} /> {c.badge.label}
                  </span>
                  {c.online && <span className="text-[10px] font-semibold text-tf-green flex items-center gap-1">● En ligne</span>}
                </div>
                <h3 className="font-bold text-sm mt-1 text-tf-navy truncate">{c.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Globe2 size={12} /> {c.location}
                </p>
                <p className="text-xs text-foreground/80 mt-1">{c.speciality}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">{c.listings} annonces</span>
                  <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-400 text-amber-400" /> {c.rating.toFixed(1)}{c.reviews ? ` (${c.reviews} avis)` : ""}</span>
                  <span>Membre depuis {c.since}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Languages size={11} /> {c.languages.join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link
                to="/listings"
                search={{ agent: c.id } as never}
                className="flex-1 inline-flex items-center justify-center gap-1 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90"
                style={{ background: "var(--tf-blue)" }}
              >
                Voir les annonces <ArrowRight size={12} />
              </Link>
              <button
                onClick={() => handleContact(c)}
                className="flex-1 text-xs font-semibold py-2 rounded-lg border-2 hover:bg-muted"
                style={{ borderColor: "var(--tf-blue)", color: "var(--tf-blue)" }}
              >
                Contacter
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Register CTA */}
      <div className="mt-10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "#E6F1FB" }}>
        <div>
          <h2 className="font-display font-bold text-lg text-tf-navy">{ctaTitle}</h2>
          <p className="text-sm text-foreground/80 mt-1 max-w-2xl">{ctaText}</p>
        </div>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-white font-semibold text-sm px-5 py-3 rounded-lg shrink-0"
          style={{ background: "var(--tf-blue)" }}
        >
          {ctaButton} <ArrowRight size={14} />
        </Link>
      </div>

      {/* How it works */}
      <div className="mt-10">
        <h2 className="font-display font-bold text-xl text-tf-navy mb-5">Comment ça marche</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center mb-3" style={{ background: "var(--tf-blue)" }}>{i + 1}</div>
              <h3 className="font-semibold text-sm text-tf-navy">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth wall modal */}
      {authWall && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAuthWall(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" onClick={() => setAuthWall(null)}>
              <X size={18} />
            </button>
            <h3 className="font-display font-bold text-lg text-tf-navy">Connectez-vous pour contacter cette agence</h3>
            <p className="text-sm text-muted-foreground mt-1">{authWall.name}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                "Messagerie sécurisée chiffrée",
                "Suivi de vos demandes et favoris",
                "Accès aux documents vérifiés",
                "Alertes personnalisées USA & Afrique",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2"><ShieldCheck size={16} className="text-tf-green mt-0.5 shrink-0" /> {b}</li>
              ))}
            </ul>
            <Link to="/auth" className="mt-5 block text-center text-white font-semibold py-2.5 rounded-lg" style={{ background: "var(--tf-blue)" }}>
              Créer un compte gratuit →
            </Link>
            <Link to="/auth" className="mt-2 block text-center text-sm text-tf-blue font-semibold">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
