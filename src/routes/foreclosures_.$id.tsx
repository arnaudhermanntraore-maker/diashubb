import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { typeBadge, daysUntil, type Foreclosure } from "@/lib/foreclosures";
import { AlertTriangle, Heart, Bell, Gavel, ArrowLeft, Mail, Loader2, Maximize2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthWall } from "@/components/AuthWall";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { toast } from "sonner";

export const Route = createFileRoute("/foreclosures_/$id")({
  head: () => ({
    meta: [
      { title: "Foreclosure detail — TerraFrique" },
      { name: "description", content: "Detailed view of a US foreclosure listing." },
    ],
  }),
  component: ForeclosureDetail,
});

function ForeclosureDetail() {
  const { id } = useParams({ from: "/foreclosures_/$id" });
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const enabled = useFeatureFlag("foreclosures");
  const { user } = useAuth();
  const [f, setF] = useState<Foreclosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [downPct, setDownPct] = useState(3.5);
  const [rate, setRate] = useState(7.2);
  const [term, setTerm] = useState(30);
  const [activePhoto, setActivePhoto] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("foreclosures").select("*").eq("id", id).single();
      setF(data as Foreclosure | null);
      setLoading(false);
    })();
  }, [id, enabled]);

  if (!enabled) return <FeatureDisabled featureKey="foreclosures" />;
  if (loading) return <div className="container mx-auto py-20 text-center text-gray-500">Loading…</div>;
  if (!f) return <div className="container mx-auto py-20 text-center">Not found</div>;

  const t = typeBadge(f.foreclosure_type);
  const auctionDays = daysUntil(f.auction_date);
  const savings = (f.estimated_market_value ?? 0) - (f.listing_price ?? 0);

  // mortgage calc
  const price = Number(f.listing_price ?? 0);
  const down = price * (downPct / 100);
  const principal = price - down;
  const monthly = principal > 0 ? (principal * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -term * 12)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Link to="/foreclosures" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> {fr ? "Retour" : "Back"}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">
            {/* Photos */}
            <div>
              <div className="aspect-[16/10] bg-gray-200 rounded-xl overflow-hidden relative group">
                {f.photos?.[activePhoto] && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute inset-0 w-full h-full"
                    aria-label="Open photo gallery"
                  >
                    <img src={f.photos[activePhoto]} alt={f.address} className="w-full h-full object-cover" />
                  </button>
                )}
                <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded text-white pointer-events-none" style={{ background: t.bg }}>
                  {t.emoji} {t.label}
                </span>
                <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded bg-black/60 text-white capitalize pointer-events-none">
                  {f.status}
                </span>
                {f.photos?.length > 0 && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> {fr ? `${f.photos.length} photos` : `${f.photos.length} photos`}
                  </button>
                )}
              </div>
              {f.photos?.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {f.photos.map((p, i) => (
                    <button key={i} onClick={() => { setActivePhoto(i); setLightboxOpen(true); }}
                      className={`shrink-0 w-20 h-16 rounded overflow-hidden border-2 ${i === activePhoto ? "border-red-600" : "border-transparent"}`}>
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">{f.address}</h1>
              <div className="text-gray-600 text-sm mt-1">{f.city}, {f.state} {f.zip_code}</div>
              <div className="text-gray-500 text-sm mt-2">
                {f.bedrooms ?? "?"} bed · {f.bathrooms ?? "?"} bath · {f.surface_sqft?.toLocaleString() ?? "?"} sqft · {fr ? "Construit en" : "Built"} {f.year_built ?? "?"}
              </div>
            </div>

            {/* Foreclosure alert */}
            <div className="rounded-lg p-4 border-l-4" style={{ background: "#FEF2F2", borderColor: "#DC2626", borderLeftColor: "#DC2626" }}>
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900">{fr ? "Important — Bien en saisie" : "Important — Foreclosure Property"}</div>
                  <ul className="mt-2 text-sm text-red-800 space-y-1 list-disc pl-4">
                    <li>{fr ? "Vendu en l'état — sans réparations par le vendeur" : "Sold AS-IS — no repairs by seller"}</li>
                    <li>{fr ? "Inspectez avant d'enchérir — prévoyez un budget travaux" : "Inspect before bidding — budget for repairs"}</li>
                    <li>{fr ? "Vérification du titre recommandée" : "Title search recommended"}</li>
                    <li>{fr ? "Cash ou financement pré-approuvé requis" : "Cash or pre-approved financing only"}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">{fr ? "Statut du processus de saisie" : "Foreclosure process status"}</h3>
              <div className="space-y-3">
                <TimelineStep n={1} label={fr ? "Défaut de paiement" : "Default"} date={f.default_date} done />
                <TimelineStep n={2} label={fr ? "Dépôt légal" : "Legal filing"} date={null} done={f.foreclosure_stage !== "notice_of_default"} />
                <TimelineStep n={3} label={fr ? "Enchère" : "Auction"} date={f.auction_date}
                  done={f.foreclosure_stage === "bank_owned"}
                  highlight={auctionDays !== null && auctionDays >= 0}
                  highlightLabel={auctionDays !== null && auctionDays >= 0 ? `🔨 ${fr ? `Dans ${auctionDays} jours` : `In ${auctionDays} days`}` : undefined} />
                <TimelineStep n={4} label={fr ? "Vente finale" : "Sale"} date={null} done={false} />
              </div>
            </div>

            {/* AI Renovation Estimate (placeholder) */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">✨ {fr ? "Estimation IA des travaux" : "AI Renovation Estimate"}</span>
              </div>
              {f.ai_renovation_estimate ? (
                <>
                  <div className="text-2xl font-bold text-amber-700 mt-2">${Number(f.ai_renovation_estimate).toLocaleString()}</div>
                  <p className="text-xs text-gray-600 mt-2">{fr ? "Basé sur l'âge, la taille et les données du marché." : "Based on age, size and market data."}</p>
                </>
              ) : (
                <div className="text-sm text-gray-700">
                  {fr ? "Estimation IA des coûts de rénovation bientôt disponible." : "AI renovation cost estimation coming soon."}
                </div>
              )}
            </div>

            {/* Financing calculator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">{fr ? "Puis-je me le permettre ?" : "Can I afford this?"}</h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label={fr ? "Apport %" : "Down %"} value={downPct} onChange={(v) => setDownPct(v)} step={0.5} min={0} />
                <Field label={fr ? "Taux %" : "Rate %"} value={rate} onChange={setRate} step={0.1} min={0} />
                <Field label={fr ? "Durée (an)" : "Term (yr)"} value={term} onChange={setTerm} step={5} min={5} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label={fr ? "Apport" : "Down payment"} value={`$${down.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Stat label={fr ? "Mensualité" : "Monthly payment"} value={`$${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} highlight />
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Price box */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-3xl font-bold" style={{ color: "#DC2626" }}>${Number(f.listing_price ?? 0).toLocaleString()}</div>
              {f.estimated_market_value && (
                <div className="text-sm text-gray-400 line-through mt-1">${Number(f.estimated_market_value).toLocaleString()} {fr ? "valeur de marché" : "market value"}</div>
              )}
              {savings > 0 && (
                <div className="mt-2 inline-block text-sm px-3 py-1 rounded-full" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
                  {fr ? "Économie" : "You save"} ${savings.toLocaleString()} (-{Math.round(f.discount_percent ?? 0)}%)
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {f.fha_eligible && <span className="text-[11px] px-2 py-1 rounded bg-green-100 text-green-800">FHA ✓</span>}
                {f.va_eligible && <span className="text-[11px] px-2 py-1 rounded bg-blue-100 text-blue-800">VA ✓</span>}
                {f.financing_available?.map((fin) => (
                  <span key={fin} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-700">{fin}</span>
                ))}
              </div>
            </div>

            {/* Auction info */}
            {f.foreclosure_type === "auction" && f.auction_date && (
              <div className="rounded-xl border border-red-200 p-5" style={{ background: "#FEF2F2" }}>
                <div className="flex items-center gap-2 font-semibold text-red-900 mb-2">
                  <Gavel className="w-4 h-4" /> {fr ? "Détails de l'enchère" : "Auction Details"}
                </div>
                <dl className="text-sm space-y-1 text-red-900">
                  <Row k={fr ? "Date" : "Date"} v={new Date(f.auction_date).toLocaleDateString(fr ? "fr-FR" : "en-US", { dateStyle: "long" })} />
                  {f.opening_bid && <Row k={fr ? "Mise de départ" : "Opening bid"} v={`$${Number(f.opening_bid).toLocaleString()}`} />}
                  <Row k={fr ? "Acompte requis" : "Deposit required"} v="10%" />
                  <Row k={fr ? "Paiement" : "Payment"} v={fr ? "Cash sous 30 jours" : "Cash within 30 days"} />
                </dl>
              </div>
            )}

            {/* Lender */}
            {f.lender_name && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm">
                <div className="text-gray-500 text-xs">{fr ? "Prêteur" : "Lender"}</div>
                <div className="font-semibold text-gray-900 mt-1">🏦 {f.lender_name}</div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
              <button
                onClick={() => (user ? setContactOpen(true) : setAuthOpen(true))}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white"
                style={{ background: "#DC2626" }}
              >
                <Mail className="w-4 h-4" /> {fr ? "Demander contact" : "Request contact"}
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                <Heart className="w-4 h-4" /> {fr ? "Sauvegarder" : "Save this property"}
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                <Bell className="w-4 h-4" /> {fr ? "Alerte baisse de prix" : "Alert me on price drop"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthWall open={authOpen} onOpenChange={setAuthOpen} titleKey="contact" />

      {contactOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !sending && setContactOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{fr ? "Demander contact" : "Request contact"}</h3>
            <p className="text-sm text-gray-600 mt-1">{f.address}, {f.city}, {f.state}</p>
            <textarea
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              rows={5}
              placeholder={fr ? "Bonjour, je suis intéressé(e) par cette saisie. Pouvez-vous me contacter ?" : "Hello, I'm interested in this foreclosure. Please contact me."}
              className="w-full mt-3 p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-500"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setContactOpen(false)}
                disabled={sending}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {fr ? "Annuler" : "Cancel"}
              </button>
              <button
                disabled={sending || !contactMsg.trim()}
                onClick={async () => {
                  if (!user) return;
                  setSending(true);
                  try {
                    const message = contactMsg.trim() || (fr ? "Intéressé par cette saisie." : "Interested in this foreclosure.");
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error } = await (supabase as any).from("audit_logs").insert({
                      user_id: user.id,
                      action: "foreclosure_contact_request",
                      metadata: { foreclosure_id: f.id, address: f.address, city: f.city, state: f.state, message },
                    });
                    if (error) throw error;
                    toast.success(fr ? "Demande envoyée. Un spécialiste vous contactera." : "Request sent. A specialist will reach out.");
                    setContactOpen(false);
                    setContactMsg("");
                  } catch (e) {
                    toast.error(fr ? "Erreur d'envoi" : "Failed to send");
                  } finally {
                    setSending(false);
                  }
                }}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white inline-flex items-center gap-2 disabled:opacity-50"
                style={{ background: "#DC2626" }}
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {fr ? "Envoyer" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({ n, label, date, done, highlight, highlightLabel }: { n: number; label: string; date: string | null; done: boolean; highlight?: boolean; highlightLabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-gray-300 text-gray-700" : highlight ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"}`}>{n}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {date && <div className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</div>}
      </div>
      {highlightLabel && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">{highlightLabel}</span>}
    </div>
  );
}

function Field({ label, value, onChange, step, min }: { label: string; value: number; onChange: (v: number) => void; step: number; min: number }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input type="number" step={step} min={min} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full px-2 py-1.5 bg-gray-100 rounded text-sm outline-none" />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-red-50" : "bg-gray-50"}`}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${highlight ? "text-red-700" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt>{k}</dt><dd className="font-semibold">{v}</dd></div>;
}
