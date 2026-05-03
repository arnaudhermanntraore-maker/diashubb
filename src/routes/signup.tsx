import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMapboxToken } from "@/server/config.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type ProfileKey = "buyer" | "diaspora" | "agent" | "contractor" | "broker" | "surveyor";

const COUNTRIES: { code: string; flag: string; name: string; dial: string; lang: "fr" | "en" }[] = [
  { code: "US", flag: "🇺🇸", name: "United States", dial: "+1", lang: "en" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire", dial: "+225", lang: "fr" },
  { code: "SN", flag: "🇸🇳", name: "Sénégal", dial: "+221", lang: "fr" },
  { code: "GH", flag: "🇬🇭", name: "Ghana", dial: "+233", lang: "en" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria", dial: "+234", lang: "en" },
  { code: "MA", flag: "🇲🇦", name: "Maroc", dial: "+212", lang: "fr" },
  { code: "CM", flag: "🇨🇲", name: "Cameroun", dial: "+237", lang: "fr" },
  { code: "KE", flag: "🇰🇪", name: "Kenya", dial: "+254", lang: "en" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda", dial: "+250", lang: "en" },
  { code: "FR", flag: "🇫🇷", name: "France", dial: "+33", lang: "fr" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "+44", lang: "en" },
  { code: "CA", flag: "🇨🇦", name: "Canada", dial: "+1", lang: "en" },
];

function SignupPage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [profile, setProfile] = useState<ProfileKey>("buyer");
  const [info, setInfo] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "US", city: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [pwd, setPwd] = useState({ password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [checks, setChecks] = useState({ terms: false, fair: false, news: true });
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpAttempts, setOtpAttempts] = useState(3);
  const [seconds, setSeconds] = useState(300);
  const [demoCode, setDemoCode] = useState("");
  const [geoText, setGeoText] = useState<string | null>(null);
  const [geoErr, setGeoErr] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Geolocation in step 2
  useEffect(() => {
    if (step !== 2 || geoText !== null || geoErr) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) { setGeoErr(true); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { token } = await getMapboxToken();
        if (!token) throw new Error();
        const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?access_token=${token}&types=place,country`);
        const j = await r.json();
        const place = j.features?.find((f: any) => f.place_type?.includes("place"));
        const country = j.features?.find((f: any) => f.place_type?.includes("country"));
        const cc = (country?.properties?.short_code || "us").toUpperCase();
        const cityName = place?.text || "";
        setGeoText(`${country?.text || ""} · ${cityName}`);
        setInfo((p) => ({ ...p, country: COUNTRIES.find(c => c.code === cc)?.code || p.country, city: p.city || cityName }));
      } catch { setGeoErr(true); }
    }, () => setGeoErr(true), { timeout: 6000 });
  }, [step, geoText, geoErr]);

  // OTP countdown
  useEffect(() => {
    if (step !== 4) return;
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step, seconds]);

  const country = COUNTRIES.find((c) => c.code === info.country) || COUNTRIES[0];

  const T = (en: string, frTxt: string) => (fr ? frTxt : en);

  const PROFILES: { key: ProfileKey; bg: string; stroke: string; svg: React.ReactNode; name: [string, string]; desc: [string, string]; hint: [string, string] }[] = [
    { key: "buyer", bg: "#E6F1FB", stroke: "#185FA5", svg: <PathHouse />, name: ["Homebuyer", "Acheteur"], desc: ["I'm looking to buy or rent in the US", "J'achète ou loue aux USA"], hint: ["Access to MLS listings, AI score, mortgage matcher and alerts.", "Accès aux annonces MLS, score IA, simulateur prêt et alertes."] },
    { key: "diaspora", bg: "#E1F5EE", stroke: "#0F6E56", svg: <PathGlobe />, name: ["Diaspora investor", "Investisseur diaspora"], desc: ["US home + Africa investment", "Maison USA + investissement Afrique"], hint: ["US + Africa dual dashboard, transfer tool and bi-continental portfolio.", "Dashboard bi-continental, outil de transfert et portefeuille USA + Afrique."] },
    { key: "agent", bg: "#FAEEDA", stroke: "#854F0B", svg: <PathBuilding />, name: ["Agent / Seller", "Agent / Vendeur"], desc: ["I list and sell properties", "Je publie et vends des biens"], hint: ["Listing tools, boost annonces, verified agency badge.", "Outils de publication, boost, badge agence certifiée."] },
    { key: "contractor", bg: "#EAF3DE", stroke: "#3B6D11", svg: <PathTool />, name: ["Contractor", "Artisan"], desc: ["I offer renovation services", "Je propose des services de rénovation"], hint: ["Job marketplace, background check badge and secure payments.", "Marketplace missions, badge vérifié et paiements sécurisés."] },
    { key: "broker", bg: "#EEEDFE", stroke: "#534AB7", svg: <PathStar />, name: ["Broker", "Démarcheur"], desc: ["I connect buyers and sellers", "Je connecte acheteurs et vendeurs"], hint: ["Commission tracker, referral link, Bronze to Platinum level system.", "Suivi commissions, lien de parrainage, système Bronze → Platine."] },
    { key: "surveyor", bg: "#FAECE7", stroke: "#993C1D", svg: <PathCompass />, name: ["Surveyor / Notary", "Géomètre / Notaire"], desc: ["I certify and verify properties", "Je certifie et vérifie les biens"], hint: ["Certification badge, mission booking and document verification tools.", "Badge certification, réservation missions et vérification documents."] },
  ];

  const selectedProfile = PROFILES.find((p) => p.key === profile)!;

  const pwScore = useMemo(() => {
    const p = pwd.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[0-9]/.test(p) && /[a-zA-Z]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    if (p.length === 0) return 0;
    return Math.max(1, s);
  }, [pwd.password]);

  const requiredFilled = info.firstName.trim() && info.lastName.trim() && /^\S+@\S+\.\S+$/.test(info.email) && info.phone.trim() && info.country && info.city.trim();
  const fieldErr = (k: keyof typeof info, val: string) => {
    if (!touched[k] && !showSummary) return null;
    if (!val.trim()) return T("This field is required", "Ce champ est obligatoire");
    if (k === "email" && !/^\S+@\S+\.\S+$/.test(val)) return T("Please enter a valid email address", "Veuillez saisir une adresse email valide");
    return null;
  };

  const submitAccount = async () => {
    setShowSummary(true);
    const errs: string[] = [];
    if (pwd.password.length < 8) errs.push(T("Password must be at least 8 characters", "Mot de passe min. 8 caractères"));
    if (pwd.password !== pwd.confirm) errs.push(T("Passwords do not match", "Mots de passe différents"));
    if (!checks.terms) errs.push(T("Please accept the Terms of Service", "Acceptez les conditions"));
    if (!checks.fair) errs.push(T("Please acknowledge the Fair Housing Act", "Reconnaissez le Fair Housing Act"));
    if (errs.length) { toast.error(errs.join(" • ")); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: info.email,
      password: pwd.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: `${info.firstName} ${info.lastName}`.trim(),
          first_name: info.firstName,
          last_name: info.lastName,
          phone: `${country.dial} ${info.phone}`,
          country_code: info.country,
          city: info.city,
          lang_pref: country.lang,
          profile_role: profile,
          newsletter: checks.news,
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    // Demo OTP — any code works, but show a 6-digit hint for testing
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setDemoCode(code);
    toast.success(T(`Demo code: ${code}`, `Code démo : ${code}`));
    setSeconds(300);
    setStep(4);
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setBusy(true);
    // Demo verify — accept any 6-digit code
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    if (code !== demoCode && demoCode) {
      const left = otpAttempts - 1;
      setOtpAttempts(left);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      if (left <= 0) toast.error(T("Too many attempts. Please request a new code.", "Trop de tentatives. Demandez un nouveau code."));
      else toast.error(T(`Incorrect code. ${left} attempts remaining.`, `Code incorrect. ${left} tentatives restantes.`));
      return;
    }
    // Award TerraCoins on profile
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) await supabase.from("profiles").update({ terracoins: 100, country: info.country, lang_pref: country.lang }).eq("id", u.user.id);
    } catch {}
    setStep(5);
  };

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ============ STEPS ============
  return (
    <div className="min-h-screen flex" style={{ background: "#fff" }}>
      {/* LEFT */}
      <aside className="hidden md:flex flex-col justify-between" style={{ width: 220, background: "#0C447C", padding: 20, color: "white" }}>
        <div>
          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "#185FA5" }} className="flex items-center justify-center">
              <PathHouse stroke="white" />
            </div>
            <div className="leading-tight">
              <div style={{ fontSize: 13, fontWeight: 700 }}>TerraFrique</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Global</div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            {[
              { svg: <PathHouse stroke="white" />, t: T("US & Africa in one place", "USA & Afrique en un seul endroit"), s: T("Buy, invest and manage across two continents", "Achetez, investissez et gérez sur deux continents") },
              { svg: <PathShield stroke="white" />, t: T("AI-verified documents", "Documents vérifiés par IA"), s: T("Every title deed checked before you see it", "Chaque titre foncier vérifié avant publication") },
              { svg: <PathCheck stroke="white" />, t: T("Free to join", "Gratuit pour toujours"), s: T("No credit card, no commitment", "Sans carte bancaire") },
            ].map((f, i) => (
              <div key={i} className="flex gap-2" style={{ marginBottom: 14 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.1)" }} className="flex items-center justify-center shrink-0">{f.svg}</div>
                <div className="leading-tight">
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{f.t}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{f.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1D9E75" }} className="flex items-center justify-center shrink-0">
            <PathStar stroke="white" />
          </div>
          <div className="leading-tight">
            <div style={{ fontSize: 12, fontWeight: 700 }}>{T("100 TerraCoins on signup", "100 TerraCoins offerts")}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{T("Worth $5 · credited instantly", "Valeur $5 · crédités immédiatement")}</div>
          </div>
        </div>
      </aside>

      {/* RIGHT */}
      <section className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
        {/* Progress */}
        <div className="flex items-center" style={{ marginBottom: 20, maxWidth: 520 }}>
          {[1, 2, 3, 4].map((n, idx) => {
            const done = step > n || step === 5;
            const active = step === n;
            const bg = done ? "#1D9E75" : active ? "#185FA5" : "#F3F4F6";
            const color = done || active ? "white" : "#9CA3AF";
            const label = [T("Profile", "Profil"), T("Your info", "Infos"), T("Password", "Mot de passe"), T("Verify", "Vérif.")][idx];
            return (
              <div key={n} className="flex items-center" style={{ flex: idx < 3 ? 1 : "none" }}>
                <div className="flex flex-col items-center">
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, color, border: !done && !active ? "0.5px solid #E5E7EB" : "none" }} className="flex items-center justify-center text-xs font-medium">
                    {done ? <PathCheck stroke="white" size={14} /> : n}
                  </div>
                  <div style={{ fontSize: 9, marginTop: 4, color: done || active ? "#185FA5" : "#9CA3AF", fontWeight: done || active ? 700 : 400 }}>{label}</div>
                </div>
                {idx < 3 && <div style={{ flex: 1, height: 1, background: done ? "#1D9E75" : "#E5E7EB", margin: "0 6px", marginBottom: 14, transition: "background 0.3s" }} />}
              </div>
            );
          })}
        </div>

        <div className="max-w-xl" key={step} style={{ animation: "slideIn 0.2s ease" }}>
          <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } } @keyframes pop { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }`}</style>

          {step === 1 && (
            <>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 4 }}>{T("Step 1 of 4", "Étape 1 sur 4")}</div>
              <h1 style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>{T("What's your profile?", "Quel est votre profil ?")}</h1>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>{T("Choose the role that best fits your main activity. You can add more later.", "Choisissez votre rôle principal. Vous pourrez en ajouter d'autres ensuite.")}</p>
              <div className="grid grid-cols-2" style={{ gap: 7, marginBottom: 14 }}>
                {PROFILES.map((p) => {
                  const sel = profile === p.key;
                  return (
                    <button key={p.key} type="button" onClick={() => setProfile(p.key)} style={{ border: sel ? `2px solid ${p.stroke}` : "0.5px solid #E5E7EB", borderRadius: 12, padding: "12px 10px", background: sel ? "#E6F1FB" : "white", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: p.bg, margin: "0 auto 7px" }} className="flex items-center justify-center">
                        {/* clone with stroke */}
                        <span style={{ color: p.stroke }}>{p.svg}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{fr ? p.name[1] : p.name[0]}</div>
                      <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2, lineHeight: 1.4 }}>{fr ? p.desc[1] : p.desc[0]}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ background: "#E6F1FB", border: "0.5px solid #B5D4F4", borderRadius: 8, padding: "8px 11px", fontSize: 12, color: "#0C447C", marginBottom: 14 }}>
                {T("Selected", "Sélectionné")}: {fr ? selectedProfile.name[1] : selectedProfile.name[0]} — {fr ? selectedProfile.hint[1] : selectedProfile.hint[0]}
              </div>
              <button onClick={() => setStep(2)} style={{ width: "100%", background: "#185FA5", color: "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{T("Continue →", "Continuer →")}</button>
              <div className="text-center mt-4 text-xs text-muted-foreground">
                {T("Already have an account?", "Déjà un compte ?")} <Link to="/auth" className="text-tf-blue font-medium">{T("Sign in", "Se connecter")}</Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 4 }}>{T("Step 2 of 4", "Étape 2 sur 4")}</div>
              <h1 style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>{T("Tell us about yourself", "Parlez-nous de vous")}</h1>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>{T("Your location is detected automatically.", "Votre localisation est détectée automatiquement.")}</p>

              <div className="flex items-center gap-1.5" style={{ background: geoErr ? "#FCEBEB" : "#E1F5EE", border: `0.5px solid ${geoErr ? "#F09595" : "#9FE1CB"}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: geoErr ? "#791F1F" : "#085041", marginBottom: 12 }}>
                <PathPin stroke={geoErr ? "#791F1F" : "#0F6E56"} size={13} />
                <span>{geoErr ? T("Location not detected — please select your country manually", "Localisation non détectée — sélectionnez votre pays manuellement") : geoText ? `${T("Location detected", "Localisation")}: ${geoText} · ${T("auto-assigned", "marché assigné")}` : T("Detecting your location…", "Détection en cours…")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <Field label={T("First name", "Prénom")} val={info.firstName} onChange={(v) => setInfo({ ...info, firstName: v })} placeholder="Adjoua" onBlur={() => setTouched({ ...touched, firstName: true })} err={fieldErr("firstName", info.firstName)} />
                <Field label={T("Last name", "Nom")} val={info.lastName} onChange={(v) => setInfo({ ...info, lastName: v })} placeholder="Kouamé" onBlur={() => setTouched({ ...touched, lastName: true })} err={fieldErr("lastName", info.lastName)} />
              </div>
              <Field label={T("Email address", "Adresse email")} type="email" val={info.email} onChange={(v) => setInfo({ ...info, email: v })} placeholder="adjoua@email.com" onBlur={() => setTouched({ ...touched, email: true })} err={fieldErr("email", info.email)} />
              <div className="mt-2">
                <label className="text-xs font-medium text-foreground/80">{T("Phone (for OTP verification)", "Téléphone (pour vérification OTP)")}</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <span style={{ background: "#F3F4F6", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}>{country.flag} {country.dial}</span>
                  <input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} onBlur={() => setTouched({ ...touched, phone: true })} placeholder="(404) 555-0100" className="flex-1 px-3 py-2 rounded-lg" style={{ border: `1.5px solid ${fieldErr("phone", info.phone) ? "#E24B4A" : info.phone && touched.phone ? "#1D9E75" : "#E5E7EB"}`, fontSize: 13 }} />
                </div>
                {fieldErr("phone", info.phone) && <div style={{ color: "#E24B4A", fontSize: 12, marginTop: 2 }}>{fieldErr("phone", info.phone)}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs font-medium">{T("Country of residence", "Pays de résidence")}</label>
                  <select value={info.country} onChange={(e) => setInfo({ ...info, country: e.target.value })} className="w-full px-3 py-2 rounded-lg mt-1" style={{ border: "0.5px solid #E5E7EB", fontSize: 13 }}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <Field label={T("City", "Ville")} val={info.city} onChange={(v) => setInfo({ ...info, city: v })} placeholder="Atlanta" onBlur={() => setTouched({ ...touched, city: true })} err={fieldErr("city", info.city)} />
              </div>

              {showSummary && !requiredFilled && (
                <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#791F1F", marginTop: 12 }}>
                  {T("Please fill in all required fields before continuing.", "Veuillez remplir tous les champs obligatoires avant de continuer.")}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} style={{ border: "0.5px solid #E5E7EB", color: "#6B7280", padding: "9px 16px", borderRadius: 8, fontSize: 13 }}>{T("← Back", "← Retour")}</button>
                <button onClick={() => { setShowSummary(true); setTouched({ firstName: true, lastName: true, email: true, phone: true, city: true }); if (requiredFilled) { setShowSummary(false); setStep(3); } }} style={{ flex: 1, background: "#185FA5", color: "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{T("Continue →", "Continuer →")}</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 4 }}>{T("Step 3 of 4", "Étape 3 sur 4")}</div>
              <h1 style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>{T("Create your password", "Créez votre mot de passe")}</h1>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>{T("At least 8 characters. Mix letters, numbers and symbols.", "Minimum 8 caractères. Mélangez lettres, chiffres et symboles.")}</p>

              <label className="text-xs font-medium">{T("Password", "Mot de passe")}</label>
              <div className="relative mt-1">
                <input type={showPwd ? "text" : "password"} value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} placeholder={T("Min. 8 characters", "Min. 8 caractères")} className="w-full px-3 py-2 pr-10 rounded-lg" style={{ border: "0.5px solid #E5E7EB", fontSize: 13 }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{showPwd ? "🙈" : "👁"}</button>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((s) => {
                  const c = pwScore >= s ? (pwScore === 1 ? "#E24B4A" : pwScore === 2 ? "#EF9F27" : "#1D9E75") : "#E5E7EB";
                  return <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: c }} />;
                })}
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: pwScore === 0 ? "#9CA3AF" : pwScore === 1 ? "#E24B4A" : pwScore === 2 ? "#EF9F27" : "#1D9E75" }}>
                {[T("Enter a password", "Saisissez un mot de passe"), T("Too weak", "Trop faible"), T("Fair", "Acceptable"), T("Good", "Bon"), T("Strong ✓", "Fort ✓")][pwScore]}
              </div>

              <label className="text-xs font-medium mt-3 block">{T("Confirm password", "Confirmer le mot de passe")}</label>
              <input type={showPwd ? "text" : "password"} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder={T("Repeat your password", "Répétez le mot de passe")} className="w-full px-3 py-2 rounded-lg mt-1" style={{ border: "0.5px solid #E5E7EB", fontSize: 13 }} />
              {pwd.confirm && (
                <div style={{ fontSize: 10, marginTop: 4, color: pwd.confirm === pwd.password ? "#1D9E75" : "#E24B4A" }}>
                  {pwd.confirm === pwd.password ? T("✓ Passwords match", "✓ Mots de passe identiques") : T("✗ Passwords do not match", "✗ Mots de passe différents")}
                </div>
              )}

              <hr style={{ border: 0, borderTop: "0.5px solid #E5E7EB", margin: "12px 0" }} />

              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={checks.terms} onChange={(e) => setChecks({ ...checks, terms: e.target.checked })} className="mt-0.5" />
                <span>{T("I agree to the ", "J'accepte les ")}<a className="text-tf-blue underline">{T("Terms of Service", "Conditions d'utilisation")}</a>{T(" and ", " et la ")}<a className="text-tf-blue underline">{T("Privacy Policy", "Politique de confidentialité")}</a></span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer mt-2">
                <input type="checkbox" checked={checks.fair} onChange={(e) => setChecks({ ...checks, fair: e.target.checked })} className="mt-0.5" />
                <span>{T("I acknowledge the ", "Je reconnais que la loi ")}<a className="text-tf-blue underline">Fair Housing Act</a>{T(" applies to all US property listings on this platform", " s'applique à toutes les annonces immobilières US sur cette plateforme")}</span>
              </label>
              <label className="flex items-start gap-2 text-xs cursor-pointer mt-2">
                <input type="checkbox" checked={checks.news} onChange={(e) => setChecks({ ...checks, news: e.target.checked })} className="mt-0.5" />
                <span>{T("Send me property alerts and market intelligence by email (optional)", "M'envoyer des alertes de biens et analyses de marché par email (optionnel)")}</span>
              </label>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(2)} style={{ border: "0.5px solid #E5E7EB", color: "#6B7280", padding: "9px 16px", borderRadius: 8, fontSize: 13 }}>{T("← Back", "← Retour")}</button>
                <button onClick={submitAccount} disabled={busy} style={{ flex: 1, background: "#1D9E75", color: "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500, opacity: busy ? 0.7 : 1 }}>{busy ? T("Creating your account…", "Création du compte…") : T("Create my account →", "Créer mon compte →")}</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 4 }}>{T("Step 4 of 4 · Almost there!", "Étape 4 sur 4 · Presque terminé !")}</div>
              <h1 style={{ fontSize: 16, fontWeight: 500, color: "#111827" }}>{T("Verify your phone", "Vérifiez votre téléphone")}</h1>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
                {T("We sent a 6-digit code to ", "Nous avons envoyé un code à 6 chiffres au ")}
                <span className="font-bold" style={{ color: "#185FA5" }}>{country.dial} {info.phone}</span>
              </p>
              {demoCode && <div className="text-xs mb-2" style={{ color: "#0C447C" }}>{T("Demo code", "Code démo")}: <b>{demoCode}</b></div>}

              <div className="flex justify-center gap-2 my-4">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onPaste={(e) => {
                      const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (txt.length === 6) { e.preventDefault(); setOtp(txt.split("")); otpRefs.current[5]?.focus(); }
                    }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
                      if (v && i < 5) otpRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                    style={{ width: 44, height: 52, borderRadius: 8, fontSize: 22, fontWeight: 500, textAlign: "center", border: d ? "2px solid #1D9E75" : "0.5px solid #E5E7EB", background: d ? "#E1F5EE" : "white", color: d ? "#085041" : "#111827" }}
                  />
                ))}
              </div>

              <div className="text-center text-xs">
                {seconds > 0 ? (
                  <span className="text-muted-foreground">{T("Code expires in ", "Le code expire dans ")}<b style={{ color: "#185FA5" }}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</b></span>
                ) : (
                  <span style={{ color: "#E24B4A" }}>{T("Code expired. ", "Code expiré. ")}<button onClick={() => { setSeconds(300); setOtpAttempts(3); const c = String(Math.floor(100000 + Math.random() * 900000)); setDemoCode(c); toast.success(T(`New code: ${c}`, `Nouveau code : ${c}`)); }} className="text-tf-blue underline">{T("Resend code", "Renvoyer le code")}</button></span>
                )}
              </div>

              <button disabled={otp.some((d) => !d) || busy} onClick={verifyOtp} style={{ width: "100%", background: otp.some((d) => !d) ? "#E5E7EB" : "#1D9E75", color: otp.some((d) => !d) ? "#9CA3AF" : "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500, marginTop: 16 }}>
                {busy ? T("Verifying…", "Vérification…") : T("Verify & activate account →", "Vérifier & activer mon compte →")}
              </button>
            </>
          )}

          {step === 5 && (
            <div className="text-center pt-4">
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#E1F5EE", border: "2px solid #1D9E75", margin: "0 auto", animation: "pop 0.4s ease forwards" }} className="flex items-center justify-center">
                <PathCheck stroke="#1D9E75" size={28} />
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginTop: 14 }}>{T("Welcome to TerraFrique!", "Bienvenue sur TerraFrique !")}</h1>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>{T(`Your account is ready, ${info.firstName}.`, `Votre compte est prêt, ${info.firstName}.`)}</p>

              <div className="flex items-center gap-2 mx-auto" style={{ background: "#E1F5EE", border: "0.5px solid #9FE1CB", borderRadius: 12, padding: "10px 14px", maxWidth: 300, marginBottom: 16 }}>
                <PathStar stroke="#1D9E75" size={20} />
                <div className="text-left leading-tight">
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0F6E56" }}>{T("100 TerraCoins credited", "100 TerraCoins crédités")}</div>
                  <div style={{ fontSize: 11, color: "#085041" }}>{T("Worth $5 · Use on reports, boosts or transfers", "Valeur $5 · À utiliser sur rapports, boosts ou transferts")}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: 320, marginBottom: 16 }}>
                {[
                  { n: "100", l: "TerraCoins", c: "#185FA5" },
                  { n: fr ? selectedProfile.name[1] : selectedProfile.name[0], l: T("Your profile", "Votre profil"), c: "#1D9E75" },
                  { n: "0", l: T("Saved listings", "Biens sauvegardés"), c: "#111827" },
                  { n: T("Active", "Actif"), l: T("Account status", "Statut compte"), c: "#1D9E75" },
                ].map((c, i) => (
                  <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: 9 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.c }}>{c.n}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{c.l}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate({ to: "/dashboard" })} style={{ width: "100%", background: "#1D9E75", color: "white", padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{T("Go to my dashboard →", "Accéder à mon dashboard →")}</button>
              <button onClick={() => navigate({ to: "/listings" })} className="w-full mt-2" style={{ border: "0.5px solid #E5E7EB", color: "#6B7280", padding: 10, borderRadius: 8, fontSize: 13 }}>{T("Browse listings now", "Parcourir les annonces")}</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, val, onChange, placeholder, onBlur, err, type = "text" }: { label: string; val: string; onChange: (v: string) => void; placeholder?: string; onBlur?: () => void; err?: string | null; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <input type={type} value={val} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg mt-1" style={{ border: `1.5px solid ${err ? "#E24B4A" : val && !err ? "#1D9E75" : "#E5E7EB"}`, fontSize: 13 }} />
      {err && <div style={{ color: "#E24B4A", fontSize: 12, marginTop: 2 }}>{err}</div>}
    </div>
  );
}

// ============ SVG Icons ============
function PathHouse({ stroke = "currentColor", size = 13 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function PathShield({ stroke = "currentColor", size = 13 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function PathCheck({ stroke = "currentColor", size = 13 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function PathGlobe({ stroke = "currentColor", size = 16 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>;
}
function PathBuilding({ stroke = "currentColor", size = 16 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6" /><line x1="15" y1="6" x2="15" y2="6" /><line x1="9" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="15" y2="12" /></svg>;
}
function PathTool({ stroke = "currentColor", size = 16 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z" /></svg>;
}
function PathStar({ stroke = "currentColor", size = 13 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke} stroke={stroke} strokeWidth="1"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5" /></svg>;
}
function PathCompass({ stroke = "currentColor", size = 16 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" /></svg>;
}
function PathPin({ stroke = "currentColor", size = 13 }: { stroke?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
