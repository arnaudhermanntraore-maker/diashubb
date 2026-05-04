import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { ForeclosureCard } from "@/components/ForeclosureCard";
import type { Foreclosure } from "@/lib/foreclosures";
import { Globe2, TrendingUp, Sparkles, Coins, ArrowRight, Gavel } from "lucide-react";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { LiveRateCards } from "@/components/LiveRateCards";
import { CURRENCIES } from "@/lib/currencies";

interface Prop {
  id: string;
  title: string;
  city: string | null;
  country: string;
  price_usd: number;
  cover_url: string | null;
  tf_verified: boolean;
  ai_score: number | null;
  boosted_until: string | null;
}
interface FX { code: string; symbol: string; rate: number; country: string; }

export const Route = createFileRoute("/diaspora")({
  head: () => ({
    meta: [
      { title: "Portail Diaspora — TerraFrique" },
      { name: "description", content: "Investissez dans l'immobilier africain depuis l'étranger en toute sécurité." },
    ],
  }),
  component: DiasporaPage,
});

function DiasporaPage() {
  const enabled = useFeatureFlag("diaspora_portal");
  const foreclosuresEnabled = useFeatureFlag("foreclosures");
  const [props, setProps] = useState<Prop[]>([]);
  const [rates, setRates] = useState<FX[]>([]);
  const [foreclosures, setForeclosures] = useState<Foreclosure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const [{ data: p }, { data: r }, { data: f }] = await Promise.all([
        supabase.from("properties")
          .select("id, title, city, country, price_usd, cover_url, tf_verified, ai_score, boosted_until")
          .eq("status", "active")
          .eq("tf_verified", true)
          .order("boosted_until", { ascending: false, nullsFirst: false })
          .limit(12),
        supabase.from("currency_rates").select("code, symbol, rate, country").order("country"),
        foreclosuresEnabled
          ? supabase.from("foreclosures").select("*").eq("status", "active").order("discount_percent", { ascending: false, nullsFirst: false }).limit(6)
          : Promise.resolve({ data: [] as any }),
      ]);
      setProps((p ?? []) as Prop[]);
      setRates((r ?? []) as FX[]);
      setForeclosures((f ?? []) as Foreclosure[]);
      setLoading(false);
    })();
  }, [enabled, foreclosuresEnabled]);

  if (!enabled) return <FeatureDisabled featureKey="diaspora_portal" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-3">
            <Globe2 className="w-4 h-4" /> Diaspora · Investissement à distance
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight max-w-2xl">
            Investissez chez vous, depuis l'étranger
          </h1>
          <p className="mt-4 text-lg opacity-90 max-w-xl">
            Annonces vérifiées TF, paiements en escrow, tour 360° et certificats PDF. Tout ce qu'il faut pour acheter en toute confiance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/listings" className="bg-background text-foreground rounded-full px-6 py-3 font-medium inline-flex items-center gap-2">
              Voir les biens vérifiés <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/safety" className="bg-primary-foreground/10 backdrop-blur rounded-full px-6 py-3 font-medium border border-primary-foreground/20">
              Comment ça marche
            </Link>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="container mx-auto px-4 py-12 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <Pillar icon={Sparkles} title="Vérification TF" text="Documents fonciers contrôlés par notre équipe et notre IA." />
        <Pillar icon={Coins} title="Escrow USD" text="Vos fonds sont bloqués chez Stripe jusqu'à la livraison du titre." />
        <Pillar icon={TrendingUp} title="Boost diaspora" text="Annonces priorisées pour acheteurs internationaux." />
      </section>

      {/* Currency converter */}
      <section className="container mx-auto px-4 max-w-6xl">
        <ConverterBlock />
      </section>

      {/* Verified listings */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold">Biens vérifiés pour la diaspora</h2>
          <Link to="/listings" className="text-sm text-primary hover:underline">Voir tout →</Link>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Chargement…</div>
        ) : props.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Aucun bien vérifié pour le moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {props.map((p) => {
              const boosted = p.boosted_until && new Date(p.boosted_until) > new Date();
              return (
                <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition group">
                  <div className="aspect-[4/3] bg-muted relative">
                    {p.cover_url ? (
                      <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : null}
                    {boosted && (
                      <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase">Boost</span>
                    )}
                    <span className="absolute top-2 right-2 bg-success text-success-foreground text-[10px] font-bold px-2 py-1 rounded-full">TF VERIFIED</span>
                  </div>
                  <div className="p-4">
                    <div className="font-display font-semibold truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.city ?? "—"}, {p.country}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">${Number(p.price_usd).toLocaleString()}</div>
                      {p.ai_score !== null && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-muted">IA {p.ai_score}/100</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* US Foreclosures */}
      {foreclosuresEnabled && foreclosures.length > 0 && (
        <section className="bg-gradient-to-br from-red-50 to-orange-50 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-700 mb-1">
                  <Gavel className="w-4 h-4" /> Opportunités USA
                </div>
                <h2 className="text-2xl font-display font-bold">Saisies immobilières — jusqu'à -50% du marché</h2>
                <p className="text-sm text-muted-foreground mt-1">HUD Homes, Bank REO et enchères. Financement FHA disponible pour la diaspora.</p>
              </div>
              <Link to="/foreclosures" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                Voir toutes les saisies <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foreclosures.map((f) => <ForeclosureCard key={f.id} f={f} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Pillar({ icon: Icon, title, text }: { icon: typeof Globe2; title: string; text: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="mt-3 font-display font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{text}</p>
    </div>
  );
}
