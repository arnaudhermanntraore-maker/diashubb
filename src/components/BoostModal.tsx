import { useEffect, useMemo, useState } from "react";
import { Rocket, X, MapPin, Map, Globe, Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createBoostCheckout } from "@/server/boosts.functions";

type ItemType = "property" | "contractor" | "broker";
type Plan = "day" | "week" | "month" | "quarter";
type Audience = "local" | "national" | "diaspora";

const PLANS: { id: Plan; label: string; price: number; banner?: string; bannerColor?: string; features: string[] }[] = [
  { id: "day", label: "1 jour", price: 4, features: ["Badge « Mis en avant » 24h", "Priorité dans les résultats", "+50% de visibilité estimée"] },
  { id: "week", label: "7 jours", price: 25, banner: "LE PLUS POPULAIRE", bannerColor: "var(--tf-green)", features: ["Badge « Mis en avant » 7 jours", "Priorité résultats + carte", "+150% de visibilité estimée", "Notification aux membres alertes"] },
  { id: "month", label: "30 jours", price: 80, features: ["Badge « Mis en avant » 30 jours", "Top résultats garanti", "+300% de visibilité estimée", "Email aux acheteurs matchés", "Stats détaillées quotidiennes"] },
  { id: "quarter", label: "90 jours", price: 180, banner: "MEILLEUR ROI", bannerColor: "var(--tf-amber)", features: ["Badge premium 90 jours", "Position #1 garantie", "+500% de visibilité estimée", "Email + push notifications", "Stats temps réel", "Account manager dédié"] },
];

const AUDIENCES: { id: Audience; icon: typeof MapPin; title: string; sub: string; badge: string; recommended?: boolean }[] = [
  { id: "local", icon: MapPin, title: "Audience locale", sub: "Acheteurs dans votre ville", badge: "Inclus" },
  { id: "national", icon: Map, title: "Audience nationale", sub: "Acheteurs dans le pays", badge: "+30% de portée" },
  { id: "diaspora", icon: Globe, title: "Diaspora africaine USA", sub: "44M acheteurs potentiels", badge: "⭐ Recommandé", recommended: true },
];

export function BoostModal({
  open, onClose, itemType, itemId, itemTitle, itemPrice, itemThumb,
}: {
  open: boolean; onClose: () => void;
  itemType: ItemType; itemId: string; itemTitle: string;
  itemPrice?: number | null; itemThumb?: string | null;
}) {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr") ?? true;
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience>("diaspora");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [terracoins, setTerracoins] = useState(0);
  const [useTC, setUseTC] = useState(false);
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const startCheckout = useServerFn(createBoostCheckout);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("profiles").select("terracoins").eq("id", user.id).maybeSingle()
      .then(({ data }) => setTerracoins(data?.terracoins ?? 0));
  }, [open, user]);

  const planCfg = useMemo(() => PLANS.find((p) => p.id === plan) ?? null, [plan]);
  const tcDiscount = useMemo(() => {
    if (!planCfg || !useTC) return 0;
    return Math.min(terracoins / 100, planCfg.price); // 100 TC = $1
  }, [planCfg, useTC, terracoins]);
  const total = useMemo(() => Math.max(0, (planCfg?.price ?? 0) - tcDiscount), [planCfg, tcDiscount]);

  if (!open) return null;

  const submit = async () => {
    if (!planCfg) return toast.error(fr ? "Choisissez une durée" : "Pick a duration");
    if (!accept) return toast.error(fr ? "Acceptez les conditions" : "Accept terms");
    setLoading(true);
    try {
      const origin = window.location.origin;
      const r = await startCheckout({ data: {
        itemType, itemId, plan: planCfg.id, audience,
        successUrl: `${origin}/dashboard?boost=ok`,
        cancelUrl: `${origin}/dashboard?boost=cancel`,
      }});
      if (r.url) window.location.href = r.url;
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-elegant">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between text-white" style={{ background: "var(--tf-navy)" }}>
          <div>
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Rocket size={20} /> {fr ? "Boostez votre annonce" : "Boost your listing"}
            </h2>
            <p className="text-xs text-white/80 mt-1">{fr ? "Atteignez plus d'acheteurs de la diaspora africaine" : "Reach more African diaspora buyers"}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="flex gap-3 items-center bg-muted rounded-xl p-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-card shrink-0">
              {itemThumb ? <img src={itemThumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No img</div>}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{itemTitle}</div>
              {itemPrice != null && <div className="text-tf-blue font-display font-bold">${Number(itemPrice).toLocaleString()}</div>}
            </div>
          </div>

          {/* Audience */}
          <div>
            <h3 className="font-display font-semibold mb-3">{fr ? "Qui souhaitez-vous cibler ?" : "Who do you want to target?"}</h3>
            <div className="grid sm:grid-cols-3 gap-2">
              {AUDIENCES.map((a) => {
                const Icon = a.icon;
                const selected = audience === a.id;
                return (
                  <button key={a.id} onClick={() => setAudience(a.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${selected ? "border-tf-green bg-tf-green/5" : "border-border hover:border-muted-foreground/40"}`}>
                    <Icon size={18} className="mb-1.5" style={{ color: selected ? "var(--tf-green)" : "var(--muted-foreground)" }} />
                    <div className="font-semibold text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.sub}</div>
                    <div className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${a.recommended ? "bg-tf-green text-white" : "bg-muted"}`}>{a.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plans */}
          <div>
            <h3 className="font-display font-semibold mb-3">{fr ? "Choisissez la durée" : "Pick duration"}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {PLANS.map((p) => {
                const selected = plan === p.id;
                return (
                  <div key={p.id} className={`relative rounded-xl border-2 p-4 transition-all ${selected ? "border-tf-amber" : "border-border"}`}>
                    {p.banner && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: p.bannerColor }}>
                        {p.banner}
                      </div>
                    )}
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{p.label}</div>
                    <div className="text-3xl font-display font-bold mt-1">${p.price}</div>
                    <ul className="mt-3 space-y-1.5 text-xs">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex gap-1.5"><Check size={12} className="text-tf-green mt-0.5 shrink-0" />{f}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setPlan(p.id)}
                      className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${selected ? "text-white" : "border border-border hover:bg-muted"}`}
                      style={selected ? { background: "var(--tf-amber)" } : {}}
                    >
                      {selected ? (fr ? "Sélectionné" : "Selected") : (fr ? "Choisir" : "Choose")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary + payment */}
          {planCfg && (
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>{fr ? "Annonce" : "Listing"}</span><span className="font-medium truncate ml-2 max-w-[60%]">{itemTitle}</span></div>
              <div className="flex justify-between"><span>{fr ? "Plan" : "Plan"}</span><span className="font-medium">{planCfg.label}</span></div>
              <div className="flex justify-between"><span>{fr ? "Audience" : "Audience"}</span><span className="font-medium capitalize">{audience}</span></div>
              <div className="flex justify-between"><span>{fr ? "Sous-total" : "Subtotal"}</span><span>${planCfg.price}</span></div>
              <label className="flex items-center justify-between gap-2 pt-2 border-t border-border cursor-pointer">
                <span className="inline-flex items-center gap-1.5"><Sparkles size={14} className="text-tf-amber" /> {fr ? `Utiliser mes TerraCoins (${terracoins} pts)` : `Use my TerraCoins (${terracoins} pts)`}</span>
                <input type="checkbox" checked={useTC} onChange={(e) => setUseTC(e.target.checked)} disabled={terracoins < 100} className="accent-primary" />
              </label>
              {tcDiscount > 0 && <div className="flex justify-between text-tf-green text-xs">- ${tcDiscount.toFixed(2)} TerraCoins</div>}
              <div className="flex justify-between pt-2 border-t border-border font-display font-bold text-base">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>

              <label className="flex items-start gap-2 pt-3 text-xs cursor-pointer">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="accent-primary mt-0.5" />
                <span>{fr ? "J'accepte les conditions de boost TerraFrique" : "I accept TerraFrique boost terms"}</span>
              </label>

              <button
                onClick={submit}
                disabled={loading || !accept}
                className="mt-3 w-full py-3 rounded-xl text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--tf-green)" }}
              >
                <Rocket size={16} />
                {loading ? (fr ? "Paiement en cours..." : "Processing...") : (fr ? `Activer le boost — $${total.toFixed(2)}` : `Activate boost — $${total.toFixed(2)}`)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BoostButton({
  itemType, itemId, itemTitle, itemPrice, itemThumb, className,
}: {
  itemType: ItemType; itemId: string; itemTitle: string;
  itemPrice?: number | null; itemThumb?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr") ?? true;
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:scale-[1.02] ${className ?? ""}`}
        style={{ background: "linear-gradient(135deg, #EF9F27, #F59E0B)" }}
      >
        <Rocket size={14} /> {fr ? "Booster" : "Boost"}
      </button>
      <BoostModal
        open={open} onClose={() => setOpen(false)}
        itemType={itemType} itemId={itemId} itemTitle={itemTitle}
        itemPrice={itemPrice} itemThumb={itemThumb}
      />
    </>
  );
}
