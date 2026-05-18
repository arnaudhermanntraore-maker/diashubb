import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Building2, Camera, Globe2, Phone, Mail, MapPin,
  Loader2, Save, ArrowLeft, Instagram, Linkedin,
  MessageCircle, Users, Calendar, Languages, Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/agency/edit")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Modifier mon agence — Diashubb" }] }),
  component: AgencyEdit,
});

const COUNTRIES = [
  { code: "US", name: "United States" }, { code: "CA", name: "Canada" },
  { code: "FR", name: "France" }, { code: "GB", name: "United Kingdom" },
  { code: "SN", name: "Sénégal" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroun" }, { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" }, { code: "ML", name: "Mali" },
  { code: "BF", name: "Burkina Faso" }, { code: "GN", name: "Guinée" },
  { code: "MA", name: "Maroc" }, { code: "TN", name: "Tunisie" },
  { code: "DZ", name: "Algérie" }, { code: "EG", name: "Égypte" },
  { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" }, { code: "RW", name: "Rwanda" },
  { code: "ZA", name: "South Africa" },
];

const SPECIALTIES_LIST = [
  "Résidentiel", "Commercial", "Terrain", "Luxe", "Investissement",
  "Diaspora", "Promotion", "Location", "Gestion locative", "Neuf",
  "Rénovation", "Industrial", "Hôtelier", "FHA/VA Loans", "First-time buyers",
];

const LANGUAGES_LIST = ["FR", "EN", "AR", "ES", "PT", "WO", "HA", "SW", "AM"];

type AgencyForm = {
  name: string;
  legal_name: string;
  registration_number: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  whatsapp: string;
  linkedin: string;
  description: string;
  founded_year: string;
  team_size: string;
  specialties: string[];
  languages: string[];
  countries_operating: string[];
};

function AgencyEdit() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Logo upload
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<AgencyForm>({
    name: "", legal_name: "", registration_number: "",
    country: "CI", city: "", address: "",
    phone: "", email: "", website: "",
    whatsapp: "", linkedin: "",
    description: "", founded_year: "", team_size: "",
    specialties: [], languages: [], countries_operating: [],
  });

  // Charger l'agence existante
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error || !data) {
        // Pas d'agence → rediriger vers register
        navigate({ to: "/agency/register" });
        return;
      }

      setAgencyId(data.id);
      setLogoUrl(data.logo_url);
      setCoverUrl(data.cover_photo_url);
      setForm({
        name: data.name ?? "",
        legal_name: data.legal_name ?? "",
        registration_number: data.registration_number ?? "",
        country: data.country ?? "CI",
        city: data.city ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        whatsapp: data.whatsapp ?? "",
        linkedin: data.linkedin ?? "",
        description: data.description ?? "",
        founded_year: data.founded_year ? String(data.founded_year) : "",
        team_size: data.team_size ? String(data.team_size) : "",
        specialties: data.specialties ?? [],
        languages: data.languages ?? [],
        countries_operating: data.countries_operating ?? [],
      });
      setLoading(false);
    })();
  }, [user, navigate]);

  const set = <K extends keyof AgencyForm>(k: K, v: AgencyForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (key: "specialties" | "languages" | "countries_operating", val: string) => {
    setForm((f) => {
      const arr = f[key] as string[];
      return {
        ...f,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  // Upload image vers Supabase Storage
  const uploadImage = async (
    file: File,
    bucket: string,
    path: string,
    onDone: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error(fr ? "Fichier image requis" : "Image file required");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(fr ? "Image trop lourde (max 5MB)" : "Image too large (max 5MB)");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${path}/${user!.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    onDone(publicUrl);
    setUploading(false);
    toast.success(fr ? "Image uploadée ✓" : "Image uploaded ✓");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(
      file, "agency-assets", "logos",
      (url) => setLogoUrl(url),
      setUploadingLogo
    );
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage(
      file, "agency-assets", "covers",
      (url) => setCoverUrl(url),
      setUploadingCover
    );
  };

  const save = async () => {
    if (!agencyId) return;
    if (!form.name.trim()) {
      toast.error(fr ? "Le nom est requis" : "Name is required");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      legal_name: form.legal_name.trim() || null,
      registration_number: form.registration_number.trim() || null,
      country: form.country,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      linkedin: form.linkedin.trim() || null,
      description: form.description.trim() || null,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      team_size: form.team_size ? Number(form.team_size) : null,
      specialties: form.specialties,
      languages: form.languages,
      countries_operating: form.countries_operating,
      logo_url: logoUrl,
      cover_photo_url: coverUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("agencies")
      .update(payload)
      .eq("id", agencyId);

    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(fr ? "Profil mis à jour ✓" : "Profile updated ✓");
      navigate({ to: "/agency/dashboard" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/agency/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Building2 size={22} style={{ color: "var(--tf-blue)" }} />
            {fr ? "Modifier le profil de l'agence" : "Edit agency profile"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fr ? "Les modifications sont visibles immédiatement" : "Changes are visible immediately"}
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── LOGO + COVER ── */}
        <Section title={fr ? "Identité visuelle" : "Visual identity"}>
          {/* Cover photo */}
          <div className="relative h-32 rounded-xl overflow-hidden bg-muted border border-border cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}>
            {coverUrl
              ? <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  {fr ? "Photo de couverture" : "Cover photo"}
                </div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium gap-2">
              {uploadingCover
                ? <Loader2 size={16} className="animate-spin" />
                : <><Camera size={16} /> {fr ? "Changer" : "Change"}</>
              }
            </div>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleCoverChange} />

          {/* Logo */}
          <div className="flex items-end gap-4 -mt-10 ml-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-card bg-muted cursor-pointer group shrink-0"
              onClick={() => logoInputRef.current?.click()}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
                    style={{ background: "var(--tf-blue)" }}>
                    {form.name.slice(0, 2).toUpperCase() || "AG"}
                  </div>
              }
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingLogo
                  ? <Loader2 size={14} className="animate-spin text-white" />
                  : <Camera size={14} className="text-white" />
                }
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={handleLogoChange} />
            <div className="pb-2">
              <button onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-xs text-primary hover:underline disabled:opacity-50">
                {uploadingLogo
                  ? (fr ? "Upload en cours…" : "Uploading…")
                  : (fr ? "Changer le logo" : "Change logo")}
              </button>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {fr ? "PNG ou JPG · max 5MB" : "PNG or JPG · max 5MB"}
              </p>
            </div>
          </div>
        </Section>

        {/* ── IDENTITÉ ── */}
        <Section title={fr ? "Identité de l'agence" : "Agency identity"}>
          <Field label={fr ? "Nom commercial *" : "Trade name *"}>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className={inputCls} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? "Raison sociale" : "Legal name"}>
              <input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)}
                className={inputCls} />
            </Field>
            <Field label={fr ? "N° enregistrement / RCCM / EIN" : "Registration / RCCM / EIN"}>
              <input value={form.registration_number}
                onChange={(e) => set("registration_number", e.target.value)}
                className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label={fr ? "Année de création" : "Founded year"}>
              <input type="number" value={form.founded_year}
                onChange={(e) => set("founded_year", e.target.value)}
                placeholder="2018" min="1900" max={new Date().getFullYear()}
                className={inputCls} />
            </Field>
            <Field label={fr ? "Taille équipe" : "Team size"}>
              <input type="number" value={form.team_size}
                onChange={(e) => set("team_size", e.target.value)}
                placeholder="5" min="1" className={inputCls} />
            </Field>
            <Field label={fr ? "Pays principal *" : "Main country *"}>
              <select value={form.country} onChange={(e) => set("country", e.target.value)}
                className={inputCls}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? "Ville" : "City"}>
              <input value={form.city} onChange={(e) => set("city", e.target.value)}
                className={inputCls} />
            </Field>
            <Field label={fr ? "Adresse" : "Address"}>
              <input value={form.address} onChange={(e) => set("address", e.target.value)}
                className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ── CONTACT ── */}
        <Section title={fr ? "Contact" : "Contact"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? "Téléphone *" : "Phone *"} icon={<Phone size={13} />}>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="+225 07 000 0000" className={inputCls} />
            </Field>
            <Field label="Email *" icon={<Mail size={13} />}>
              <input type="email" value={form.email}
                onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label={fr ? "Site web" : "Website"} icon={<Globe2 size={13} />}>
            <input value={form.website} onChange={(e) => set("website", e.target.value)}
              placeholder="https://monagence.com" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp" icon={<MessageCircle size={13} />}>
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+225 07 000 0000" className={inputCls} />
            </Field>
            <Field label="LinkedIn" icon={<Linkedin size={13} />}>
              <input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/…" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ── DESCRIPTION ── */}
        <Section title={fr ? "Présentation" : "About"}>
          <Field label={fr ? "Description de l'agence" : "Agency description"}>
            <textarea value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5} maxLength={2000}
              placeholder={fr
                ? "Décrivez votre agence : spécialités, marchés couverts, approche client, années d'expérience…"
                : "Describe your agency: specialties, markets covered, client approach, years of experience…"}
              className={inputCls + " resize-none"} />
            <p className="text-[11px] text-muted-foreground text-right mt-1">
              {form.description.length}/2000
            </p>
          </Field>
        </Section>

        {/* ── SPÉCIALITÉS ── */}
        <Section title={fr ? "Spécialités" : "Specialties"} icon={<Briefcase size={14} />}>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES_LIST.map((s) => {
              const on = form.specialties.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleArray("specialties", s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? "text-white border-transparent"
                      : "border-border bg-muted text-muted-foreground hover:border-primary"
                  }`}
                  style={on ? { background: "var(--tf-blue)" } : undefined}>
                  {s}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── LANGUES ── */}
        <Section title={fr ? "Langues parlées" : "Languages spoken"} icon={<Languages size={14} />}>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES_LIST.map((l) => {
              const on = form.languages.includes(l);
              return (
                <button key={l} type="button" onClick={() => toggleArray("languages", l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? "text-white border-transparent"
                      : "border-border bg-muted text-muted-foreground hover:border-primary"
                  }`}
                  style={on ? { background: "var(--tf-green)" } : undefined}>
                  {l}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── PAYS D'OPÉRATION ── */}
        <Section title={fr ? "Pays d'intervention" : "Countries of operation"}
          icon={<MapPin size={14} />}>
          <p className="text-xs text-muted-foreground mb-2">
            {fr ? "Sélectionnez tous les pays où votre agence opère" : "Select all countries where your agency operates"}
          </p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const on = form.countries_operating.includes(c.code);
              return (
                <button key={c.code} type="button"
                  onClick={() => toggleArray("countries_operating", c.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? "text-white border-transparent"
                      : "border-border bg-muted text-muted-foreground hover:border-primary"
                  }`}
                  style={on ? { background: "var(--tf-navy, #0A3060)" } : undefined}>
                  {c.code} · {c.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── ACTIONS ── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link to="/agency/dashboard"
            className="px-5 py-2.5 rounded-full bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground">
            {fr ? "Annuler" : "Cancel"}
          </Link>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--tf-blue)" }}>
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> {fr ? "Enregistrement…" : "Saving…"}</>
              : <><Save size={15} /> {fr ? "Enregistrer les modifications" : "Save changes"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composants UI ──

const inputCls = "w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm";

function Section({
  title, icon, children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, icon, children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
