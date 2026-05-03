import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { Globe2, TrendingUp, Sparkles, Coins, ArrowRight } from "lucide-react";

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
  const [props, setProps] = useState<Prop[]>([]);
  const [rates, setRates] = useState<FX[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("properties")
          .select("id, title, city, country, price_usd, cover_url, tf_verified, ai_score, boosted_until")
          .eq("status", "active")
          .eq("tf_verified", true)
          .order("boosted_until", { ascending: false, nullsFirst: false })
          .limit(12),
        supabase.from("currency_rates").select("code, symbol, rate, country").order("country"),
      ]);
      setProps((p ?? []) as Prop[]);
      setRates((r ?? []) as FX[]);
      setLoading(false);
    })();
  }, [enabled]);

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

      {/* FX rates */}
      {rates.length > 0 && (
        <section className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-xl font-display font-semibold mb-3">Taux de change (1 USD)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {rates.map((r) => (
              <div key={r.code} className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">{r.country}</div>
                <div className="font-display font-semibold mt-0.5">{Number(r.rate).toLocaleString()} {r.symbol}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{r.code}</div>
              </div>
            ))}
          </div>
        </section>
      )}

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
