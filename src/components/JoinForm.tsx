import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitPartnerApplication } from "@/server/partner-applications.functions";

interface Props {
  kind: "contractor" | "broker" | "agent" | "surveyor";
  specialties?: string[];
  specialtyLabel: string;
}

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const ClientSchema = z.object({
  name: z.string().trim().min(2, "tooShort").max(120, "tooLong"),
  email: z.string().trim().email("invalidEmail").max(255),
  phone: z.string().trim().min(6, "invalidPhone").max(40).regex(/^[+\d\s().-]+$/, "invalidPhone"),
  specialty: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  experience: z.string().regex(/^\d{0,2}$/, "invalidExperience").optional(),
  license: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(2000, "bioTooLong").optional(),
});

export function JoinForm({ kind, specialties, specialtyLabel }: Props) {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { user } = useAuth();
  const submitFn = useServerFn(submitPartnerApplication);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", email: user?.email ?? "", phone: "",
    specialty: specialties?.[0] ?? "", city: "", region: "",
    experience: "", license: "", bio: "",
  });

  const u = (k: keyof typeof form, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const msg = (code: string) => {
    const map: Record<string, [string, string]> = {
      tooShort: ["Trop court (min. 2 caractères)", "Too short (min. 2 chars)"],
      tooLong: ["Trop long", "Too long"],
      invalidEmail: ["E-mail invalide", "Invalid email"],
      invalidPhone: ["Téléphone invalide", "Invalid phone number"],
      invalidExperience: ["Années invalides", "Invalid years"],
      bioTooLong: ["Bio trop longue (max. 2000)", "Bio too long (max 2000)"],
      fileType: ["Format non supporté (PDF, PNG, JPG, WEBP)", "Unsupported file (PDF, PNG, JPG, WEBP)"],
      fileSize: ["Fichier > 5 Mo", "File exceeds 5MB"],
    };
    const m = map[code]; return m ? (fr ? m[0] : m[1]) : code;
  };

  const onFile = (f: File | null) => {
    setErrors((e) => { const n = { ...e }; delete n.file; return n; });
    if (!f) { setFile(null); return; }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrors((e) => ({ ...e, file: "fileType" }));
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setErrors((e) => ({ ...e, file: "fileSize" }));
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ClientSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as string;
        if (k && !fieldErrs[k]) fieldErrs[k] = issue.message;
      }
      setErrors((prev) => ({ ...prev, ...fieldErrs }));
      toast.error(fr ? "Vérifiez les champs en rouge" : "Please check the highlighted fields");
      return;
    }
    if (errors.file) {
      toast.error(msg(errors.file));
      return;
    }

    setBusy(true);
    try {
      let documentUrl = "";
      if (file) {
        const folder = user?.id ?? "anon";
        const path = `${folder}/${kind}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("partner-docs").upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("partner-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
        documentUrl = signed?.signedUrl ?? path;
      }

      await submitFn({
        data: {
          kind,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          specialty: form.specialty.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
          experience_years: form.experience ? Number(form.experience) : undefined,
          license_number: form.license.trim(),
          bio: form.bio.trim(),
          document_url: documentUrl,
          user_id: user?.id,
        },
      });

      setDone(true);
      toast.success(fr ? "Demande reçue !" : "Application received!");
    } catch (err) {
      console.error(err);
      toast.error(fr ? "Erreur — réessayez" : "Error — please retry");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mt-8 bg-card border border-border rounded-2xl p-8 text-center">
        <CheckCircle2 size={42} className="mx-auto text-tf-green" />
        <h2 className="text-xl font-display font-semibold mt-3">{fr ? "Demande reçue !" : "Application received!"}</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          {fr ? "Notre équipe vous contacte sous 48h pour finaliser la vérification." : "Our team will contact you within 48h to complete verification."}
        </p>
        <Link to="/" className="inline-flex mt-6 px-5 py-2 rounded-full bg-tf-blue text-white text-sm">{fr ? "Retour à l'accueil" : "Back home"}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label={fr ? "Nom complet *" : "Full name *"} error={errors.name && msg(errors.name)}>
          <input value={form.name} onChange={(e) => u("name", e.target.value)} maxLength={120} className="input" aria-invalid={!!errors.name} />
        </Field>
        <Field label={fr ? "E-mail *" : "Email *"} error={errors.email && msg(errors.email)}>
          <input type="email" value={form.email} onChange={(e) => u("email", e.target.value)} maxLength={255} className="input" aria-invalid={!!errors.email} />
        </Field>
        <Field label={fr ? "Téléphone *" : "Phone *"} error={errors.phone && msg(errors.phone)}>
          <input value={form.phone} onChange={(e) => u("phone", e.target.value)} maxLength={40} className="input" aria-invalid={!!errors.phone} />
        </Field>
        <Field label={specialtyLabel}>
          {specialties ? (
            <select value={form.specialty} onChange={(e) => u("specialty", e.target.value)} className="input">
              {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={form.specialty} onChange={(e) => u("specialty", e.target.value)} maxLength={120} className="input" />
          )}
        </Field>
        <Field label={fr ? "Ville" : "City"}><input value={form.city} onChange={(e) => u("city", e.target.value)} maxLength={120} className="input" /></Field>
        <Field label={fr ? "État / Pays" : "State / Country"}><input value={form.region} onChange={(e) => u("region", e.target.value)} maxLength={120} className="input" /></Field>
        <Field label={fr ? "Années d'expérience" : "Years of experience"} error={errors.experience && msg(errors.experience)}>
          <input type="number" min="0" max="80" value={form.experience} onChange={(e) => u("experience", e.target.value)} className="input" />
        </Field>
        <Field label={fr ? "Numéro de licence (optionnel)" : "License number (optional)"}>
          <input value={form.license} onChange={(e) => u("license", e.target.value)} maxLength={80} className="input" />
        </Field>
      </div>
      <Field label={fr ? "Bio" : "Brief bio"} error={errors.bio && msg(errors.bio)}>
        <textarea rows={4} value={form.bio} onChange={(e) => u("bio", e.target.value)} maxLength={2000} className="input" />
      </Field>

      <Field
        label={fr ? "Justificatif (licence, certificat) — PDF/PNG/JPG, 5 Mo max" : "Supporting document (license, certificate) — PDF/PNG/JPG, max 5MB"}
        error={errors.file && msg(errors.file)}
      >
        <label className="flex items-center gap-3 px-3 py-2.5 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/70">
          <Upload size={16} />
          <span className="truncate flex-1">{file ? file.name : (fr ? "Choisir un fichier…" : "Choose a file…")}</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </Field>

      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-tf-green text-white text-sm font-semibold disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin" />}
        {fr ? "Envoyer la demande" : "Submit application"} →
      </button>
      <style>{`.input{width:100%;padding:.55rem .75rem;border-radius:.5rem;background:hsl(var(--muted)); outline:none; font-size:.875rem} .input[aria-invalid="true"]{outline:2px solid hsl(var(--destructive))}`}</style>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
      {error && <span className="block mt-1 text-xs text-destructive">{error}</span>}
    </label>
  );
}
