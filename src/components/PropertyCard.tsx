import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

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
}

export function PropertyCard({ p }: { p: Property }) {
  const { t } = useTranslation();
  return (
    <Link to="/property/$id" params={{ id: p.id }} className="group block bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all border border-border">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-earth flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
        {p.tf_verified && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-success text-success-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full">
            <ShieldCheck size={12} /> {t("property.verified")}
          </div>
        )}
        {p.ai_score != null && p.ai_score > 0 && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-background/95 text-foreground text-xs font-semibold px-2 py-1 rounded-full">
            <Sparkles size={12} className="text-accent" /> {p.ai_score}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-base line-clamp-1">{p.title}</h3>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin size={12} />{p.city ? `${p.city}, ` : ""}{p.country}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold text-primary font-display">${Number(p.price_usd).toLocaleString()}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.type}</span>
        </div>
      </div>
    </Link>
  );
}
