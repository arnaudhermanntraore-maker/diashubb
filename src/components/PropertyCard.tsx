import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, MapPin, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PriceDisplay } from "@/components/PriceDisplay";

export interface Property {
  id: string;
  title: string;
  country: string;
  city?: string | null;
  price_usd: number;
  type: string;
  cover_url?: string | null;
  ai_score?: number | null;
  tf_verified: boolean;
  lat?: number | null;
  lng?: number | null;
  boosted_until?: string | null;
}

export function PropertyCard({ p }: { p: Property }) {
  const { t } = useTranslation();
  const isUSA = p.country === "US";
  const accent = isUSA ? "var(--tf-blue)" : "var(--tf-green)";
  const boosted = p.boosted_until && new Date(p.boosted_until) > new Date();

  const daysLeft = boosted ? Math.ceil((new Date(p.boosted_until!).getTime() - Date.now()) / 86400000) : 0;

  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group block bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all border"
      style={{
        borderLeft: `4px solid ${accent}`,
        borderColor: boosted ? "var(--tf-amber)" : "var(--border)",
        borderWidth: boosted ? "1.5px" : "1px",
      }}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        {p.tf_verified && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--tf-green)" }}>
            <ShieldCheck size={12} /> {t("property.verified")}
          </div>
        )}
        {boosted && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--tf-amber)" }}>
            BOOST ACTIF
          </div>
        )}
        {!boosted && p.ai_score != null && p.ai_score > 0 && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white text-tf-navy text-xs font-bold px-2 py-1 rounded-full shadow-soft">
            <Sparkles size={12} className="text-tf-amber" /> {p.ai_score}
          </div>
        )}
        {boosted && (
          <div className="absolute bottom-0 left-0 right-0 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center inline-flex items-center justify-center gap-1" style={{ background: "var(--tf-amber)" }}>
            <Flame size={12} /> Mis en avant · J{daysLeft > 0 ? `-${daysLeft}` : ""} encore
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-base line-clamp-1 text-tf-navy">{p.title}</h3>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin size={12} />{p.city ? `${p.city}, ` : ""}{p.country}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <PriceDisplay priceUsd={Number(p.price_usd)} country={p.country} size="lg" style={{ color: accent }} />
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{p.type}</span>
        </div>
      </div>
    </Link>
  );
}
