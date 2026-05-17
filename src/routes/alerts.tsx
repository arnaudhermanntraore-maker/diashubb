import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import {
  Bell,
  Trash2,
  Plus,
  X,
  Home,
  Globe,
  DollarSign,
  MapPin,
  BedDouble,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Alerts,
});

interface AlertCriteria {
  country?: string;
  continent?: "us" | "africa" | "all";
  maxPrice?: number;
  minPrice?: number;
  type?: string;
  city?: string;
  bedrooms?: number;
}

interface Alert {
  id: string;
  criteria_json: AlertCriteria;
  active: boolean;
  created_at: string;
  last_matched_at?: string | null;
}

const COUNTRIES = [
  { code: "US", flag: "🇺🇸", name: "United States" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN", flag: "🇸🇳", name: "Sénégal" },
  { code: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "MA", flag: "🇲🇦", name: "Maroc" },
  { code: "CM", flag: "🇨🇲", name: "Cameroun" },
  { code: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda" },
];

const TYPES = [
  { value: "", label_fr: "Tout type", label_en: "Any type" },
  { value: "house", label_fr: "Maison", label_en: "House" },
  { value: "villa", label_fr: "Villa", label_en: "Villa" },
  { value: "apartment", label_fr: "Appartement", label_en: "Apartment" },
  { value: "land", label_fr: "Terrain", label_en: "Land" },
  { value: "commercial", label_fr: "Commercial", label_en: "Commercial" },
];

const PRICE_RANGES = [
  { label: "< $50k", max: 50000 },
  { label: "$50k–$150k", min: 50000, max: 150000 },
  { label: "$150k–$300k", min: 150000, max: 300000 },
  { label: "$300k–$500k", min: 300000, max: 500000 },
  { label: "$500k+", min: 500000 },
];

function criteriaLabel(c: AlertCriteria, fr: boolean): string {
  const parts: string[] = [];
  if (c.country) {
    const found = COUNTRIES.find((x) => x.code === c.country);
    if (found) parts.push(`${found.flag} ${found.name}`);
  }
  if (c.type) {
    const found = TYPES.find((x) => x.value === c.type);
    if (found) parts.push(fr ? found.label_fr : found.label_en);
  }
  if (c.maxPrice && c.minPrice) {
    parts.push(`$${(c.minPrice / 1000).toFixed(0)}k–$${(c.maxPrice / 1000).toFixed(0)}k`);
  } else if (c.maxPrice) {
    parts.push(`< $${(c.maxPrice / 1000).toFixed(0)}k`);
  } else if (c.minPrice) {
    parts.push(`> $${(c.minPrice / 1000).toFixed(0)}k`);
  }
  if (c.city) parts.push(`📍 ${c.city}`);
  if (c.bedrooms) parts.push(`🛏 ${c.bedrooms}+`);
  return parts.join(" · ") || (fr ? "Tous les biens" : "All properties");
}

function timeAgo(dateStr: string, fr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (days > 0) return fr ? `il y a ${days}j` : `${days}d ago`;
  if (hours > 0) return fr ? `il y a ${hours}h` : `${hours}h ago`;
  return fr ? `il y a ${minutes}min` : `${minutes}min ago`;
}

export default function Alerts() {
  const enabled = useFeatureFlag("property_alerts");
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");

  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [bedrooms, setBedrooms] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Alert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (enabled) load();
    else setLoading(false);
  }, [user, enabled, load]);

  if (!enabled) return <FeatureDisabled featureKey="property_alerts" />;

  const resetForm = () => {
    setCountry("");
    setType("");
    setPriceRange(null);
    setCity("");
    setBedrooms(null);
    setShowForm(false);
  };

  const create = async () => {
    if (!user) return;
    setSaving(true);

    const criteria: AlertCriteria = {};
    if (country) criteria.country = country;
    if (type) criteria.type = type;
    if (priceRange !== null) {
      const range = PRICE_RANGES[priceRange];
      if (range.min) criteria.minPrice = range.min;
      if (range.max) criteria.maxPrice = range.max;
    }
    if (city.trim()) criteria.city = city.trim();
    if (bedrooms) criteria.bedrooms = bedrooms;

    const { error } = await supabase.from("alerts").insert([
      { user_id: user.id, criteria_json: criteria as never, active: true },
    ]);

    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        fr
          ? "Alerte créée — vous serez notifié dès qu'un bien correspond"
          : "Alert created — you'll be notified when a match is found",
        { icon: "🔔", duration: 4000 }
      );
      resetForm();
      load();
    }
  };

  const remove = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    setItems((prev) => prev.filter((a) => a.id !== id));
    toast(fr ? "Alerte supprimée" : "Alert deleted", {
      icon: "🗑️",
      duration: 2000,
    });
  };

  const toggle = async (a: Alert) => {
    const newVal = !a.active;
    setItems((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, active: newVal } : x))
    );
    await supabase
      .from("alerts")
      .update({ active: newVal })
      .eq("id", a.id);
    toast(
      newVal
        ? fr ? "Alerte activée" : "Alert enabled"
        : fr ? "Alerte mise en pause" : "Alert paused",
      { duration: 2000 }
    );
  };

  const activeCount = items.filter((a) => a.active).length;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Bell size={26} aria-hidden="true" />
            {fr ? "Mes alertes" : "My alerts"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount > 0
              ? fr
                ? `${activeCount} alerte(s) active(s) sur ${items.length}`
                : `${activeCount} active alert(s) of ${items.length}`
              : fr
                ? "Soyez notifié dès qu'un bien correspond à vos critères"
                : "Get notified when a property matches your criteria"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 text-white rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: "var(--tf-blue)" }}
        >
          <Plus size={14} aria-hidden="true" />
          {fr ? "Nouvelle alerte" : "New alert"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-semibold">
              {fr ? "Créer une alerte" : "Create an alert"}
            </h2>
            <button
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Country */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" />
                {fr ? "Pays" : "Country"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCountry("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    country === ""
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary"
                  }`}
                >
                  {fr ? "Tous" : "All"}
                </button>
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      country === c.code
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {c.flag} {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <Home size={12} aria-hidden="true" />
                {fr ? "Type de bien" : "Property type"}
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      type === t.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {fr ? t.label_fr : t.label_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <DollarSign size={12} aria-hidden="true" />
                {fr ? "Budget" : "Budget"}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPriceRange(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    priceRange === null
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground hover:border-primary"
                  }`}
                >
                  {fr ? "Tout budget" : "Any budget"}
                </button>
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setPriceRange(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      priceRange === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City + Bedrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {fr ? "Ville (optionnel)" : "City (optional)"}
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={fr ? "Ex: Abidjan" : "e.g. Atlanta"}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <BedDouble size={12} aria-hidden="true" />
                  {fr ? "Chambres min." : "Min. bedrooms"}
                </label>
                <select
                  value={bedrooms ?? ""}
                  onChange={(e) =>
                    setBedrooms(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{fr ? "Indifférent" : "Any"}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {fr ? "Alerte : " : "Alert: "}
              </span>
              {criteriaLabel(
                {
                  country: country || undefined,
                  type: type || undefined,
                  minPrice: priceRange !== null ? PRICE_RANGES[priceRange].min : undefined,
                  maxPrice: priceRange !== null ? PRICE_RANGES[priceRange].max : undefined,
                  city: city || undefined,
                  bedrooms: bedrooms ?? undefined,
                },
                fr
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {fr ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={create}
                disabled={saving}
                className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving
                  ? fr ? "Création…" : "Creating…"
                  : fr ? "Créer l'alerte 🔔" : "Create alert 🔔"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded-xl animate-pulse"
            />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Bell size={28} className="text-blue-300" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-display font-semibold mb-1">
              {fr ? "Aucune alerte" : "No alerts yet"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              {fr
                ? "Créez une alerte pour être notifié dès qu'un bien correspond à vos critères."
                : "Create an alert to be notified as soon as a matching property appears."}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-white rounded-full px-5 py-2.5 text-sm font-medium"
              style={{ background: "var(--tf-blue)" }}
            >
              <Plus size={14} aria-hidden="true" />
              {fr ? "Créer ma première alerte" : "Create my first alert"}
            </button>
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className={`bg-card border rounded-xl p-4 flex items-center gap-3 transition-opacity ${
                a.active ? "border-border opacity-100" : "border-border opacity-60"
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => toggle(a)}
                aria-label={a.active ? "Désactiver" : "Activer"}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {a.active ? (
                  <ToggleRight size={28} className="text-green-600" />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {criteriaLabel(a.criteria_json, fr)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>
                    {fr ? "Créée" : "Created"}{" "}
                    {timeAgo(a.created_at, fr)}
                  </span>
                  {a.last_matched_at && (
                    <>
                      <span>·</span>
                      <span className="text-green-600">
                        {fr ? "Dernier match" : "Last match"}{" "}
                        {timeAgo(a.last_matched_at, fr)}
                      </span>
                    </>
                  )}
                  {!a.active && (
                    <span className="text-amber-600">
                      {fr ? "En pause" : "Paused"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  a.active
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a.active
                  ? fr ? "Active" : "Active"
                  : fr ? "Pause" : "Paused"}
              </span>

              {/* Delete */}
              <button
                onClick={() => remove(a.id)}
                aria-label={fr ? "Supprimer l'alerte" : "Delete alert"}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="mt-8 flex items-center justify-between text-sm">
          <Link to="/listings" className="text-primary hover:underline">
            ← {fr ? "Voir les annonces" : "Browse listings"}
          </Link>
          <Link to="/favorites" className="text-primary hover:underline">
            ❤️ {fr ? "Mes favoris" : "My favorites"}
          </Link>
        </div>
      )}
    </div>
  );
}
