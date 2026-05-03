import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ShieldCheck, Globe2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraFrique Global — Verified African real estate" },
      { name: "description", content: "Verified real estate listings across the US and Africa. Browse land, houses, commercial property with secure escrow payments." },
      { property: "og:title", content: "TerraFrique Global" },
      { property: "og:description", content: "Bi-continental real estate, verified and borderless." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    supabase.from("properties").select("id,title,country,city,price_usd,type,cover_url,ai_score,tf_verified").eq("status", "active").order("boosted_until", { ascending: false, nullsFirst: false }).limit(8).then(({ data }) => {
      setItems((data ?? []) as Property[]);
    });
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36 max-w-6xl">
          <span className="inline-block text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-4">{t("hero.kicker")}</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-background max-w-3xl leading-[1.05]">{t("hero.title")}</h1>
          <p className="mt-6 text-lg text-background/85 max-w-2xl">{t("hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/listings" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-elegant">
              {t("hero.cta")} <ArrowRight size={18} />
            </Link>
            <Link to="/agents" className="inline-flex items-center gap-2 bg-background/10 backdrop-blur text-background border border-background/30 px-6 py-3 rounded-full font-medium hover:bg-background/20 transition-colors">
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
          {[
            { icon: ShieldCheck, title: t("property.verified"), text: "Title-deed verification by certified surveyors." },
            { icon: Globe2, title: "USA ↔ Afrique", text: "Cross-border escrow with Stripe & CinetPay." },
            { icon: Sparkles, title: t("property.aiScore"), text: "AI scoring on every listing — quality at a glance." },
          ].map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><f.icon size={20} /></div>
              <div><h3 className="font-display font-semibold">{f.title}</h3><p className="text-sm text-muted-foreground mt-1">{f.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* LISTINGS */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-display font-bold">Featured properties</h2>
          <Link to="/listings" className="text-sm text-primary font-medium inline-flex items-center gap-1">{t("hero.cta")} <ArrowRight size={16} /></Link>
        </div>
        {items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
