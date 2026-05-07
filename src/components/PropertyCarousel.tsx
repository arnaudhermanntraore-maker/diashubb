import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Camera, Bed, Bath, Maximize2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { FavoriteButton } from "@/components/FavoriteButton";

interface CarouselProperty {
  id: string;
  title: string;
  title_fr: string | null;
  title_en: string | null;
  price_usd: number;
  type: string;
  city: string | null;
  country: string;
  bedrooms: number | null;
  bathrooms: number | null;
  surface_m2: number | null;
  ai_score: number | null;
  has_360_tour: boolean | null;
  cover_url: string | null;
  images: string[] | null;
  boosted_until: string | null;
  agent_id: string;
}

const SELECT =
  "id,title,title_fr,title_en,price_usd,type,city,country,bedrooms,bathrooms,surface_m2,ai_score,has_360_tour,cover_url,images,boosted_until,agent_id";

const TYPE_LABEL: Record<string, { fr: string; en: string; emoji: string }> = {
  house: { fr: "Maison", en: "House", emoji: "🏠" },
  villa: { fr: "Villa", en: "Villa", emoji: "🏡" },
  apartment: { fr: "Appart.", en: "Apt.", emoji: "🏢" },
  land: { fr: "Terrain", en: "Land", emoji: "🌿" },
  commercial: { fr: "Commerce", en: "Retail", emoji: "🏬" },
};

const COUNTRY_FLAG: Record<string, string> = {
  US: "🇺🇸", CI: "🇨🇮", SN: "🇸🇳", GH: "🇬🇭", NG: "🇳🇬", CM: "🇨🇲",
  KE: "🇰🇪", ZA: "🇿🇦", ML: "🇲🇱", BJ: "🇧🇯", TG: "🇹🇬", BF: "🇧🇫",
  GN: "🇬🇳", RW: "🇷🇼", ET: "🇪🇹", MA: "🇲🇦", DZ: "🇩🇿", TN: "🇹🇳",
};

function formatPrice(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(usd >= 10_000_000 ? 0 : 1)}M`;
  return `$${Math.round(usd).toLocaleString("en-US")}`;
}

function aiScoreColor(score: number): string {
  if (score >= 80) return "#0F6E56";
  if (score >= 60) return "#854F0B";
  return "#A32D2D";
}

interface Props {
  region: "us" | "africa";
  title: string;
  subtitle: string;
  viewAllLabel: string;
}

export function PropertyCarousel({ region, title, subtitle, viewAllLabel }: Props) {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const [items, setItems] = useState<CarouselProperty[] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<number | null>(null);

  const accent = region === "us" ? "#185FA5" : "#1D9E75";
  const viewAllHref = region === "us" ? "/listings" : "/listings";

  useEffect(() => {
    let q = supabase
      .from("properties")
      .select(SELECT)
      .eq("status", "active")
      .order("boosted_until", { ascending: false, nullsFirst: false })
      .order("ai_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(20);
    q = region === "us" ? q.eq("country", "US") : q.neq("country", "US");
    q.then(({ data }) => {
      setItems(((data ?? []) as unknown as CarouselProperty[]));
    });
  }, [region]);

  // Pause when offscreen
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!trackRef.current) return;
        trackRef.current.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      },
      { threshold: 0.05 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [items]);

  const list = items ?? [];
  const boostedCount = list.filter((p) => p.boosted_until && new Date(p.boosted_until) > new Date()).length;
  const duplicated = useMemo(() => [...list, ...list], [list]);
  const duration = Math.max(20, list.length * 4);

  const handleTouchStart = () => {
    if (!trackRef.current) return;
    trackRef.current.style.animationPlayState = "paused";
    if (touchTimer.current) window.clearTimeout(touchTimer.current);
  };
  const handleTouchEnd = () => {
    touchTimer.current = window.setTimeout(() => {
      if (trackRef.current) trackRef.current.style.animationPlayState = "running";
    }, 2000);
  };

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className="bg-white relative overflow-hidden" style={{ padding: "32px 0" }}>
      <div className="max-w-7xl mx-auto" style={{ padding: "0 16px" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-bold" style={{ fontSize: 14, color: "#111827" }}>{title}</h2>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{subtitle}</p>
          </div>
          <Link to={viewAllHref} className="text-[12px] font-semibold inline-flex items-center gap-1" style={{ color: accent }}>
            {viewAllLabel} →
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden sm:block" style={{ width: 40, background: "linear-gradient(to right, white, transparent)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] hidden sm:block" style={{ width: 40, background: "linear-gradient(to left, white, transparent)" }} />

        {/* nav arrows */}
        <button
          aria-label="Previous"
          onClick={() => scrollBy(-260)}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white items-center justify-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          <ChevronLeft size={18} style={{ color: accent }} />
        </button>
        <button
          aria-label="Next"
          onClick={() => scrollBy(260)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white items-center justify-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          <ChevronRight size={18} style={{ color: accent }} />
        </button>

        {items === null ? (
          <div className="flex gap-[14px] overflow-hidden" style={{ padding: "0 16px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 rounded-[14px] bg-gray-100 animate-pulse" style={{ width: 240, height: 260 }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">{fr ? "Aucun bien disponible" : "No properties available"}</div>
        ) : (
          <div
            ref={scrollerRef}
            className="overflow-x-auto no-scrollbar"
            onMouseEnter={() => { if (trackRef.current) trackRef.current.style.animationPlayState = "paused"; }}
            onMouseLeave={() => { if (trackRef.current) trackRef.current.style.animationPlayState = "running"; }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={trackRef}
              className="tf-carousel-track flex"
              style={{
                gap: 14,
                padding: "8px 16px",
                width: "fit-content",
                animation: `tf-scroll-left ${duration}s linear infinite`,
                willChange: "transform",
              }}
            >
              {duplicated.map((p, idx) => {
                const isLastBoosted = boostedCount > 0 && idx === boostedCount - 1;
                const isLastBoostedClone = boostedCount > 0 && idx === list.length + boostedCount - 1;
                return (
                  <div key={`${p.id}-${idx}`} className="flex items-stretch gap-[14px]">
                    <CarouselCard p={p} accent={accent} fr={fr} />
                    {(isLastBoosted || isLastBoostedClone) && (
                      <div
                        aria-hidden
                        style={{
                          width: 1,
                          height: 200,
                          alignSelf: "center",
                          background: "linear-gradient(to bottom, transparent, #E5E7EB, transparent)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tf-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tf-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .tf-carousel-track { animation: none !important; }
        }
        @media (max-width: 768px) {
          .tf-card { width: 200px !important; }
        }
        @media (max-width: 480px) {
          .tf-card { width: 160px !important; }
        }
      `}</style>
    </section>
  );
}

function formatBoostRemaining(until: string, fr: boolean): string {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "";
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return fr ? `${days}j restant${days > 1 ? "s" : ""}` : `${days}d left`;
  if (hours >= 1) return fr ? `${hours}h restantes` : `${hours}h left`;
  return fr ? `${Math.max(1, mins)}min restantes` : `${Math.max(1, mins)}m left`;
}

function CarouselCard({ p, accent, fr }: { p: CarouselProperty; accent: string; fr: boolean }) {
  const boosted = !!(p.boosted_until && new Date(p.boosted_until) > new Date());
  const boostRemaining = boosted && p.boosted_until ? formatBoostRemaining(p.boosted_until, fr) : "";
  const title = (fr ? p.title_fr : p.title_en) || p.title;
  const photos = (p.images && p.images.length > 0 ? p.images : p.cover_url ? [p.cover_url] : []).filter(Boolean) as string[];
  const cover = photos[0];
  const typeMeta = TYPE_LABEL[p.type] ?? { fr: p.type, en: p.type, emoji: "📍" };
  const flag = COUNTRY_FLAG[p.country] ?? "🌍";
  const locationText = [p.city, p.country].filter(Boolean).join(", ");


  return (
    <div
      className="tf-card group relative bg-white flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: 240,
        borderRadius: 14,
        border: boosted ? "1.5px solid #EF9F27" : "1px solid #F1F2F4",
        boxShadow: boosted ? "0 4px 20px rgba(239,159,39,0.25)" : "0 2px 12px rgba(0,0,0,0.08)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = boosted ? "translateY(-6px)" : "translateY(-4px)";
        e.currentTarget.style.boxShadow = boosted
          ? "0 12px 32px rgba(239,159,39,0.35)"
          : "0 8px 24px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = boosted
          ? "0 4px 20px rgba(239,159,39,0.25)"
          : "0 2px 12px rgba(0,0,0,0.08)";
      }}
    >
      {boosted && (
        <div
          className="text-center text-white font-bold uppercase"
          style={{ background: "#EF9F27", fontSize: 9, padding: "3px 10px", letterSpacing: "0.05em" }}
        >
          ⚡ {fr ? "SPONSORISÉ" : "SPONSORED"}
        </div>
      )}

      <Link to="/property/$id" params={{ id: p.id }} className="block relative" style={{ height: 150 }}>
        {cover ? (
          <img src={cover} alt={title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5" />
            </svg>
          </div>
        )}

        {/* type badge top-left */}
        <span
          className="absolute top-0 left-0 text-white"
          style={{ background: "rgba(0,0,0,0.55)", fontSize: 10, padding: "3px 8px", borderRadius: "0 0 8px 0" }}
        >
          {typeMeta.emoji} {fr ? typeMeta.fr : typeMeta.en}
        </span>

        {/* AI score top-right */}
        {p.ai_score != null && p.ai_score > 0 && (
          <span
            className="absolute top-0 right-0 bg-white font-bold inline-flex items-center gap-0.5"
            style={{ color: aiScoreColor(p.ai_score), fontSize: 10, padding: "3px 8px", borderRadius: "0 0 0 8px" }}
          >
            <Star size={10} fill="currentColor" /> {p.ai_score}
          </span>
        )}

        {/* 360 badge bottom-left */}
        {p.has_360_tour && (
          <span className="absolute bottom-2 left-2 text-white font-bold" style={{ background: "#185FA5", fontSize: 9, padding: "2px 6px", borderRadius: 4 }}>
            360°
          </span>
        )}

        {/* boost remaining badge — top-right under AI score area, left side */}
        {boosted && boostRemaining && (
          <span
            className="absolute text-white font-bold inline-flex items-center gap-1"
            style={{
              top: 8,
              right: 8,
              background: "#EF9F27",
              fontSize: 9,
              padding: "3px 7px",
              borderRadius: 999,
              boxShadow: "0 2px 6px rgba(239,159,39,0.4)",
            }}
            title={fr ? "Mise en avant active" : "Boost active"}
          >
            ⏱ {boostRemaining}
          </span>
        )}


        {/* photo count bottom-right */}
        {photos.length > 1 && !boosted && (
          <span
            className="absolute bottom-2 right-2 text-white inline-flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.55)", fontSize: 9, padding: "2px 6px", borderRadius: 4 }}
          >
            <Camera size={10} /> {photos.length}
          </span>
        )}

        {/* boosted ribbon */}
        {boosted && (
          <div
            className="absolute bottom-0 left-0 right-0 text-white text-center font-medium"
            style={{
              fontSize: 10,
              padding: "4px 12px",
              background: "linear-gradient(to right, #EF9F27, #F59E0B, #EF9F27)",
              backgroundSize: "200% 100%",
              animation: "tf-shimmer 2s linear infinite",
            }}
          >
            🚀 {fr ? "Mis en avant · Featured" : "Featured · Mis en avant"}
          </div>
        )}
      </Link>

      <div className="flex-1 flex flex-col" style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 3 }}>
          {flag} {locationText}
        </div>
        <Link
          to="/property/$id"
          params={{ id: p.id }}
          className="font-medium line-clamp-2"
          style={{ fontSize: 12, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}
        >
          {title}
        </Link>

        {(p.bedrooms || p.bathrooms || p.surface_m2) && (
          <div className="flex items-center" style={{ gap: 8, fontSize: 10, color: "#6B7280", marginBottom: 6 }}>
            {p.bedrooms ? <span className="inline-flex items-center gap-0.5"><Bed size={11} /> {p.bedrooms}bd</span> : null}
            {p.bathrooms ? <span className="inline-flex items-center gap-0.5"><Bath size={11} /> {p.bathrooms}ba</span> : null}
            {p.surface_m2 ? <span className="inline-flex items-center gap-0.5"><Maximize2 size={11} /> {p.surface_m2}m²</span> : null}
          </div>
        )}

        <div className="font-medium" style={{ fontSize: 15, color: accent }}>
          {formatPrice(Number(p.price_usd))}
        </div>

        <div className="flex" style={{ gap: 6, marginTop: 8 }}>
          <Link
            to="/property/$id"
            params={{ id: p.id }}
            className="flex-1 text-white text-center font-medium"
            style={{ background: accent, fontSize: 11, padding: "6px", borderRadius: 8 }}
          >
            {fr ? "Voir →" : "View →"}
          </Link>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, border: "0.5px solid #E5E7EB", borderRadius: 8, background: "white" }}
          >
            <FavoriteButton propertyId={p.id} className="!w-6 !h-6 !shadow-none !bg-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
