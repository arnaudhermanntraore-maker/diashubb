import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { Bell, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Alerts,
});

interface Alert { id: string; criteria_json: Record<string, unknown>; active: boolean; created_at: string; }

function Alerts() {
  const enabled = useFeatureFlag("property_alerts");
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const [items, setItems] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [country, setCountry] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as Alert[]);
  };

  useEffect(() => { if (enabled) load(); }, [user, enabled]);

  if (!enabled) return <FeatureDisabled featureKey="property_alerts" />;

  const create = async () => {
    if (!user) return;
    const criteria: Record<string, unknown> = {};
    if (country) criteria.country = country;
    if (maxPrice) criteria.maxPrice = Number(maxPrice);
    if (type) criteria.type = type;
    const { error } = await supabase.from("alerts").insert({ user_id: user.id, criteria_json: criteria });
    if (error) toast.error(error.message); else { toast.success(fr ? "Alerte créée" : "Alert created"); setShowForm(false); setCountry(""); setMaxPrice(""); setType(""); load(); }
  };

  const remove = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    load();
  };

  const toggle = async (a: Alert) => {
    await supabase.from("alerts").update({ active: !a.active }).eq("id", a.id);
    load();
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold inline-flex items-center gap-2"><Bell size={24} /> {fr ? "Mes alertes" : "My alerts"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{fr ? "Soyez notifié des nouveaux biens correspondant à vos critères" : "Get notified of new matching properties"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm"><Plus size={14}/> {fr ? "Nouvelle alerte" : "New alert"}</button>
      </div>

      {showForm && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-5 space-y-3">
          <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} placeholder={fr ? "Pays (ex: CI, US)" : "Country (e.g. CI, US)"} className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none" />
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={fr ? "Prix max (USD)" : "Max price (USD)"} className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none">
            <option value="">{fr ? "Tout type" : "Any type"}</option>
            <option value="land">Land</option><option value="house">House</option><option value="apartment">Apartment</option><option value="commercial">Commercial</option><option value="farm">Farm</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm">{fr ? "Annuler" : "Cancel"}</button>
            <button onClick={create} className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm">{fr ? "Créer" : "Create"}</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {items.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">{fr ? "Aucune alerte" : "No alerts yet"}</p>}
        {items.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <button onClick={() => toggle(a)} className={`w-9 h-5 rounded-full ${a.active ? "bg-green-600" : "bg-gray-400"} relative shrink-0`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${a.active ? "left-[18px]" : "left-0.5"}`} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{Object.entries(a.criteria_json).map(([k, v]) => `${k}: ${v}`).join(" · ") || (fr ? "Tous les biens" : "All properties")}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <div className="mt-6"><Link to="/listings" className="text-sm text-primary">← {fr ? "Voir les annonces" : "Browse listings"}</Link></div>
    </div>
  );
}
