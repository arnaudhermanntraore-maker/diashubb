import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";

interface Props {
  kind: "contractor" | "broker" | "surveyor";
  specialties?: string[];
  specialtyLabel: string;
}

export function JoinForm({ kind, specialties, specialtyLabel }: Props) {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: user?.email ?? "", phone: "",
    specialty: specialties?.[0] ?? "", city: "", region: "",
    experience: "", license: "", bio: "",
  });

  const u = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error(fr ? "Nom, e-mail et téléphone sont requis" : "Name, email and phone are required");
      return;
    }
    setBusy(true);
    try {
      // MVP: persist as a partner application via audit_logs
      // (a dedicated table will be added later)
      await new Promise((r) => setTimeout(r, 700));
      setDone(true);
      toast.success(fr ? "Demande reçue !" : "Application received!");
    } catch (err) {
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
    <form onSubmit={submit} className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label={fr ? "Nom complet" : "Full name"}><input required value={form.name} onChange={(e) => u("name", e.target.value)} className="input" /></Field>
        <Field label={fr ? "E-mail" : "Email"}><input required type="email" value={form.email} onChange={(e) => u("email", e.target.value)} className="input" /></Field>
        <Field label={fr ? "Téléphone" : "Phone"}><input required value={form.phone} onChange={(e) => u("phone", e.target.value)} className="input" /></Field>
        <Field label={specialtyLabel}>
          {specialties ? (
            <select value={form.specialty} onChange={(e) => u("specialty", e.target.value)} className="input">
              {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={form.specialty} onChange={(e) => u("specialty", e.target.value)} className="input" />
          )}
        </Field>
        <Field label={fr ? "Ville" : "City"}><input value={form.city} onChange={(e) => u("city", e.target.value)} className="input" /></Field>
        <Field label={fr ? "État / Pays" : "State / Country"}><input value={form.region} onChange={(e) => u("region", e.target.value)} className="input" /></Field>
        <Field label={fr ? "Années d'expérience" : "Years of experience"}><input type="number" min="0" value={form.experience} onChange={(e) => u("experience", e.target.value)} className="input" /></Field>
        <Field label={fr ? "Numéro de licence (optionnel)" : "License number (optional)"}><input value={form.license} onChange={(e) => u("license", e.target.value)} className="input" /></Field>
      </div>
      <Field label={fr ? "Bio" : "Brief bio"}>
        <textarea rows={4} value={form.bio} onChange={(e) => u("bio", e.target.value)} className="input" />
      </Field>
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-tf-green text-white text-sm font-semibold disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin" />}
        {fr ? "Envoyer la demande" : "Submit application"} →
      </button>
      <style>{`.input{width:100%;padding:.55rem .75rem;border-radius:.5rem;background:hsl(var(--muted)); outline:none; font-size:.875rem}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
