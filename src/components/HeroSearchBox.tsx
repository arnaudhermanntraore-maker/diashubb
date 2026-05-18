import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, MapPin, Loader2, X, Home, Building2,
  Hammer, Calculator, KeyRound, Gavel, ChevronDown, ChevronUp,
} from "lucide-react";

const TF_BLUE   = "#185FA5";
const TF_GREEN  = "#1D9E75";
const TF_AMBER  = "#EF9F27";
const TF_PURPLE = "#534AB7";
const TF_RED    = "#DC2626";

type TabId = "buy_us" | "rent_us" | "invest_af" | "contractor" | "estimate" | "foreclosures";

const ALLOWED_LISTING_TYPES = new Set(["land","house","apartment","commercial","farm"]);
const asListingType = (v: string) =>
  ALLOWED_LISTING_TYPES.has(v) ? (v as "land"|"house"|"apartment"|"commercial"|"farm") : undefined;
const asPositiveInt = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};
const asCleanText = (v: string, max = 80) => {
  const t = v.replace(/\s+/g, " ").trim().slice(0, max);
  return t || undefined;
};

const AFRICA_COUNTRIES = [
  { code: "", flag: "🌍", name_en: "All Africa",      name_fr: "Toute l'Afrique" },
  { code: "CI", flag: "🇨🇮", name_en: "Côte d'Ivoire", name_fr: "Côte d'Ivoire" },
  { code: "SN", flag: "🇸🇳", name_en: "Senegal",       name_fr: "Sénégal" },
  { code: "GH", flag: "🇬🇭", name_en: "Ghana",         name_fr: "Ghana" },
  { code: "NG", flag: "🇳🇬", name_en: "Nigeria",       name_fr: "Nigeria" },
  { code: "MA", flag: "🇲🇦", name_en: "Morocco",       name_fr: "Maroc" },
  { code: "CM", flag: "🇨🇲", name_en: "Cameroon",      name_fr: "Cameroun" },
  { code: "KE", flag: "🇰🇪", name_en: "Kenya",         name_fr: "Kenya" },
  { code: "RW", flag: "🇷🇼", name_en: "Rwanda",        name_fr: "Rwanda" },
  { code: "ML", flag: "🇲🇱", name_en: "Mali",          name_fr: "Mali" },
  { code: "BF", flag: "🇧🇫", name_en: "Burkina Faso",  name_fr: "Burkina Faso" },
  { code: "TG", flag: "🇹🇬", name_en: "Togo",          name_fr: "Togo" },
  { code: "BJ", flag: "🇧🇯", name_en: "Benin",         name_fr: "Bénin" },
  { code: "GA", flag: "🇬🇦", name_en: "Gabon",         name_fr: "Gabon" },
  { code: "CG", flag: "🇨🇬", name_en: "Congo",         name_fr: "Congo" },
  { code: "DZ", flag: "🇩🇿", name_en: "Algeria",       name_fr: "Algérie" },
  { code: "TN", flag: "🇹🇳", name_en: "Tunisia",       name_fr: "Tunisie" },
  { code: "MU", flag: "🇲🇺", name_en: "Mauritius",     name_fr: "Maurice" },
];

const US_STATES = [
  "","AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export function HeroSearchBox() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("buy_us");
  const [animKey, setAnimKey] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── BUY US ──
  const [buyZip, setBuyZip]       = useState("");
  const [buyCity, setBuyCity]     = useState("");
  const [buyState, setBuyState]   = useState("");
  const [buyMinPrice, setBuyMinPrice] = useState("");
  const [buyMaxPrice, setBuyMaxPrice] = useState("");
  const [buyType, setBuyType]     = useState("");
  const [buyBeds, setBuyBeds]     = useState("");
  const [buyBaths, setBuyBaths]   = useState("");
  const [buyMinSqft, setBuyMinSqft] = useState("");

  // ── RENT US ──
  const [rentZip, setRentZip]       = useState("");
  const [rentCity, setRentCity]     = useState("");
  const [rentState, setRentState]   = useState("");
  const [rentMinPrice, setRentMinPrice] = useState("");
  const [rentMaxPrice, setRentMaxPrice] = useState("");
  const [rentType, setRentType]     = useState("");
  const [rentBeds, setRentBeds]     = useState("");
  const [rentPetsOk, setRentPetsOk] = useState(false);
  const [rentFurnished, setRentFurnished] = useState(false);

  // ── INVEST AFRICA ──
  const [afCountry, setAfCountry] = useState("");
  const [afCity, setAfCity]       = useState("");
  const [afCommune, setAfCommune] = useState("");
  const [afMinBudget, setAfMinBudget] = useState("");
  const [afMaxBudget, setAfMaxBudget] = useState("");
  const [afType, setAfType]       = useState("");
  const [afDeed, setAfDeed]       = useState("");

  // ── CONTRACTOR ──
  const [trade, setTrade]         = useState("");
  const [ctrCity, setCtrCity]     = useState("");
  const [availability, setAvailability] = useState("");
  const [rating, setRating]       = useState("");

  // ── FORECLOSURES ──
  const [fcState, setFcState]     = useState("");
  const [fcZip, setFcZip]         = useState("");
  const [fcType, setFcType]       = useState("all");
  const [fcMaxPrice, setFcMaxPrice] = useState("");
  const [fcFinancing, setFcFinancing] = useState("");
  const [fcBeds, setFcBeds]       = useState("");

  // ── ESTIMATE ──
  const [estAddress, setEstAddress] = useState("");
  const [estType, setEstType]     = useState("house");
  const [estSize, setEstSize]     = useState("");
  const [estUnit, setEstUnit]     = useState<"sqft"|"m2">("sqft");
  const [estYear, setEstYear]     = useState("");
  const [estLoading, setEstLoading] = useState(false);
  const [estResult, setEstResult] = useState<{low:number;high:number;currency:string;rationale:string}|null>(null);
  const [estError, setEstError]   = useState<string|null>(null);

  useEffect(() => { setAnimKey((k) => k + 1); setShowAdvanced(false); }, [tab]);

  const tabs: { id: TabId; label: string; color: string; icon: React.ComponentType<{size?:number}> }[] = [
    { id: "buy_us",     label: fr ? "Acheter aux USA"       : "Buy in US",        color: TF_BLUE,   icon: Home      },
    { id: "rent_us",    label: fr ? "Louer aux USA"         : "Rent in US",       color: TF_BLUE,   icon: KeyRound  },
    { id: "invest_af",  label: fr ? "Investir en Afrique"   : "Invest in Africa", color: TF_GREEN,  icon: Building2 },
    { id: "contractor", label: fr ? "Trouver un artisan"    : "Find contractor",  color: TF_AMBER,  icon: Hammer    },
    { id: "estimate",   label: fr ? "Estimer un bien"       : "Estimate value",   color: TF_PURPLE, icon: Calculator},
    { id: "foreclosures",label: fr ? "Saisies immobilières" : "Foreclosures",     color: TF_RED,    icon: Gavel     },
  ];

  const activeTab = tabs.find((t) => t.id === tab)!;

  // ── NAVIGATION ──
  const handleSearch = () => {
    if (tab === "buy_us") {
      // Construire la query : zip prioritaire, sinon ville+état
      const q = asCleanText(buyZip || [buyCity, buyState].filter(Boolean).join(", "));
      const minPrice = asPositiveInt(buyMinPrice);
      const maxPrice = asPositiveInt(buyMaxPrice);
      const type     = asListingType(buyType);
      const beds     = asPositiveInt(buyBeds);
      navigate({
        to: "/listings",
        search: {
          region: "usa",
          listing_type: "sale",          // ← distingue Acheter
          ...(q        ? { q }         : {}),
          ...(minPrice ? { minPrice }  : {}),
          ...(maxPrice ? { maxPrice }  : {}),
          ...(type     ? { type }      : {}),
          ...(beds     ? { beds }      : {}),
        } as never,
      });
    } else if (tab === "rent_us") {
      const q = asCleanText(rentZip || [rentCity, rentState].filter(Boolean).join(", "));
      const minPrice = asPositiveInt(rentMinPrice);
      const maxPrice = asPositiveInt(rentMaxPrice);
      const type     = asListingType(rentType);
      const beds     = asPositiveInt(rentBeds);
      navigate({
        to: "/listings",
        search: {
          region: "usa",
          listing_type: "rent",          // ← distingue Louer
          ...(q        ? { q }         : {}),
          ...(minPrice ? { minPrice }  : {}),
          ...(maxPrice ? { maxPrice }  : {}),
          ...(type     ? { type }      : {}),
          ...(beds     ? { beds }      : {}),
        } as never,
      });
    } else if (tab === "invest_af") {
      // Ville + commune pour Afrique
      const cityQ   = asCleanText([afCommune, afCity, afCountry].filter(Boolean).join(", "));
      const minPrice = asPositiveInt(afMinBudget);
      const maxPrice = asPositiveInt(afMaxBudget);
      const type     = asListingType(afType);
      navigate({
        to: "/listings",
        search: {
          region: "africa",
          listing_type: "sale",
          ...(cityQ    ? { q: cityQ } : {}),
          ...(minPrice ? { minPrice } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(type     ? { type }     : {}),
        } as never,
      });
    } else if (tab === "contractor") {
      const tradeClean = asCleanText(trade, 40);
      const cityClean  = asCleanText(ctrCity, 60);
      navigate({
        to: "/contractors",
        search: {
          ...(tradeClean ? { trade: tradeClean } : {}),
          ...(cityClean  ? { city: cityClean }   : {}),
        } as never,
      });
    } else if (tab === "foreclosures") {
      navigate({ to: "/foreclosures", search: {} as never });
    }
  };

  const handleEstimate = async () => {
    if (!estAddress.trim()) { setEstError(fr ? "Adresse requise" : "Address required"); return; }
    setEstLoading(true); setEstError(null); setEstResult(null);
    try {
      const res = await fetch("/api/public/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: estAddress, type: estType, size: estSize, sizeUnit: estUnit, year: estYear, lang: fr ? "fr" : "en" }),
      });
      const data = await res.json();
      if (!res.ok) setEstError(data.error ?? (fr ? "Erreur d'estimation" : "Estimation error"));
      else setEstResult(data);
    } catch { setEstError(fr ? "Service indisponible" : "Service unavailable"); }
    finally { setEstLoading(false); }
  };

  const cls = "w-full px-3 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all";
  const lbl = "block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <section className="bg-muted/40 border-b border-border">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* ── TABS ── */}
        <div role="tablist" className="flex flex-wrap gap-2 mb-4">
          {tabs.map((tb) => {
            const active = tab === tb.id;
            const Icon = tb.icon;
            return (
              <button key={tb.id} role="tab" aria-selected={active}
                onClick={() => setTab(tb.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={active
                  ? { background: tb.color, color: "#fff", borderColor: tb.color }
                  : { background: "#fff", color: "var(--foreground)", borderColor: "var(--border)" }
                }
              >
                <Icon size={14} /> {tb.label}
              </button>
            );
          })}
        </div>

        {/* ── PANEL ── */}
        <div key={animKey} role="tabpanel"
          className="bg-white border border-border rounded-2xl p-5 shadow-soft tf-fadein"
          style={{ borderTop: `3px solid ${activeTab.color}` }}
        >

          {/* ════ BUY US ════ */}
          {tab === "buy_us" && (
            <div className="space-y-3">
              {/* Ligne principale */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* ZIP Code */}
                <div className="md:col-span-2">
                  <label className={lbl}>ZIP Code</label>
                  <input value={buyZip} onChange={(e) => setBuyZip(e.target.value.replace(/\D/g,"").slice(0,5))}
                    placeholder="30301" maxLength={5} className={cls}
                    aria-label="ZIP Code" />
                </div>
                {/* OU */}
                <div className="md:col-span-1 flex items-center justify-center pb-1">
                  <span className="text-xs text-muted-foreground font-medium">{fr ? "ou" : "or"}</span>
                </div>
                {/* Ville */}
                <div className="md:col-span-3">
                  <label className={lbl}>{fr ? "Ville" : "City"}</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={buyCity} onChange={(e) => setBuyCity(e.target.value)}
                      placeholder={fr ? "Atlanta, Houston…" : "Atlanta, Houston…"}
                      className={`${cls} pl-8`} />
                  </div>
                </div>
                {/* État */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "État" : "State"}</label>
                  <select value={buyState} onChange={(e) => setBuyState(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tous" : "All states"}</option>
                    {US_STATES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Budget max */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Budget max" : "Max price"}</label>
                  <select value={buyMaxPrice} onChange={(e) => setBuyMaxPrice(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tout" : "Any"}</option>
                    <option value="200000">&lt; $200k</option>
                    <option value="400000">&lt; $400k</option>
                    <option value="600000">&lt; $600k</option>
                    <option value="1000000">&lt; $1M</option>
                    <option value="100000000">$1M+</option>
                  </select>
                </div>
                {/* Search */}
                <div className="md:col-span-2">
                  <SearchBtn color={TF_BLUE} label={fr ? "Chercher" : "Search"} onClick={handleSearch} />
                </div>
              </div>

              {/* Filtres avancés toggle */}
              <button onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                {showAdvanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showAdvanced
                  ? (fr ? "Masquer les filtres avancés" : "Hide advanced filters")
                  : (fr ? "Filtres avancés (type, chambres, surface…)" : "Advanced filters (type, beds, sqft…)")}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border/50">
                  <div>
                    <label className={lbl}>{fr ? "Type de bien" : "Property type"}</label>
                    <select value={buyType} onChange={(e) => setBuyType(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tout" : "Any"}</option>
                      <option value="house">{fr ? "Maison" : "Single family"}</option>
                      <option value="apartment">Condo / {fr ? "Appt" : "Apt"}</option>
                      <option value="commercial">{fr ? "Immeuble" : "Multi-family"}</option>
                      <option value="land">{fr ? "Terrain" : "Land"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Chambres min" : "Min bedrooms"}</label>
                    <select value={buyBeds} onChange={(e) => setBuyBeds(e.target.value)} className={cls}>
                      <option value="">{fr ? "Indifférent" : "Any"}</option>
                      {["1","2","3","4","5"].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Salles de bain" : "Bathrooms"}</label>
                    <select value={buyBaths} onChange={(e) => setBuyBaths(e.target.value)} className={cls}>
                      <option value="">{fr ? "Indifférent" : "Any"}</option>
                      {["1","2","3","4"].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Budget min" : "Min price"}</label>
                    <select value={buyMinPrice} onChange={(e) => setBuyMinPrice(e.target.value)} className={cls}>
                      <option value="">{fr ? "Aucun min" : "No min"}</option>
                      <option value="50000">$50k</option>
                      <option value="100000">$100k</option>
                      <option value="200000">$200k</option>
                      <option value="400000">$400k</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ RENT US ════ */}
          {tab === "rent_us" && (
            <div className="space-y-3">
              {/* Bandeau info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: "#E6F1FB", color: "#0C447C" }}>
                <KeyRound size={13} />
                {fr
                  ? "Vous recherchez un bien à louer — les résultats afficheront uniquement les locations disponibles."
                  : "You're searching for rentals — results will show only available rental properties."}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* ZIP */}
                <div className="md:col-span-2">
                  <label className={lbl}>ZIP Code</label>
                  <input value={rentZip} onChange={(e) => setRentZip(e.target.value.replace(/\D/g,"").slice(0,5))}
                    placeholder="77001" maxLength={5} className={cls} />
                </div>
                <div className="md:col-span-1 flex items-center justify-center pb-1">
                  <span className="text-xs text-muted-foreground">{fr ? "ou" : "or"}</span>
                </div>
                {/* Ville */}
                <div className="md:col-span-3">
                  <label className={lbl}>{fr ? "Ville" : "City"}</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={rentCity} onChange={(e) => setRentCity(e.target.value)}
                      placeholder="Houston, TX…" className={`${cls} pl-8`} />
                  </div>
                </div>
                {/* État */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "État" : "State"}</label>
                  <select value={rentState} onChange={(e) => setRentState(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tous" : "All"}</option>
                    {US_STATES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Loyer max */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Loyer max/mois" : "Max rent/mo"}</label>
                  <select value={rentMaxPrice} onChange={(e) => setRentMaxPrice(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tout" : "Any"}</option>
                    <option value="1000">&lt; $1,000</option>
                    <option value="1500">&lt; $1,500</option>
                    <option value="2500">&lt; $2,500</option>
                    <option value="4000">&lt; $4,000</option>
                    <option value="100000">$4,000+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <SearchBtn color={TF_BLUE} label={fr ? "Chercher" : "Search"} onClick={handleSearch} />
                </div>
              </div>

              {/* Filtres avancés */}
              <button onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                {showAdvanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showAdvanced
                  ? (fr ? "Masquer" : "Hide filters")
                  : (fr ? "Filtres avancés (chambres, animaux, meublé…)" : "Advanced filters (beds, pets, furnished…)")}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border/50">
                  <div>
                    <label className={lbl}>{fr ? "Type" : "Type"}</label>
                    <select value={rentType} onChange={(e) => setRentType(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tout" : "Any"}</option>
                      <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                      <option value="house">{fr ? "Maison" : "House"}</option>
                      <option value="apartment">Studio</option>
                      <option value="apartment">Condo</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Chambres" : "Bedrooms"}</label>
                    <select value={rentBeds} onChange={(e) => setRentBeds(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tout" : "Any"}</option>
                      <option value="0">Studio</option>
                      {["1","2","3","4"].map((n) => <option key={n} value={n}>{n}bd+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Animaux" : "Pets"}</label>
                    <select value={rentPetsOk ? "yes" : ""} onChange={(e) => setRentPetsOk(e.target.value === "yes")} className={cls}>
                      <option value="">{fr ? "Indifférent" : "Any"}</option>
                      <option value="yes">{fr ? "Animaux acceptés" : "Pets allowed"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Meublé" : "Furnished"}</label>
                    <select value={rentFurnished ? "yes" : ""} onChange={(e) => setRentFurnished(e.target.value === "yes")} className={cls}>
                      <option value="">{fr ? "Indifférent" : "Any"}</option>
                      <option value="yes">{fr ? "Meublé uniquement" : "Furnished only"}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ INVEST AFRICA ════ */}
          {tab === "invest_af" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Pays */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Pays" : "Country"}</label>
                  <select value={afCountry} onChange={(e) => { setAfCountry(e.target.value); setAfCity(""); setAfCommune(""); }} className={cls}>
                    {AFRICA_COUNTRIES.map((c) => (
                      <option key={c.code || "all"} value={c.code}>
                        {c.flag} {fr ? c.name_fr : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Ville */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Ville" : "City"}</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={afCity} onChange={(e) => setAfCity(e.target.value)}
                      placeholder={
                        afCountry === "CI" ? "Abidjan, Bouaké…" :
                        afCountry === "SN" ? "Dakar, Thiès…" :
                        afCountry === "GH" ? "Accra, Kumasi…" :
                        afCountry === "NG" ? "Lagos, Abuja…" :
                        afCountry === "MA" ? "Casablanca, Rabat…" :
                        fr ? "Ville…" : "City…"
                      }
                      className={`${cls} pl-8`} />
                  </div>
                </div>
                {/* Commune / Quartier */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Commune / Quartier" : "District / Area"}</label>
                  <input value={afCommune} onChange={(e) => setAfCommune(e.target.value)}
                    placeholder={
                      afCountry === "CI" ? "Cocody, Yopougon…" :
                      afCountry === "SN" ? "Almadies, Plateau…" :
                      fr ? "Commune…" : "District…"
                    }
                    className={cls} />
                </div>
                {/* Budget min */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Budget min (USD)" : "Min budget (USD)"}</label>
                  <select value={afMinBudget} onChange={(e) => setAfMinBudget(e.target.value)} className={cls}>
                    <option value="">{fr ? "Aucun" : "None"}</option>
                    <option value="10000">$10k</option>
                    <option value="25000">$25k</option>
                    <option value="50000">$50k</option>
                    <option value="100000">$100k</option>
                  </select>
                </div>
                {/* Budget max */}
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Budget max (USD)" : "Max budget (USD)"}</label>
                  <select value={afMaxBudget} onChange={(e) => setAfMaxBudget(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tout" : "Any"}</option>
                    <option value="20000">&lt; $20k</option>
                    <option value="50000">&lt; $50k</option>
                    <option value="100000">&lt; $100k</option>
                    <option value="300000">&lt; $300k</option>
                    <option value="100000000">$300k+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <SearchBtn color={TF_GREEN} label={fr ? "Chercher" : "Search"} onClick={handleSearch} />
                </div>
              </div>

              {/* Filtres avancés Afrique */}
              <button onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                {showAdvanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showAdvanced
                  ? (fr ? "Masquer" : "Hide")
                  : (fr ? "Filtres avancés (type, titre foncier…)" : "Advanced filters (type, title deed…)")}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1 border-t border-border/50">
                  <div>
                    <label className={lbl}>{fr ? "Type de bien" : "Property type"}</label>
                    <select value={afType} onChange={(e) => setAfType(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tous" : "All"}</option>
                      <option value="land">{fr ? "Terrain nu" : "Plot"}</option>
                      <option value="house">{fr ? "Maison / Villa" : "House / Villa"}</option>
                      <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                      <option value="commercial">Commercial</option>
                      <option value="farm">{fr ? "Terrain agricole" : "Agricultural"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Titre foncier" : "Title deed"}</label>
                    <select value={afDeed} onChange={(e) => setAfDeed(e.target.value)} className={cls}>
                      <option value="">{fr ? "Indifférent" : "Any"}</option>
                      <option value="verified">{fr ? "Vérifié Diashubb" : "Diashubb verified"}</option>
                      <option value="ai_notary">{fr ? "IA + Notaire" : "AI + Notary"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Achat / Location" : "Sale / Rent"}</label>
                    <select className={cls}>
                      <option value="sale">{fr ? "À vendre" : "For sale"}</option>
                      <option value="rent">{fr ? "À louer" : "For rent"}</option>
                      <option value="">{fr ? "Les deux" : "Both"}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ CONTRACTOR ════ */}
          {tab === "contractor" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className={lbl}>{fr ? "Corps de métier" : "Trade"}</label>
                <select value={trade} onChange={(e) => setTrade(e.target.value)} className={cls}>
                  <option value="">{fr ? "Tous métiers" : "All trades"}</option>
                  {[
                    ["general",    fr ? "Entrepreneur général" : "General contractor"],
                    ["electrician",fr ? "Électricien"          : "Electrician"       ],
                    ["plumber",    fr ? "Plombier"             : "Plumber"           ],
                    ["hvac",       fr ? "Climatisation / HVAC" : "HVAC"              ],
                    ["painter",    fr ? "Peintre"              : "Painter"           ],
                    ["roofer",     fr ? "Couvreur"             : "Roofer"            ],
                    ["mason",      fr ? "Maçon"                : "Mason"             ],
                    ["carpenter",  fr ? "Menuisier"            : "Carpenter"         ],
                    ["solar",      fr ? "Solaire"              : "Solar"             ],
                    ["landscaper", fr ? "Paysagiste"           : "Landscaper"        ],
                  ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={lbl}>{fr ? "Ville" : "City"}</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={ctrCity} onChange={(e) => setCtrCity(e.target.value)}
                    placeholder="Atlanta, GA / Abidjan…" className={`${cls} pl-8`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{fr ? "Disponibilité" : "Availability"}</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={cls}>
                  <option value="">{fr ? "N'importe quand" : "Any time"}</option>
                  <option value="now">{fr ? "Disponible maintenant" : "Available now"}</option>
                  <option value="week">{fr ? "Cette semaine" : "This week"}</option>
                  <option value="month">{fr ? "Ce mois" : "This month"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{fr ? "Note minimum" : "Min rating"}</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} className={cls}>
                  <option value="">{fr ? "Tout" : "Any"}</option>
                  <option value="4">4★+</option>
                  <option value="4.5">4.5★+</option>
                  <option value="5">5★</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchBtn color={TF_AMBER} darkText label={fr ? "Chercher" : "Search"} onClick={handleSearch} />
              </div>
            </div>
          )}

          {/* ════ ESTIMATE ════ */}
          {tab === "estimate" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className={lbl}>{fr ? "Adresse du bien" : "Property address"}</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={estAddress} onChange={(e) => setEstAddress(e.target.value)}
                    placeholder="123 Peachtree St, Atlanta, GA…"
                    className={`${cls} pl-8`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{fr ? "Type" : "Type"}</label>
                <select value={estType} onChange={(e) => setEstType(e.target.value)} className={cls}>
                  <option value="house">{fr ? "Maison" : "House"}</option>
                  <option value="apartment">Condo</option>
                  <option value="villa">Villa</option>
                  <option value="land">{fr ? "Terrain" : "Plot"}</option>
                  <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{fr ? "Surface" : "Size"}</label>
                <div className="flex gap-1">
                  <input type="number" value={estSize} onChange={(e) => setEstSize(e.target.value)}
                    placeholder={estUnit === "sqft" ? "1800" : "167"} className={cls} />
                  <button type="button" onClick={() => setEstUnit(u => u === "sqft" ? "m2" : "sqft")}
                    className="px-2 text-xs font-semibold bg-muted rounded-xl hover:bg-muted/70">
                    {estUnit === "sqft" ? "sqft" : "m²"}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>{fr ? "Année" : "Year built"}</label>
                <input type="number" value={estYear} onChange={(e) => setEstYear(e.target.value)}
                  placeholder="2005" className={cls} />
              </div>
              <div className="md:col-span-2">
                <button onClick={handleEstimate} disabled={estLoading}
                  className="inline-flex items-center justify-center gap-2 w-full text-white font-semibold rounded-xl text-sm py-2.5 hover:opacity-90 disabled:opacity-50"
                  style={{ background: TF_PURPLE }}>
                  {estLoading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                  {fr ? "Estimer" : "Estimate"}
                </button>
              </div>
            </div>
          )}

          {/* ════ FORECLOSURES ════ */}
          {tab === "foreclosures" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className={lbl}>ZIP Code</label>
                  <input value={fcZip} onChange={(e) => setFcZip(e.target.value.replace(/\D/g,"").slice(0,5))}
                    placeholder="30301" maxLength={5} className={cls} />
                </div>
                <div className="md:col-span-1 flex items-center justify-center pb-1">
                  <span className="text-xs text-muted-foreground">{fr ? "ou" : "or"}</span>
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "État" : "State"}</label>
                  <select value={fcState} onChange={(e) => setFcState(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tous" : "All"}</option>
                    {US_STATES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={lbl}>{fr ? "Type de saisie" : "Foreclosure type"}</label>
                  <select value={fcType} onChange={(e) => setFcType(e.target.value)} className={cls}>
                    <option value="all">{fr ? "Tous" : "All types"}</option>
                    <option value="hud_home">HUD Homes</option>
                    <option value="reo">Bank REO</option>
                    <option value="preforeclosure">Pre-foreclosure</option>
                    <option value="auction">{fr ? "Enchères" : "Auction"}</option>
                    <option value="fannie_mae">Fannie Mae</option>
                    <option value="va_home">VA Homes</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>{fr ? "Prix max" : "Max price"}</label>
                  <select value={fcMaxPrice} onChange={(e) => setFcMaxPrice(e.target.value)} className={cls}>
                    <option value="">{fr ? "Tout" : "Any"}</option>
                    <option value="100000">&lt; $100k</option>
                    <option value="200000">&lt; $200k</option>
                    <option value="350000">&lt; $350k</option>
                    <option value="500000">&lt; $500k</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <SearchBtn color={TF_RED} label={fr ? "Chercher" : "Search"} onClick={handleSearch} />
                </div>
              </div>

              {/* Filtres avancés foreclosures */}
              <button onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                {showAdvanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                {showAdvanced ? (fr ? "Masquer" : "Hide") : (fr ? "Filtres avancés (financement, chambres…)" : "Advanced filters (financing, beds…)")}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1 border-t border-border/50">
                  <div>
                    <label className={lbl}>{fr ? "Financement" : "Financing"}</label>
                    <select value={fcFinancing} onChange={(e) => setFcFinancing(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tout" : "Any"}</option>
                      <option value="FHA">FHA eligible (3.5%)</option>
                      <option value="VA">VA eligible (0%)</option>
                      <option value="Cash">Cash only</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Chambres min" : "Min beds"}</label>
                    <select value={fcBeds} onChange={(e) => setFcBeds(e.target.value)} className={cls}>
                      <option value="">{fr ? "Tout" : "Any"}</option>
                      {["1","2","3","4"].map((n) => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{fr ? "Prix min" : "Min price"}</label>
                    <select className={cls}>
                      <option value="">{fr ? "Aucun" : "None"}</option>
                      <option value="50000">$50k</option>
                      <option value="100000">$100k</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ESTIMATION ── */}
      {(estResult || estError) && tab === "estimate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 tf-fadein"
          onClick={() => { setEstResult(null); setEstError(null); }}>
          <div className="bg-white rounded-2xl shadow-elegant max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setEstResult(null); setEstError(null); }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
              <X size={18} />
            </button>
            {estError ? (
              <>
                <h3 className="text-lg font-bold text-tf-navy mb-2">{fr ? "Erreur" : "Error"}</h3>
                <p className="text-sm text-muted-foreground">{estError}</p>
              </>
            ) : estResult ? (
              <>
                <h3 className="text-lg font-bold text-tf-navy mb-1">{fr ? "Estimation IA" : "AI Estimate"}</h3>
                <p className="text-xs text-muted-foreground mb-4">{estAddress}</p>
                <div className="rounded-xl p-5 text-center"
                  style={{ background: `${TF_PURPLE}10`, border: `1px solid ${TF_PURPLE}30` }}>
                  <div className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">
                    {fr ? "Valeur estimée" : "Estimated value"}
                  </div>
                  <div className="text-2xl font-display font-bold mt-2" style={{ color: TF_PURPLE }}>
                    ${estResult.low.toLocaleString()} – ${estResult.high.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{estResult.currency}</div>
                </div>
                {estResult.rationale && (
                  <p className="text-xs text-muted-foreground mt-4 italic">{estResult.rationale}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-3">
                  {fr
                    ? "Basé sur des ventes comparables. À titre indicatif uniquement."
                    : "Based on comparable sales. Indicative only."}
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function SearchBtn({ color, label, onClick, darkText }: {
  color: string; label: string; onClick: () => void; darkText?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center justify-center gap-2 w-full font-semibold rounded-xl text-sm py-2.5 transition-all hover:opacity-90 hover:shadow-md"
      style={{ background: color, color: darkText ? "#1F2937" : "#fff" }}>
      <Search size={15} /> {label}
    </button>
  );
}
