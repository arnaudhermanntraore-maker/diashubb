import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registerAgency } from "@/server/agencies.functions";

export const Route = createFileRoute("/agency/register")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Enregistrer votre agence — TerraFrique" },
      { name: "description", content: "Inscrivez votre agence immobilière sur TerraFrique : vérification documentaire, validation manuelle, accès au tableau de bord agence." },
    ],
  }),
  component: AgencyRegister,
});

// ISO 3166-1 alpha-2 codes (complete list)
const ISO_COUNTRY_CODES = [
  "AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ",
  "BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BV","BR",
  "IO","BN","BG","BF","BI","CV","KH","CM","CA","KY","CF","TD","CL","CN","CX","CC",
  "CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO",
  "EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO","FJ","FI","FR","GF","PF","TF",
  "GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY",
  "HT","HM","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM",
  "JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY",
  "LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX",
  "FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI",
  "NE","NG","NU","NF","MK","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH",
  "PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC",
  "WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS",
  "SS","ES","LK","SD","SR","SJ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK",
  "TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UM","UY","UZ","VU",
  "VE","VN","VG","VI","WF","EH","YE","ZM","ZW",
] as const;

const ALL_COUNTRY_CODES = ISO_COUNTRY_CODES as unknown as [string, ...string[]];

const ClientSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  legal_name: z.string().trim().max(180).optional(),
  registration_number: z.string().trim().max(80).optional(),
  country: z.enum(ALL_COUNTRY_CODES, { message: "Pays invalide" }),
  city: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  phone: z.string().trim().min(6, "Téléphone trop court").max(40).regex(/^[+0-9 ()\-.]+$/, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide").max(255),
  website: z.string().trim().url("URL invalide").max(255).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { message: "Vous devez accepter les conditions" }),
});

type FormState = z.input<typeof ClientSchema>;

function AgencyRegister() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr") ?? true;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingAgency, setCheckingAgency] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // If user already owns an agency, send them to the dashboard immediately.
  // Once `redirecting` is true, no further state updates or fetches occur.
  useEffect(() => {
    if (redirecting) return;
    if (authLoading) return;
    if (!user) {
      setCheckingAgency(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (!error && data) {
        // Mark redirecting BEFORE navigate; cancel any further work.
        active = false;
        setRedirecting(true);
        navigate({ to: "/agency/dashboard", replace: true });
        return;
      }
      setCheckingAgency(false);
    })();
    return () => { active = false; };
  }, [authLoading, user, navigate, redirecting]);

  const [form, setForm] = useState<FormState>({
    name: "",
    legal_name: "",
    registration_number: "",
    country: "" as unknown as FormState["country"],
    city: "",
    address: "",
    phone: "",
    email: user?.email ?? "",
    website: "",
    description: "",
    consent: false as unknown as true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const countryOptions = useMemo(() => {
    const dn = typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([fr ? "fr" : "en"], { type: "region" })
      : null;
    return ISO_COUNTRY_CODES
      .map((code) => ({ code, name: (dn?.of(code) ?? code) as string }))
      .sort((a, b) => a.name.localeCompare(b.name, fr ? "fr" : "en"));
  }, [fr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading || checkingAgency || redirecting || busy) return;
    setErrors({});

    const parsed = ClientSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      toast.error(fr ? "Veuillez corriger les erreurs du formulaire" : "Please fix the form errors");
      return;
    }

    setBusy(true);
    try {
      const { consent: _consent, ...payload } = parsed.data;
      const res = await registerAgency({ data: payload });
      if (!res.ok) {
        if (res.error === "already_registered") {
          toast.info(fr ? "Vous avez déjà une agence enregistrée" : "You already have a registered agency");
          navigate({ to: "/agency/dashboard" });
        } else {
          toast.error(res.error || (fr ? "Erreur" : "Error"));
        }
        return;
      }
      setDone(true);
      toast.success(fr ? "Demande envoyée" : "Application submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Server error");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || checkingAgency || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full grid place-items-center bg-primary/10">
            <CheckCircle2 className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold">
            {fr ? "Demande envoyée" : "Application submitted"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr
              ? "Notre équipe va vérifier les informations de votre agence (24–72h ouvrées). Vous recevrez un email dès la validation."
              : "Our team will review your agency details (24–72 business hours). You'll receive an email once verified."}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Link to="/agency/dashboard" className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {fr ? "Mon espace agence" : "Agency dashboard"}
            </Link>
            <Link to="/" className="px-5 py-2.5 rounded-full bg-muted text-sm font-semibold">
              {fr ? "Accueil" : "Home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--tf-blue)" }}>
          <Building2 className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            {fr ? "Inscrire votre agence immobilière" : "Register your real estate agency"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr ? "Vérification documentaire et validation manuelle par notre équipe." : "Document verification and manual review by our team."}
          </p>
        </div>
      </div>

      <div className="my-5 flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
        <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-muted-foreground">
          {fr
            ? "Toutes les informations sont validées côté serveur. Une fois votre agence vérifiée, vous pourrez publier des annonces certifiées TerraFrique."
            : "All information is validated server-side. Once verified, you can publish TerraFrique-certified listings."}
        </p>
      </div>

      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft space-y-5">
        <fieldset
          disabled={authLoading || checkingAgency || redirecting || busy}
          className="space-y-5 contents disabled:opacity-60 disabled:pointer-events-none"
        >
        <Section title={fr ? "Identité de l'agence" : "Agency identity"}>
          <Field label={fr ? "Nom commercial *" : "Trade name *"} error={errors.name}>
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} required />
          </Field>
          <Field label={fr ? "Raison sociale" : "Legal name"} error={errors.legal_name}>
            <input value={form.legal_name} onChange={(e) => setField("legal_name", e.target.value)} className={inputCls} />
          </Field>
          <Field label={fr ? "N° d'enregistrement / RCCM / EIN" : "Registration / RCCM / EIN number"} error={errors.registration_number}>
            <input value={form.registration_number} onChange={(e) => setField("registration_number", e.target.value)} className={inputCls} />
          </Field>
        </Section>

        <Section title={fr ? "Localisation" : "Location"}>
          <Field label={fr ? "Pays *" : "Country *"} error={errors.country} htmlFor="agency-country">
            <select
              id="agency-country"
              name="country"
              value={form.country}
              onChange={(e) => setField("country", e.target.value as FormState["country"])}
              className={inputCls}
              required
              autoComplete="country"
              aria-label={fr ? "Pays de l'agence" : "Agency country"}
              aria-required="true"
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? "agency-country-error" : undefined}
            >
              <option value="">{fr ? "Sélectionner un pays" : "Select a country"}</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={fr ? "Ville" : "City"} error={errors.city}>
              <input value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputCls} />
            </Field>
            <Field label={fr ? "Adresse" : "Address"} error={errors.address}>
              <input value={form.address} onChange={(e) => setField("address", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title={fr ? "Contact" : "Contact"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={fr ? "Téléphone *" : "Phone *"} error={errors.phone}>
              <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+221 77 000 0000" className={inputCls} required />
            </Field>
            <Field label="Email *" error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} required />
            </Field>
          </div>
          <Field label={fr ? "Site web" : "Website"} error={errors.website}>
            <input value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
        </Section>

        <Section title={fr ? "Présentation" : "About"}>
          <Field label={fr ? "Description de l'agence" : "Agency description"} error={errors.description}>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              maxLength={2000}
              className={inputCls + " resize-none"}
              placeholder={fr ? "Spécialités, années d'expérience, zones couvertes…" : "Specialties, years of experience, coverage areas…"}
            />
          </Field>
        </Section>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={!!form.consent}
            onChange={(e) => setField("consent", e.target.checked as unknown as true)}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            {fr
              ? "Je certifie l'exactitude des informations et accepte le contrôle documentaire TerraFrique."
              : "I certify the accuracy of the information and accept TerraFrique document verification."}
          </span>
        </label>
        {errors.consent && <p className="text-xs text-destructive -mt-3">{errors.consent}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/agency/dashboard" className="px-5 py-2.5 rounded-full bg-muted text-sm font-semibold">
            {fr ? "Annuler" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={busy || authLoading || checkingAgency || redirecting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--tf-blue)" }}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {fr ? "Envoyer pour vérification" : "Submit for verification"}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 bg-muted rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
