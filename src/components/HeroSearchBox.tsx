import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, Loader2, X, Home, Building2, Hammer, Calculator, KeyRound } from "lucide-react";

const TF_BLUE = "#185FA5";
const TF_GREEN = "#1D9E75";
const TF_AMBER = "#EF9F27";
const TF_PURPLE = "#534AB7";

type TabId = "buy_us" | "rent_us" | "invest_af" | "contractor" | "estimate";
type ListingType = "land" | "house" | "apartment" | "commercial" | "farm";
const ALLOWED_LISTING_TYPES: ReadonlySet<ListingType> = new Set(["land", "house", "apartment", "commercial", "farm"]);
const asListingType = (v: string): ListingType | undefined =>
  ALLOWED_LISTING_TYPES.has(v as ListingType) ? (v as ListingType) : undefined;
const asPositiveInt = (v: string): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};
const asCleanText = (v: string, max = 80): string | undefined => {
  const t = v.replace(/\s+/g, " ").trim().slice(0, max);
  return t || undefined;
};

const AFRICA_COUNTRIES: { code: string; flag: string; name_en: string; name_fr: string }[] = [
  { code: "", flag: "🌍", name_en: "All Africa", name_fr: "Toute l'Afrique" },
  { code: "CI", flag: "🇨🇮", name_en: "Côte d'Ivoire", name_fr: "Côte d'Ivoire" },
  { code: "SN", flag: "🇸🇳", name_en: "Senegal", name_fr: "Sénégal" },
  { code: "GH", flag: "🇬🇭", name_en: "Ghana", name_fr: "Ghana" },
  { code: "NG", flag: "🇳🇬", name_en: "Nigeria", name_fr: "Nigeria" },
  { code: "MA", flag: "🇲🇦", name_en: "Morocco", name_fr: "Maroc" },
  { code: "CM", flag: "🇨🇲", name_en: "Cameroon", name_fr: "Cameroun" },
  { code: "KE", flag: "🇰🇪", name_en: "Kenya", name_fr: "Kenya" },
  { code: "RW", flag: "🇷🇼", name_en: "Rwanda", name_fr: "Rwanda" },
  { code: "ML", flag: "🇲🇱", name_en: "Mali", name_fr: "Mali" },
  { code: "BF", flag: "🇧🇫", name_en: "Burkina Faso", name_fr: "Burkina Faso" },
  { code: "TG", flag: "🇹🇬", name_en: "Togo", name_fr: "Togo" },
  { code: "BJ", flag: "🇧🇯", name_en: "Benin", name_fr: "Bénin" },
  { code: "GA", flag: "🇬🇦", name_en: "Gabon", name_fr: "Gabon" },
  { code: "CG", flag: "🇨🇬", name_en: "Congo", name_fr: "Congo" },
  { code: "DZ", flag: "🇩🇿", name_en: "Algeria", name_fr: "Algérie" },
  { code: "TN", flag: "🇹🇳", name_en: "Tunisia", name_fr: "Tunisie" },
  { code: "MU", flag: "🇲🇺", name_en: "Mauritius", name_fr: "Maurice" },
  { code: "MR", flag: "🇲🇷", name_en: "Mauritania", name_fr: "Mauritanie" },
];

export function HeroSearchBox() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("buy_us");
  const [animKey, setAnimKey] = useState(0);

  // Buy US
  const [buyLocation, setBuyLocation] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyType, setBuyType] = useState("");
  const [buyBeds, setBuyBeds] = useState("");

  // Rent US
  const [rentLocation, setRentLocation] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [rentBeds, setRentBeds] = useState("");
  const [rentType, setRentType] = useState("");

  // Invest Africa
  const [afCountry, setAfCountry] = useState("");
  const [afBudget, setAfBudget] = useState("");
  const [afType, setAfType] = useState("");
  const [afDeed, setAfDeed] = useState("");

  // Contractor
  const [trade, setTrade] = useState("");
  const [ctrCity, setCtrCity] = useState("");
  const [availability, setAvailability] = useState("");
  const [rating, setRating] = useState("");

  // Estimate
  const [estAddress, setEstAddress] = useState("");
  const [estType, setEstType] = useState("house");
  const [estSize, setEstSize] = useState("");
  const [estUnit, setEstUnit] = useState<"sqft" | "m2">("sqft");
  const [estYear, setEstYear] = useState("");
  const [estLoading, setEstLoading] = useState(false);
  const [estResult, setEstResult] = useState<{ low: number; high: number; currency: string; rationale: string } | null>(null);
  const [estError, setEstError] = useState<string | null>(null);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [tab]);

  const tabs: { id: TabId; label: string; color: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "buy_us", label: fr ? "Acheter aux USA" : "Buy in US", color: TF_BLUE, icon: Home },
    { id: "rent_us", label: fr ? "Louer aux USA" : "Rent in US", color: TF_BLUE, icon: KeyRound },
    { id: "invest_af", label: fr ? "Investir en Afrique" : "Invest in Africa", color: TF_GREEN, icon: Building2 },
    { id: "contractor", label: fr ? "Trouver un artisan" : "Find contractor", color: TF_AMBER, icon: Hammer },
    { id: "estimate", label: fr ? "Estimer un bien" : "Estimate value", color: TF_PURPLE, icon: Calculator },
  ];

  const activeTab = tabs.find((t) => t.id === tab)!;

  const handleSearch = () => {
    if (tab === "buy_us") {
      const q = asCleanText(buyLocation);
      const maxPrice = asPositiveInt(buyPrice);
      const type = asListingType(buyType);
      navigate({
        to: "/listings",
        search: {
          ...(q ? { q } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(type ? { type } : {}),
          region: "usa" as const,
        },
      });
    } else if (tab === "rent_us") {
      const q = asCleanText(rentLocation);
      const maxPrice = asPositiveInt(rentPrice);
      const type = asListingType(rentType);
      navigate({
        to: "/listings",
        search: {
          ...(q ? { q } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(type ? { type } : {}),
          region: "usa" as const,
        },
      });
    } else if (tab === "invest_af") {
      const q = asCleanText(afCountry, 40);
      const maxPrice = asPositiveInt(afBudget);
      const type = asListingType(afType);
      navigate({
        to: "/listings",
        search: {
          ...(maxPrice ? { maxPrice } : {}),
          ...(type ? { type } : {}),
          ...(q ? { q } : {}),
          region: "africa" as const,
        },
      });
    } else if (tab === "contractor") {
      const tradeClean = asCleanText(trade, 40);
      const cityClean = asCleanText(ctrCity, 60);
      navigate({
        to: "/contractors",
        search: {
          ...(tradeClean ? { trade: tradeClean } : {}),
          ...(cityClean ? { city: cityClean } : {}),
        } as never,
      });
    }
  };

  const handleEstimate = async () => {
    if (!estAddress.trim()) {
      setEstError(fr ? "Adresse requise" : "Address required");
      return;
    }
    setEstLoading(true);
    setEstError(null);
    setEstResult(null);
    try {
      const res = await fetch("/api/public/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: estAddress,
          type: estType,
          size: estSize,
          sizeUnit: estUnit,
          year: estYear,
          lang: fr ? "fr" : "en",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEstError(data.error ?? (fr ? "Erreur d'estimation" : "Estimation error"));
      } else {
        setEstResult(data);
      }
    } catch {
      setEstError(fr ? "Service indisponible" : "Service unavailable");
    } finally {
      setEstLoading(false);
    }
  };

  const fieldClass = "w-full px-3 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 transition-all";
  const labelClass = "block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <section className="bg-muted/40 border-b border-border">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Tabs */}
        <div role="tablist" aria-label={fr ? "Type de recherche" : "Search type"} className="flex flex-wrap gap-2 mb-4">
          {tabs.map((tb) => {
            const active = tab === tb.id;
            const Icon = tb.icon;
            return (
              <button
                key={tb.id}
                role="tab"
                aria-selected={active}
                aria-controls={`search-panel-${tb.id}`}
                id={`search-tab-${tb.id}`}
                onClick={() => setTab(tb.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={
                  active
                    ? { background: tb.color, color: "#fff", borderColor: tb.color }
                    : { background: "#fff", color: "var(--foreground)", borderColor: "var(--border)" }
                }
              >
                <Icon size={14} /> {tb.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          key={animKey}
          id={`search-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`search-tab-${tab}`}
          className="bg-white border border-border rounded-2xl p-4 shadow-soft tf-fadein"
          style={{ borderTop: `3px solid ${activeTab.color}` }}
        >
          {tab === "buy_us" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className={labelClass}>{fr ? "Ville, quartier ou code postal" : "City, neighborhood or ZIP"}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={buyLocation} onChange={(e) => setBuyLocation(e.target.value)} placeholder="Atlanta, GA or 30301…" className={`${fieldClass} pl-9`} aria-label={fr ? "Localisation" : "Location"} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Budget" : "Price range"}</label>
                <select value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout budget" : "Any price"}</option>
                  <option value="200000">{fr ? "Moins de" : "Under"} $200k</option>
                  <option value="400000">$200k – $400k</option>
                  <option value="600000">$400k – $600k</option>
                  <option value="1000000">$600k – $1M</option>
                  <option value="100000000">$1M+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Type de bien" : "Property type"}</label>
                <select value={buyType} onChange={(e) => setBuyType(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout type" : "Any type"}</option>
                  <option value="house">{fr ? "Maison individuelle" : "Single family"}</option>
                  <option value="apartment">{fr ? "Appartement" : "Condo"}</option>
                  <option value="house">{fr ? "Maison de ville" : "Townhouse"}</option>
                  <option value="commercial">{fr ? "Immeuble" : "Multi-family"}</option>
                  <option value="land">{fr ? "Terrain" : "Land"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Chambres" : "Bedrooms"}</label>
                <select value={buyBeds} onChange={(e) => setBuyBeds(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Indifférent" : "Any"}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchButton color={TF_BLUE} label={fr ? "Chercher des biens" : "Search homes"} onClick={handleSearch} />
              </div>
            </div>
          )}

          {tab === "rent_us" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className={labelClass}>{fr ? "Ville ou quartier" : "City or neighborhood"}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={rentLocation} onChange={(e) => setRentLocation(e.target.value)} placeholder="Houston, TX…" className={`${fieldClass} pl-9`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Loyer mensuel" : "Monthly rent"}</label>
                <select value={rentPrice} onChange={(e) => setRentPrice(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout" : "Any"}</option>
                  <option value="1000">{fr ? "Moins de" : "Under"} $1,000/mo</option>
                  <option value="1500">$1,000 – $1,500</option>
                  <option value="2500">$1,500 – $2,500</option>
                  <option value="4000">$2,500 – $4,000</option>
                  <option value="100000">$4,000+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Chambres" : "Bedrooms"}</label>
                <select value={rentBeds} onChange={(e) => setRentBeds(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout" : "Any"}</option>
                  <option value="0">Studio</option>
                  <option value="1">1bd</option>
                  <option value="2">2bd</option>
                  <option value="3">3bd</option>
                  <option value="4">4bd+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Type" : "Property type"}</label>
                <select value={rentType} onChange={(e) => setRentType(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout" : "Any"}</option>
                  <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                  <option value="house">{fr ? "Maison" : "House"}</option>
                  <option value="apartment">Condo</option>
                  <option value="apartment">Studio</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchButton color={TF_BLUE} label={fr ? "Chercher locations" : "Search rentals"} onClick={handleSearch} />
              </div>
            </div>
          )}

          {tab === "invest_af" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className={labelClass}>{fr ? "Pays" : "Country"}</label>
                <select value={afCountry} onChange={(e) => setAfCountry(e.target.value)} className={fieldClass}>
                  {AFRICA_COUNTRIES.map((c) => (
                    <option key={c.code || "all"} value={c.code}>{c.flag} {fr ? c.name_fr : c.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>{fr ? "Budget (USD)" : "Budget (USD)"}</label>
                <select value={afBudget} onChange={(e) => setAfBudget(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout budget" : "Any budget"}</option>
                  <option value="20000">{fr ? "Moins de" : "Under"} $20,000</option>
                  <option value="50000">$20,000 – $50,000</option>
                  <option value="100000">$50,000 – $100,000</option>
                  <option value="300000">$100,000 – $300,000</option>
                  <option value="100000000">$300,000+</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Type de bien" : "Property type"}</label>
                <select value={afType} onChange={(e) => setAfType(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tous types" : "All types"}</option>
                  <option value="land">{fr ? "Terrain nu" : "Plot"}</option>
                  <option value="house">{fr ? "Maison" : "House"}</option>
                  <option value="house">Villa</option>
                  <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                  <option value="commercial">Commercial</option>
                  <option value="farm">{fr ? "Terrain agricole" : "Agricultural"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Titre foncier" : "Title deed"}</label>
                <select value={afDeed} onChange={(e) => setAfDeed(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Indifférent" : "Any"}</option>
                  <option value="verified">{fr ? "Vérifié" : "Verified only"}</option>
                  <option value="ai_notary">{fr ? "IA + Notaire" : "AI + Notary"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchButton color={TF_GREEN} label={fr ? "Chercher en Afrique" : "Search Africa"} onClick={handleSearch} />
              </div>
            </div>
          )}

          {tab === "contractor" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className={labelClass}>{fr ? "Corps de métier" : "Trade / Specialty"}</label>
                <select value={trade} onChange={(e) => setTrade(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tous métiers" : "All trades"}</option>
                  <option value="general">{fr ? "Entrepreneur général" : "General contractor"}</option>
                  <option value="electrician">{fr ? "Électricien" : "Electrician"}</option>
                  <option value="plumber">{fr ? "Plombier" : "Plumber"}</option>
                  <option value="hvac">{fr ? "Climatisation" : "HVAC"}</option>
                  <option value="painter">{fr ? "Peintre" : "Painter"}</option>
                  <option value="roofer">{fr ? "Couvreur" : "Roofer"}</option>
                  <option value="mason">{fr ? "Maçon" : "Mason"}</option>
                  <option value="carpenter">{fr ? "Menuisier" : "Carpenter"}</option>
                  <option value="landscaper">{fr ? "Paysagiste" : "Landscaper"}</option>
                  <option value="tiler">{fr ? "Carreleur" : "Tiler"}</option>
                  <option value="welder">{fr ? "Soudeur" : "Welder"}</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>{fr ? "Ville" : "City"}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={ctrCity} onChange={(e) => setCtrCity(e.target.value)} placeholder="Atlanta, GA…" className={`${fieldClass} pl-9`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Disponibilité" : "Availability"}</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "N'importe quand" : "Any time"}</option>
                  <option value="now">{fr ? "Disponible maintenant" : "Available now"}</option>
                  <option value="week">{fr ? "Cette semaine" : "This week"}</option>
                  <option value="month">{fr ? "Ce mois" : "This month"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Note minimum" : "Rating"}</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} className={fieldClass}>
                  <option value="">{fr ? "Tout" : "Any"}</option>
                  <option value="4">4★+</option>
                  <option value="4.5">4.5★+</option>
                  <option value="5">5★</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <SearchButton color={TF_AMBER} darkText label={fr ? "Trouver un artisan" : "Find contractor"} onClick={handleSearch} />
              </div>
            </div>
          )}

          {tab === "estimate" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className={labelClass}>{fr ? "Adresse du bien" : "Property address"}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={estAddress} onChange={(e) => setEstAddress(e.target.value)} placeholder="123 Peachtree St, Atlanta, GA…" className={`${fieldClass} pl-9`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Type" : "Property type"}</label>
                <select value={estType} onChange={(e) => setEstType(e.target.value)} className={fieldClass}>
                  <option value="house">{fr ? "Maison" : "House"}</option>
                  <option value="apartment">Condo</option>
                  <option value="villa">Villa</option>
                  <option value="land">{fr ? "Terrain" : "Plot"}</option>
                  <option value="apartment">{fr ? "Appartement" : "Apartment"}</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Surface" : "Size"}</label>
                <div className="flex gap-1">
                  <input type="number" value={estSize} onChange={(e) => setEstSize(e.target.value)} placeholder={estUnit === "sqft" ? "1,800" : "167"} className={fieldClass} />
                  <button type="button" onClick={() => setEstUnit(estUnit === "sqft" ? "m2" : "sqft")} className="px-2 text-xs font-semibold bg-muted rounded-xl hover:bg-muted/70" aria-label={fr ? "Changer d'unité" : "Toggle unit"}>
                    {estUnit === "sqft" ? "sqft" : "m²"}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{fr ? "Année" : "Year built"}</label>
                <input type="number" value={estYear} onChange={(e) => setEstYear(e.target.value)} placeholder="2005" className={fieldClass} />
              </div>
              <div className="md:col-span-2">
                <button onClick={handleEstimate} disabled={estLoading} className="inline-flex items-center justify-center gap-2 w-full text-white font-semibold rounded-xl text-sm py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: TF_PURPLE }}>
                  {estLoading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                  {fr ? "Obtenir une estimation" : "Get estimate"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estimate result modal */}
      {(estResult || estError) && tab === "estimate" && (
        <div role="dialog" aria-modal="true" aria-labelledby="estimate-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 tf-fadein" onClick={() => { setEstResult(null); setEstError(null); }}>
          <div className="bg-white rounded-2xl shadow-elegant max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setEstResult(null); setEstError(null); }} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted" aria-label={fr ? "Fermer" : "Close"}>
              <X size={18} />
            </button>
            {estError ? (
              <>
                <h3 id="estimate-title" className="text-lg font-bold text-tf-navy mb-2">{fr ? "Erreur" : "Error"}</h3>
                <p className="text-sm text-muted-foreground">{estError}</p>
              </>
            ) : estResult ? (
              <>
                <h3 id="estimate-title" className="text-lg font-bold text-tf-navy mb-1">{fr ? "Estimation IA" : "AI Estimate"}</h3>
                <p className="text-xs text-muted-foreground mb-4">{estAddress}</p>
                <div className="rounded-xl p-5 text-center" style={{ background: `${TF_PURPLE}10`, border: `1px solid ${TF_PURPLE}30` }}>
                  <div className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">{fr ? "Valeur estimée" : "Estimated value"}</div>
                  <div className="text-2xl font-display font-bold mt-2" style={{ color: TF_PURPLE }}>
                    ${estResult.low.toLocaleString()} – ${estResult.high.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{estResult.currency}</div>
                </div>
                {estResult.rationale && (
                  <p className="text-xs text-muted-foreground mt-4 italic">{estResult.rationale}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-3">
                  {fr ? "Basé sur des ventes comparables dans la zone. À titre indicatif uniquement." : "Based on comparable sales in the area. Indicative only."}
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function SearchButton({ color, label, onClick, darkText }: { color: string; label: string; onClick: () => void; darkText?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 w-full font-semibold rounded-xl text-sm py-2.5 transition-all hover:opacity-90 hover:shadow-md"
      style={{ background: color, color: darkText ? "#1F2937" : "#fff" }}
    >
      <Search size={16} /> {label}
    </button>
  );
}
