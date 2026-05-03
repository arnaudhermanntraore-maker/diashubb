import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Check, ChevronLeft, ChevronRight, Home, MapPin, Image as ImageIcon, FileText, DollarSign, Trash2, Plus, Minus, Star } from "lucide-react";

export const Route = createFileRoute("/listings_/new")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Publier un bien — TerraFrique" }] }),
  component: NewListing,
});

type PropertyType = "land" | "house" | "apartment" | "commercial" | "farm";
type Continent = "usa" | "africa";

const STORAGE_KEY = "tf_new_listing_draft_v1";

const AFRICA_COUNTRIES = [
  ["CI", "Côte d'Ivoire"], ["SN", "Sénégal"], ["GH", "Ghana"], ["NG", "Nigeria"],
  ["MA", "Maroc"], ["CM", "Cameroun"], ["KE", "Kenya"], ["RW", "Rwanda"],
  ["ML", "Mali"], ["BF", "Burkina Faso"], ["TG", "Togo"], ["BJ", "Bénin"],
  ["GA", "Gabon"], ["CG", "Congo"], ["DZ", "Algérie"], ["TN", "Tunisie"],
  ["MR", "Mauritanie"], ["MU", "Mauritius"],
] as const;

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"] as const;

interface FormData {
  titleFr: string; titleEn: string;
  descFr: string; descEn: string;
  type: PropertyType;
  txType: "sale" | "rent";
  continent: Continent;
  surface: string; surfaceUnit: "m2" | "sqft";
  bedrooms: number; bathrooms: number;
  country: string; state: string; city: string; zip: string;
  neighborhood: string; address: string;
  lat: string; lng: string;
  cover_url: string;
  images: string[];
  tour360: string;
  videoUrl: string;
  titleDeedUrl: string;
  cadastralUrl: string;
  buildingPermitUrl: string;
  mlsNumber: string;
  priceUsd: string;
  negotiable: boolean;
  boost: "basic" | "day" | "week" | "month";
}

const DEFAULTS: FormData = {
  titleFr: "", titleEn: "", descFr: "", descEn: "",
  type: "house", txType: "sale", continent: "africa",
  surface: "", surfaceUnit: "m2", bedrooms: 0, bathrooms: 0,
  country: "", state: "", city: "", zip: "", neighborhood: "", address: "",
  lat: "", lng: "", cover_url: "", images: [], tour360: "", videoUrl: "",
  titleDeedUrl: "", cadastralUrl: "", buildingPermitUrl: "", mlsNumber: "",
  priceUsd: "", negotiable: false, boost: "basic",
};

const FX: Record<string, { code: string; rate: number }> = {
  CI: { code: "FCFA", rate: 615 }, SN: { code: "FCFA", rate: 615 }, ML: { code: "FCFA", rate: 615 },
  BF: { code: "FCFA", rate: 615 }, TG: { code: "FCFA", rate: 615 }, BJ: { code: "FCFA", rate: 615 },
  CM: { code: "FCFA", rate: 615 }, GA: { code: "FCFA", rate: 615 }, CG: { code: "FCFA", rate: 615 },
  GH: { code: "GHS", rate: 15 }, NG: { code: "NGN", rate: 1600 }, KE: { code: "KES", rate: 130 },
  RW: { code: "RWF", rate: 1350 }, MA: { code: "MAD", rate: 10 }, DZ: { code: "DZD", rate: 135 },
  TN: { code: "TND", rate: 3.1 }, MR: { code: "MRU", rate: 40 }, MU: { code: "MUR", rate: 46 },
};

function NewListing() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const canPublish = roles.includes("agent") || roles.includes("admin") || roles.includes("super_admin");

  // Hydrate draft
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) try { setData({ ...DEFAULTS, ...JSON.parse(raw) }); } catch { /* noop */ }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const u = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((d) => ({ ...d, [k]: v }));

  const errors = useMemo(() => validateStep(step, data), [step, data]);
  const allErrors = useMemo(() => ({ ...validateStep(1, data), ...validateStep(2, data), ...validateStep(3, data) }), [data]);
  const canSubmit = Object.keys(allErrors).length === 0;

  const next = () => { if (Object.keys(errors).length === 0) setStep((s) => Math.min(3, s + 1)); else toast.error(fr ? "Corrigez les champs en rouge" : "Fix the highlighted fields"); };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    if (!user || !canSubmit) return;
    setBusy(true);
    const ref = `ANN-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
    const docs: Record<string, string> = {};
    if (data.titleDeedUrl) docs.title_deed = data.titleDeedUrl;
    if (data.cadastralUrl) docs.cadastral = data.cadastralUrl;
    if (data.buildingPermitUrl) docs.building_permit = data.buildingPermitUrl;
    if (data.mlsNumber) docs.mls = data.mlsNumber;
    const { error } = await supabase.from("properties").insert({
      agent_id: user.id,
      title: data.titleFr || data.titleEn,
      description: [data.descFr, data.descEn].filter(Boolean).join("\n\n---\n\n"),
      type: data.type,
      price_usd: Number(data.priceUsd),
      country: data.continent === "usa" ? "US" : data.country,
      city: data.city,
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
      cover_url: data.cover_url || data.images[0] || null,
      images: data.images,
      tour_360_url: data.tour360 || null,
      documents: docs,
      status: "draft",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    setDone({ ref });
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">…</div>;

  if (!canPublish) {
    return <PublishEligibilityGate fr={fr} userId={user?.id} userEmail={user?.email ?? null} emailConfirmed={!!user?.email_confirmed_at} roles={roles} />;
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "color-mix(in oklab, var(--tf-green) 15%, transparent)" }}>
          <Check size={40} style={{ color: "var(--tf-green)" }} />
        </div>
        <h1 className="font-display text-2xl font-bold">{fr ? "Annonce soumise pour modération" : "Listing submitted for review"}</h1>
        <p className="mt-2 text-muted-foreground">{fr ? "Votre annonce sera en ligne sous 24h après vérification." : "Your listing will go live within 24h after review."}</p>
        <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-muted text-sm font-mono">{done.ref}</div>
        <div className="mt-3 text-sm" style={{ color: "var(--tf-green)" }}>+50 TerraCoins {fr ? "crédités" : "credited"}</div>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/dashboard" className="px-5 py-2.5 rounded-full text-white" style={{ background: "var(--tf-blue)" }}>{fr ? "Voir mes annonces" : "View my listings"}</Link>
          <button onClick={() => { setData(DEFAULTS); setStep(1); setDone(null); }} className="px-5 py-2.5 rounded-full border border-border">{fr ? "Publier un autre bien" : "Publish another"}</button>
        </div>
      </div>
    );
  }

  const STEPS = [
    { n: 1, icon: Home, t: fr ? "Bien & localisation" : "Property & location" },
    { n: 2, icon: ImageIcon, t: fr ? "Photos & documents" : "Photos & documents" },
    { n: 3, icon: DollarSign, t: fr ? "Prix & publication" : "Price & publish" },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-muted/30">
      {/* Left panel */}
      <aside className="w-full md:w-[220px] shrink-0 md:min-h-[calc(100vh-8rem)] text-white p-5" style={{ background: "var(--tf-navy-deep)" }}>
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--tf-blue)" }}><Home size={16} /></div>
          <span className="font-display font-bold">TerraFrique</span>
        </Link>
        <ol className="space-y-1">
          {STEPS.map((s) => {
            const active = s.n === step;
            const completed = s.n < step;
            return (
              <li key={s.n}>
                <button
                  onClick={() => completed && setStep(s.n)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-white text-tf-navy font-semibold" : "text-white/70 hover:bg-white/10"}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${active ? "bg-tf-blue text-white" : completed ? "bg-tf-green text-white" : "bg-white/10"}`}>
                    {completed ? <Check size={12} /> : s.n}
                  </span>
                  <span>{s.t}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Right panel */}
      <section className="flex-1 p-5 md:p-10 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{fr ? `Étape ${step} sur 3` : `Step ${step} of 3`}</div>
          <h1 className="font-display text-2xl font-bold">{STEPS[step - 1].t}</h1>

          <div className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
            {step === 1 && (
              <>
                <Step1 data={data} u={u} errors={errors} fr={fr} />
                <div className="pt-4 border-t border-border">
                  <h3 className="font-display font-bold text-base mb-3">{fr ? "Localisation" : "Location"}</h3>
                  <Step2 data={data} u={u} errors={errors} fr={fr} />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Step3 data={data} u={u} errors={errors} fr={fr} />
                <div className="pt-4 border-t border-border">
                  <h3 className="font-display font-bold text-base mb-3">{fr ? "Documents" : "Documents"}</h3>
                  <Step4 data={data} u={u} errors={errors} fr={fr} />
                </div>
              </>
            )}
            {step === 3 && <Step5 data={data} u={u} errors={allErrors} fr={fr} />}
          </div>

          <div className="flex justify-between mt-6 gap-3">
            <button onClick={back} disabled={step === 1} className="px-5 py-2.5 rounded-full border border-border disabled:opacity-40 inline-flex items-center gap-1">
              <ChevronLeft size={16} /> {fr ? "Retour" : "Back"}
            </button>
            {step < 3 ? (
              <button onClick={next} className="px-6 py-2.5 rounded-full text-white font-semibold inline-flex items-center gap-1" style={{ background: "var(--tf-blue)" }}>
                {fr ? "Continuer" : "Continue"} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canSubmit || busy}
                className="px-6 py-2.5 rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: canSubmit ? "var(--tf-green)" : "#9ca3af" }}
              >
                {busy ? (fr ? "Publication…" : "Publishing…") : (fr ? "Publier mon annonce" : "Publish my listing")}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function validateStep(step: number, d: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!d.titleFr.trim() && !d.titleEn.trim()) e.title = "Titre requis";
    if (!d.surface || Number(d.surface) <= 0) e.surface = "Surface requise";
  }
  if (step === 2) {
    if (d.continent === "usa") {
      if (!d.state) e.state = "État requis";
    } else if (!d.country) e.country = "Pays requis";
    if (!d.city.trim()) e.city = "Ville requise";
  }
  if (step === 3) {
    if (d.images.filter(Boolean).length < 3) e.images = "Minimum 3 photos";
  }
  if (step === 4) {
    if (d.continent === "africa" && !d.titleDeedUrl) e.titleDeed = "Titre foncier requis";
  }
  if (step === 5) {
    if (!d.priceUsd || Number(d.priceUsd) <= 0) e.price = "Prix requis";
  }
  return e;
}

const TYPE_OPTIONS: { v: PropertyType; fr: string; en: string; emoji: string }[] = [
  { v: "land", fr: "Terrain", en: "Plot", emoji: "🌱" },
  { v: "house", fr: "Maison", en: "House", emoji: "🏠" },
  { v: "house" as PropertyType, fr: "Villa", en: "Villa", emoji: "🏡" },
  { v: "apartment", fr: "Appartement", en: "Apartment", emoji: "🏢" },
  { v: "commercial", fr: "Commercial", en: "Commercial", emoji: "🏪" },
  { v: "farm", fr: "Agricole", en: "Farm", emoji: "🌾" },
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "var(--tf-red)" }}>{error}</p>}
    </div>
  );
}

interface StepProps {
  data: FormData;
  u: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  errors: Record<string, string>;
  fr: boolean;
}

function Step1({ data, u, errors, fr }: StepProps) {
  const [tab, setTab] = useState<"fr" | "en">("fr");
  return (
    <>
      <Field label={fr ? "Titre de l'annonce" : "Property title"} error={errors.title}>
        <div className="flex gap-1 mb-2">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} onClick={() => setTab(l)} className={`px-3 py-1 text-xs rounded-md ${tab === l ? "bg-tf-blue text-white" : "bg-muted"}`}>{l.toUpperCase()}</button>
          ))}
        </div>
        {tab === "fr" ? (
          <input value={data.titleFr} onChange={(e) => u("titleFr", e.target.value)} placeholder="Ex: Lot 400m² Cocody Angré" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
        ) : (
          <input value={data.titleEn} onChange={(e) => u("titleEn", e.target.value)} placeholder="Ex: 400m² Plot Cocody Angré" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
        )}
      </Field>

      <Field label={fr ? "Type de bien" : "Property type"}>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt, i) => (
            <button
              key={i}
              onClick={() => u("type", opt.v)}
              className={`p-3 rounded-lg border-2 text-sm flex flex-col items-center gap-1 transition-all ${data.type === opt.v ? "border-tf-blue bg-tf-blue/5" : "border-border hover:border-tf-blue/40"}`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span>{fr ? opt.fr : opt.en}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label={fr ? "Type de transaction" : "Transaction type"}>
        <div className="flex gap-2">
          {(["sale", "rent"] as const).map((v) => (
            <button key={v} onClick={() => u("txType", v)} className={`px-4 py-2 rounded-full text-sm border-2 ${data.txType === v ? "border-tf-blue bg-tf-blue text-white" : "border-border"}`}>
              {v === "sale" ? (fr ? "À vendre" : "For Sale") : (fr ? "À louer" : "For Rent")}
            </button>
          ))}
        </div>
      </Field>

      <Field label={fr ? "Continent" : "Continent"}>
        <div className="flex gap-2">
          {(["usa", "africa"] as const).map((v) => (
            <button key={v} onClick={() => u("continent", v)} className={`px-4 py-2 rounded-full text-sm border-2 ${data.continent === v ? "border-tf-blue bg-tf-blue text-white" : "border-border"}`}>
              {v === "usa" ? "🇺🇸 United States" : "🌍 Africa"}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={fr ? "Surface" : "Surface"} error={errors.surface}>
          <div className="flex gap-1">
            <input type="number" value={data.surface} onChange={(e) => u("surface", e.target.value)} className="flex-1 px-3 py-2 bg-muted rounded-md outline-none" />
            <select value={data.surfaceUnit} onChange={(e) => u("surfaceUnit", e.target.value as "m2" | "sqft")} className="px-2 py-2 bg-muted rounded-md outline-none text-sm">
              <option value="m2">m²</option><option value="sqft">sqft</option>
            </select>
          </div>
        </Field>
        <Field label={fr ? "Chambres" : "Bedrooms"}>
          <Stepper value={data.bedrooms} onChange={(n) => u("bedrooms", n)} />
        </Field>
      </div>

      <Field label={fr ? "Salles de bain" : "Bathrooms"}>
        <Stepper value={data.bathrooms} onChange={(n) => u("bathrooms", n)} />
      </Field>

      <Field label="Description">
        <div className="flex gap-1 mb-2">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} onClick={() => setTab(l)} className={`px-3 py-1 text-xs rounded-md ${tab === l ? "bg-tf-blue text-white" : "bg-muted"}`}>{l.toUpperCase()}</button>
          ))}
        </div>
        {tab === "fr" ? (
          <>
            <textarea value={data.descFr} onChange={(e) => u("descFr", e.target.value.slice(0, 2000))} rows={6} className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
            <div className="text-xs text-muted-foreground text-right mt-1">{data.descFr.length}/2000</div>
          </>
        ) : (
          <>
            <textarea value={data.descEn} onChange={(e) => u("descEn", e.target.value.slice(0, 2000))} rows={6} className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
            <div className="text-xs text-muted-foreground text-right mt-1">{data.descEn.length}/2000</div>
          </>
        )}
      </Field>
    </>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-muted rounded-md p-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 rounded-md bg-white flex items-center justify-center"><Minus size={14} /></button>
      <span className="w-10 text-center text-sm font-medium">{value >= 10 ? "10+" : value}</span>
      <button onClick={() => onChange(Math.min(10, value + 1))} className="w-7 h-7 rounded-md bg-white flex items-center justify-center"><Plus size={14} /></button>
    </div>
  );
}

function Step2({ data, u, errors, fr }: StepProps) {
  return (
    <>
      {data.continent === "usa" ? (
        <>
          <Field label="State" error={errors.state}>
            <select value={data.state} onChange={(e) => u("state", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none">
              <option value="">{fr ? "Sélectionner…" : "Select…"}</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" error={errors.city}><input value={data.city} onChange={(e) => u("city", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
            <Field label="ZIP code"><input value={data.zip} onChange={(e) => u("zip", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
          </div>
          <Field label="Neighborhood (optional)"><input value={data.neighborhood} onChange={(e) => u("neighborhood", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
          <Field label="Street address (optional)"><input value={data.address} onChange={(e) => u("address", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
        </>
      ) : (
        <>
          <Field label={fr ? "Pays" : "Country"} error={errors.country}>
            <select value={data.country} onChange={(e) => u("country", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none">
              <option value="">{fr ? "Sélectionner…" : "Select…"}</option>
              {AFRICA_COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? "Ville" : "City"} error={errors.city}><input value={data.city} onChange={(e) => u("city", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
            <Field label={fr ? "Quartier" : "Neighborhood"}><input value={data.neighborhood} onChange={(e) => u("neighborhood", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
          </div>
          <Field label={fr ? "Commune (optionnel)" : "Commune (optional)"}><input value={data.address} onChange={(e) => u("address", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude"><input value={data.lat} onChange={(e) => u("lat", e.target.value)} placeholder="5.3600" className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
        <Field label="Longitude"><input value={data.lng} onChange={(e) => u("lng", e.target.value)} placeholder="-4.0083" className="w-full px-3 py-2 bg-muted rounded-md outline-none" /></Field>
      </div>
      <p className="text-xs text-muted-foreground">{fr ? "Indiquez les coordonnées GPS pour une localisation précise (intégration carte à venir)." : "Enter GPS coordinates for precise location (map integration coming soon)."}</p>
    </>
  );
}

function Step3({ data, u, errors, fr }: StepProps) {
  const addImage = () => u("images", [...data.images, ""]);
  const setImage = (i: number, v: string) => u("images", data.images.map((x, idx) => (idx === i ? v : x)));
  const removeImage = (i: number) => u("images", data.images.filter((_, idx) => idx !== i));
  const setCover = (i: number) => u("cover_url", data.images[i]);

  return (
    <>
      <Field label={fr ? "Photos (URL)" : "Photos (URL)"} error={errors.images}>
        <p className="text-xs text-muted-foreground mb-2">{fr ? "Minimum 3 photos · JPG/PNG/WebP. Cliquez l'étoile pour définir la photo de couverture." : "Minimum 3 photos · JPG/PNG/WebP. Click the star to set cover photo."}</p>
        <div className="space-y-2">
          {data.images.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <button onClick={() => setCover(i)} title="Cover" className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center" style={{ background: data.cover_url === url && url ? "var(--tf-amber)" : "var(--muted)" }}>
                <Star size={14} fill={data.cover_url === url && url ? "white" : "none"} color={data.cover_url === url && url ? "white" : "currentColor"} />
              </button>
              <input value={url} onChange={(e) => setImage(i, e.target.value)} placeholder="https://…" className="flex-1 px-3 py-2 bg-muted rounded-md outline-none text-sm" />
              {url && <img src={url} alt="" className="w-10 h-10 rounded-md object-cover" onError={(e) => (e.currentTarget.style.opacity = "0.3")} />}
              <button onClick={() => removeImage(i)} className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-destructive hover:text-white"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addImage} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-tf-blue hover:text-tf-blue inline-flex items-center justify-center gap-2">
            <Plus size={16} /> {fr ? "Ajouter une photo" : "Add a photo"}
          </button>
        </div>
      </Field>

      <Field label={fr ? "Visite 360° (optionnel)" : "360° tour (optional)"}>
        <input value={data.tour360} onChange={(e) => u("tour360", e.target.value)} placeholder="https://… (equirectangular)" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
        <p className="text-xs text-muted-foreground mt-1">{fr ? "Une visite 360° augmente les visites de +40%" : "A 360° tour increases views by +40%"}</p>
      </Field>

      <Field label={fr ? "Vidéo YouTube/Vimeo (optionnel)" : "YouTube/Vimeo video (optional)"}>
        <input value={data.videoUrl} onChange={(e) => u("videoUrl", e.target.value)} placeholder="https://youtube.com/…" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
      </Field>
    </>
  );
}

function Step4({ data, u, errors, fr }: StepProps) {
  if (data.continent === "africa") {
    return (
      <>
        <Field label={fr ? "Titre foncier (URL)" : "Title deed (URL)"} error={errors.titleDeed}>
          <input value={data.titleDeedUrl} onChange={(e) => u("titleDeedUrl", e.target.value)} placeholder="https://… PDF/JPG/PNG" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full text-white" style={{ background: "var(--tf-red)" }}>{fr ? "Requis" : "Required"}</span>
          <p className="text-xs text-muted-foreground mt-1">{fr ? "Sera vérifié par notre IA et un notaire ONIG sous 48h" : "Verified by our AI + ONIG notary within 48h"}</p>
        </Field>
        <Field label={fr ? "Plan cadastral (URL)" : "Land survey (URL)"}>
          <input value={data.cadastralUrl} onChange={(e) => u("cadastralUrl", e.target.value)} placeholder="https://…" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full text-white" style={{ background: "var(--tf-amber)" }}>{fr ? "Recommandé" : "Recommended"}</span>
        </Field>
        <Field label={fr ? "Permis de construire (optionnel)" : "Building permit (optional)"}>
          <input value={data.buildingPermitUrl} onChange={(e) => u("buildingPermitUrl", e.target.value)} placeholder="https://…" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
        </Field>
      </>
    );
  }
  return (
    <>
      <Field label="MLS number (optional)">
        <input value={data.mlsNumber} onChange={(e) => u("mlsNumber", e.target.value)} className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
      </Field>
      <Field label="Property disclosure documents (optional URL)">
        <input value={data.titleDeedUrl} onChange={(e) => u("titleDeedUrl", e.target.value)} placeholder="https://…" className="w-full px-3 py-2 bg-muted rounded-md outline-none" />
      </Field>
    </>
  );
}

function Step5({ data, u, errors, fr }: StepProps) {
  const fx = FX[data.country];
  const local = fx && data.priceUsd ? Math.round(Number(data.priceUsd) * fx.rate).toLocaleString() : null;
  const BOOSTS: { v: FormData["boost"]; price: string; label: string; sub: string; emoji?: string }[] = [
    { v: "basic", price: fr ? "Gratuit" : "Free", label: "Basic", sub: fr ? "Placement standard" : "Standard placement" },
    { v: "day", price: "$4", label: "Day boost", sub: fr ? "En vedette 24h" : "Featured 24h" },
    { v: "week", price: "$25", label: "Week boost", sub: fr ? "En vedette 7 jours" : "Featured 7 days", emoji: "⭐" },
    { v: "month", price: "$80", label: "Month boost", sub: fr ? "En vedette 30 jours" : "Featured 30 days", emoji: "🔥" },
  ];
  const checks = [
    { ok: !!(data.titleFr || data.titleEn), label: fr ? "Titre renseigné" : "Title entered" },
    { ok: !!data.city, label: fr ? "Localisation définie" : "Location set" },
    { ok: data.images.filter(Boolean).length >= 3, label: fr ? "Minimum 3 photos" : "3+ photos" },
    { ok: !!data.priceUsd, label: fr ? "Prix défini" : "Price set" },
    ...(data.continent === "africa" ? [{ ok: !!data.titleDeedUrl, label: fr ? "Titre foncier uploadé" : "Title deed uploaded" }] : []),
  ];
  return (
    <>
      <Field label={fr ? "Prix en USD" : "Price in USD"} error={errors.price}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-muted-foreground">$</span>
          <input type="number" value={data.priceUsd} onChange={(e) => u("priceUsd", e.target.value)} placeholder="72000" className="flex-1 px-3 py-3 bg-muted rounded-md outline-none text-2xl font-bold" />
        </div>
        {local && fx && <div className="mt-2 text-sm text-muted-foreground">≈ {local} {fx.code} <span className="text-xs">· {fr ? "Taux mis à jour quotidiennement" : "Updated daily"}</span></div>}
      </Field>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={data.negotiable} onChange={(e) => u("negotiable", e.target.checked)} className="w-4 h-4" />
        <span className="text-sm">{fr ? "Prix négociable" : "Price negotiable"}</span>
      </label>

      <div>
        <h3 className="font-display font-bold text-base mb-2">{fr ? "Boostez votre annonce" : "Boost your listing"}</h3>
        <div className="grid grid-cols-2 gap-2">
          {BOOSTS.map((b) => (
            <button
              key={b.v}
              onClick={() => u("boost", b.v)}
              className={`p-3 rounded-lg border-2 text-left ${data.boost === b.v ? "border-tf-green bg-tf-green/5" : "border-border"}`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm">{b.label} {b.emoji}</span>
                <span className="text-sm font-bold" style={{ color: "var(--tf-green)" }}>{b.price}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{b.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-xs font-semibold uppercase tracking-wider mb-2">{fr ? "Avant publication" : "Before publishing"}</div>
        <ul className="space-y-1 text-sm">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {c.ok ? <Check size={14} style={{ color: "var(--tf-green)" }} /> : <span className="w-3.5 h-3.5 rounded-full border border-destructive" />}
              <span className={c.ok ? "" : "text-destructive"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function PublishEligibilityGate({
  fr, userId, userEmail, emailConfirmed, roles,
}: { fr: boolean; userId?: string; userEmail: string | null; emailConfirmed: boolean; roles: string[] }) {
  const [profile, setProfile] = useState<{ full_name: string | null; country: string | null; verified: boolean } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [busyAgent, setBusyAgent] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!userId) { setLoadingProfile(false); return; }
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, country, verified").eq("id", userId).maybeSingle();
      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setCountry(data.country ?? "");
      }
      setLoadingProfile(false);
    })();
  }, [userId]);

  const isAgent = roles.includes("agent") || roles.includes("admin") || roles.includes("super_admin");
  const hasName = !!profile?.full_name && profile.full_name.trim().length > 1;
  const hasCountry = !!profile?.country && profile.country.trim().length > 0;

  const becomeAgent = async () => {
    if (!userId) return;
    setBusyAgent(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "agent" });
    setBusyAgent(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message); return;
    }
    toast.success(fr ? "Statut agent activé ✓" : "Agent status granted ✓");
    if (typeof window !== "undefined") window.location.reload();
  };

  const saveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, country }).eq("id", userId);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    setProfile((p) => p ? { ...p, full_name: fullName, country } : { full_name: fullName, country, verified: false });
    setEditingProfile(false);
    toast.success(fr ? "Profil mis à jour ✓" : "Profile updated ✓");
  };

  if (loadingProfile) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">{fr ? "Vérification de votre éligibilité…" : "Checking your eligibility…"}</div>;
  }

  const requirements = [
    {
      key: "email",
      ok: emailConfirmed,
      label: fr ? "Adresse e-mail vérifiée" : "Verified email address",
      reason: fr
        ? "Nous devons confirmer votre adresse pour vous contacter au sujet de vos annonces."
        : "We need to confirm your address to contact you about your listings.",
    },
    {
      key: "name",
      ok: hasName,
      label: fr ? "Nom complet renseigné" : "Full name provided",
      reason: fr
        ? "Les acheteurs doivent voir un nom réel sur chaque annonce."
        : "Buyers need to see a real name on every listing.",
    },
    {
      key: "country",
      ok: hasCountry,
      label: fr ? "Pays de résidence renseigné" : "Country of residence provided",
      reason: fr
        ? "Le pays est utilisé pour la fiscalité et la juridiction de la transaction."
        : "Country is used for tax and transaction jurisdiction.",
    },
    {
      key: "agent",
      ok: isAgent,
      label: fr ? "Statut agent activé" : "Agent status active",
      reason: fr
        ? "Seuls les comptes agents peuvent publier (responsabilité légale et commission)."
        : "Only agent accounts can publish (legal liability and commission).",
    },
  ];

  const blockers = requirements.filter((r) => !r.ok);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: "color-mix(in oklab, var(--tf-amber) 15%, transparent)" }}>
          <Home style={{ color: "var(--tf-amber)" }} />
        </div>
        <h1 className="font-display text-2xl font-bold">
          {fr ? "Encore quelques étapes avant de publier" : "A few steps before you can publish"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {fr
            ? `${blockers.length} condition${blockers.length > 1 ? "s" : ""} restante${blockers.length > 1 ? "s" : ""} pour activer la publication d'annonces.`
            : `${blockers.length} requirement${blockers.length > 1 ? "s" : ""} left to enable listing publication.`}
        </p>
      </div>

      <ul className="space-y-3">
        {requirements.map((r) => (
          <li key={r.key} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: r.ok ? "color-mix(in oklab, var(--tf-green) 15%, transparent)" : "color-mix(in oklab, var(--tf-amber) 15%, transparent)" }}
              >
                {r.ok ? <Check size={16} style={{ color: "var(--tf-green)" }} /> : <span className="text-[11px] font-bold" style={{ color: "var(--tf-amber)" }}>!</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.label}</div>
                {!r.ok && <div className="text-xs text-muted-foreground mt-0.5">{r.reason}</div>}

                {r.key === "email" && !r.ok && (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                    <button
                      onClick={async () => {
                        if (!userEmail) return;
                        const { error } = await supabase.auth.resend({ type: "signup", email: userEmail });
                        if (error) toast.error(error.message);
                        else toast.success(fr ? "E-mail de vérification renvoyé" : "Verification email resent");
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                      style={{ background: "var(--tf-blue)" }}
                    >
                      {fr ? "Renvoyer l'e-mail" : "Resend email"}
                    </button>
                  </div>
                )}

                {(r.key === "name" || r.key === "country") && !r.ok && (
                  <div className="mt-3">
                    {!editingProfile ? (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                        style={{ background: "var(--tf-blue)" }}
                      >
                        {fr ? "Compléter mon profil" : "Complete my profile"}
                      </button>
                    ) : null}
                  </div>
                )}

                {r.key === "agent" && !r.ok && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={becomeAgent}
                      disabled={busyAgent}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-50"
                      style={{ background: "var(--tf-blue)" }}
                    >
                      {busyAgent ? "…" : fr ? "Activer mon statut agent" : "Activate agent status"}
                    </button>
                    <span className="text-[11px] text-muted-foreground self-center">
                      {fr ? "Gratuit · activation immédiate" : "Free · instant activation"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editingProfile && (
        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <div className="font-semibold text-sm mb-3">{fr ? "Compléter le profil" : "Complete profile"}</div>
          <div className="space-y-2">
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{fr ? "Nom complet" : "Full name"}</div>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder={fr ? "Ex. Awa Diop" : "e.g. Awa Diop"} />
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{fr ? "Pays" : "Country"}</div>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder={fr ? "Ex. Côte d'Ivoire" : "e.g. Ivory Coast"} />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={saveProfile} disabled={savingProfile} className="text-xs font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-50" style={{ background: "var(--tf-blue)" }}>
              {savingProfile ? "…" : fr ? "Enregistrer" : "Save"}
            </button>
            <button onClick={() => setEditingProfile(false)} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border">
              {fr ? "Annuler" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/safety" className="text-xs text-muted-foreground underline">
          {fr ? "Pourquoi ces vérifications ?" : "Why these checks?"}
        </Link>
      </div>
    </div>
  );
}
