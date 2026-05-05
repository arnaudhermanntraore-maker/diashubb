import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, MapPin, Flame, Camera, Bed, Bath, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { PriceDisplay } from "@/components/PriceDisplay";
import { FavoriteButton } from "@/components/FavoriteButton";

export interface Property {
  id: string;
  title: string;
  title_fr?: string | null;
  title_en?: string | null;
  country: string;
  city?: string | null;
  neighborhood?: string | null;
  price_usd: number;
  type: string;
  cover_url?: string | null;
  images?: string[] | null;
  ai_score?: number | null;
  tf_verified: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surface_m2?: number | null;
  has_360_tour?: boolean | null;
  lat?: number | null;
  lng?: number | null;
  boosted_until?: string | null;
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&auto=format&fit=crop";

export function PropertyCard({ p }: { p: Property }) {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const isUSA = p.country === "US";
  const accent = isUSA ? "var(--tf-blue)" : "var(--tf-green)";
  const boosted = p.boosted_until && new Date(p.boosted_until) > new Date();
  const daysLeft = boosted ? Math.ceil((new Date(p.boosted_until!).getTime() - Date.now()) / 86400000) : 0;

  const title = (fr ? p.title_fr : p.title_en) || p.title;
  const photos = (p.images && p.images.length > 0 ? p.images : p.cover_url ? [p.cover_url] : []).filter(Boolean);
  const photoCount = photos.length;
  const [imgSrc, setImgSrc] = useState<string>(photos[0] || FALLBACK_IMG);

  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      aria-label={title}
      className="group block bg-card rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 shadow-soft hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
      style={{
        borderLeft: `4px solid ${accent}`,
        borderColor: boosted ? "var(--tf-amber)" : "var(--border)",
        borderWidth: boosted ? "1.5px" : "1px",
      }}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {photos.length > 0 || imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            onError={() => setImgSrc(FALLBACK_IMG)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-2" style={{ background: "#F3F4F6" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 11l9-8 9 8M5 9.5V21h14V9.5"/></svg>
            <span>{fr ? "Aucune photo" : "No photo available"}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10"><FavoriteButton propertyId={p.id} /></div>

        {p.tf_verified && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--tf-green)" }}>
            <ShieldCheck size={12} /> {t("property.verified")}
          </div>
        )}

        {/* 360 badge bottom-left */}
        {p.has_360_tour && (
          <div className="absolute bottom-3 left-3 text-white text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#185FA5" }}>
            360°
          </div>
        )}

        {/* Photo count bottom-right */}
        {photoCount > 1 && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
            <Camera size={10} /> {photoCount}
          </div>
        )}

        {!boosted && p.ai_score != null && p.ai_score > 0 && !p.tf_verified && (
          <div className="absolute top-3 right-12 inline-flex items-center gap-1 bg-white text-tf-navy text-xs font-bold px-2 py-1 rounded-full shadow-soft">
            <Sparkles size={12} className="text-tf-amber" /> {p.ai_score}
          </div>
        )}

        {boosted && (
          <div className="absolute bottom-0 left-0 right-0 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center inline-flex items-center justify-center gap-1" style={{ background: "var(--tf-amber)" }}>
            <Flame size={12} /> {fr ? "Mis en avant" : "Featured"} · J{daysLeft > 0 ? `-${daysLeft}` : ""}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-base line-clamp-1 text-tf-navy">{title}</h3>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
          <MapPin size={12} />
          {[p.neighborhood, p.city, p.country].filter(Boolean).join(", ")}
        </p>

        {(p.bedrooms || p.bathrooms || p.surface_m2) && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            {p.bedrooms ? <span className="inline-flex items-center gap-1"><Bed size={11} /> {p.bedrooms}</span> : null}
            {p.bathrooms ? <span className="inline-flex items-center gap-1"><Bath size={11} /> {p.bathrooms}</span> : null}
            {p.surface_m2 ? <span className="inline-flex items-center gap-1"><Maximize2 size={11} /> {p.surface_m2}m²</span> : null}
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between">
          <PriceDisplay priceUsd={Number(p.price_usd)} country={p.country} size="lg" style={{ color: accent }} />
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{p.type}</span>
        </div>
      </div>
    </Link>
  );
}
