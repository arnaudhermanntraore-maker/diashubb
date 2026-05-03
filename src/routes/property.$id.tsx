import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, MapPin, MessageSquare, Compass, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createDepositCheckout } from "@/server/payments.functions";
import { MapView } from "@/components/MapView";

export const Route = createFileRoute("/property/$id")({
  component: PropertyDetail,
});

interface FullProperty {
  id: string; title: string; description: string | null;
  country: string; city: string | null; price_usd: number;
  type: string; cover_url: string | null; tour_360_url: string | null;
  ai_score: number | null; tf_verified: boolean; agent_id: string;
  lat: number | null; lng: number | null;
}

function PropertyDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<FullProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const startCheckout = useServerFn(createDepositCheckout);

  useEffect(() => {
    supabase.from("properties").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data as FullProperty | null); setLoading(false);
    });
  }, [id]);

  const contact = async () => {
    if (!user) { toast(t("auth.signIn") + " required"); navigate({ to: "/auth" }); return; }
    if (!p) return;
    // Simple AES-like obfuscation placeholder; real AES would be done server-side or via WebCrypto.
    const content = btoa(unescape(encodeURIComponent(`Hi, I'm interested in "${p.title}".`)));
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: p.agent_id, property_id: p.id, content_encrypted: content });
    if (error) toast.error(error.message); else { toast.success("Message sent"); navigate({ to: "/messages" }); }
  };

  const payDeposit = async () => {
    if (!user) { toast(t("auth.signIn") + " required"); navigate({ to: "/auth" }); return; }
    if (!p) return;
    setPaying(true);
    try {
      const deposit = Math.max(50, Math.round(Number(p.price_usd) * 0.05)); // 5% deposit
      const origin = window.location.origin;
      const r = await startCheckout({ data: {
        propertyId: p.id, amountUsd: deposit,
        successUrl: `${origin}/dashboard?deposit=ok`,
        cancelUrl: `${origin}/property/${p.id}?deposit=cancel`,
      }});
      if (r.url) window.location.href = r.url;
    } catch (e) { toast.error((e as Error).message); }
    finally { setPaying(false); }
  };

  if (loading) return <div className="container mx-auto px-4 py-10 max-w-5xl"><div className="h-96 bg-muted rounded-2xl animate-pulse" /></div>;
  if (!p) return <div className="container mx-auto px-4 py-20 text-center"><p>Property not found.</p><Link to="/listings" className="text-primary">Back to listings</Link></div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Link to="/listings" className="text-sm text-muted-foreground hover:text-foreground">← {t("nav.listings")}</Link>
      <div className="mt-4 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="aspect-[16/10] bg-muted rounded-2xl overflow-hidden">
            {p.cover_url ? <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-earth" />}
          </div>
          {p.tour_360_url && (
            <a href={p.tour_360_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary"><Compass size={16} /> {t("property.tour")}</a>
          )}
          <h1 className="mt-6 text-3xl font-display font-bold">{p.title}</h1>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin size={14} />{p.city ? `${p.city}, ` : ""}{p.country}</p>
          <p className="mt-6 text-foreground/85 leading-relaxed whitespace-pre-line">{p.description || "No description provided."}</p>
          {p.lat != null && p.lng != null && (
            <div className="mt-6">
              <MapView height="320px" markers={[{ id: p.id, lat: p.lat, lng: p.lng, title: p.title, price_usd: Number(p.price_usd) }]} />
            </div>
          )}
        </div>
        <aside className="md:col-span-1 space-y-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="text-3xl font-display font-bold text-primary">${Number(p.price_usd).toLocaleString()}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tf_verified && <span className="inline-flex items-center gap-1 bg-success/15 text-success text-xs px-2 py-1 rounded-full font-medium"><ShieldCheck size={12} />{t("property.verified")}</span>}
              {p.ai_score != null && <span className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground text-xs px-2 py-1 rounded-full font-medium"><Sparkles size={12} />{t("property.aiScore")} {p.ai_score}</span>}
              <span className="inline-flex items-center bg-muted text-xs px-2 py-1 rounded-full font-medium uppercase">{p.type}</span>
            </div>
            <button onClick={contact} className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full py-3 font-medium hover:bg-primary/90 transition-colors">
              <MessageSquare size={16} /> {t("property.contact")}
            </button>
            <button onClick={payDeposit} disabled={paying} className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-success text-success-foreground rounded-full py-3 font-medium hover:opacity-90 transition disabled:opacity-50">
              <Lock size={16} /> {paying ? "…" : `Pay 5% deposit ($${Math.max(50, Math.round(Number(p.price_usd) * 0.05)).toLocaleString()})`}
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">Held in escrow · released by TerraFrique on title transfer</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
