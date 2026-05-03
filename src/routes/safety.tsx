import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Lock, FileText, CreditCard, Users, Phone, Flag, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Sécurité & Anti-arnaque — TerraFrique" },
      { name: "description", content: "Guide anti-arnaque TerraFrique : règles d'or, types d'arnaques courantes et conseils pour acheteurs, vendeurs et agents." },
      { property: "og:title", content: "Sécurité & Anti-arnaque — TerraFrique" },
      { property: "og:description", content: "Achetez et vendez en toute sécurité entre les États-Unis et l'Afrique." },
    ],
  }),
  component: SafetyPage,
});

const NEVER_DO_FR = [
  "Envoyer de l'argent par Western Union, MoneyGram ou crypto à un inconnu.",
  "Communiquer hors plateforme (WhatsApp, e-mail, téléphone) avant vérification.",
  "Partager vos coordonnées bancaires, mot de passe ou code OTP par message.",
  "Verser un acompte sans avoir vu le titre foncier vérifié par TerraFrique.",
  "Signer un acte sans présence d'un notaire certifié sur la plateforme.",
];
const NEVER_DO_EN = [
  "Wire money via Western Union, MoneyGram or crypto to a stranger.",
  "Communicate off-platform (WhatsApp, email, phone) before verification.",
  "Share bank details, password or OTP code in any message.",
  "Pay a deposit before seeing the title deed verified by TerraFrique.",
  "Sign a deed without a certified notary present on the platform.",
];
const ALWAYS_DO_FR = [
  "Vérifiez le badge \"TerraFrique Verified\" sur l'annonce et l'agent.",
  "Utilisez l'escrow TerraFrique pour tout paiement (acompte, solde).",
  "Demandez le titre foncier original et vérifiez-le auprès du cadastre.",
  "Visitez le bien physiquement ou via la visite 360° certifiée.",
  "Conservez tous les échanges dans la messagerie sécurisée (preuve légale).",
];
const ALWAYS_DO_EN = [
  "Check the \"TerraFrique Verified\" badge on the listing and agent.",
  "Use TerraFrique escrow for any payment (deposit, balance).",
  "Request the original title deed and verify it with the land registry.",
  "Visit the property physically or via the certified 360° tour.",
  "Keep all exchanges in our secure messaging (legal proof).",
];

const SCAMS = [
  {
    icon: CreditCard,
    color: "var(--tf-red)",
    titleFr: "Acompte hors plateforme",
    titleEn: "Off-platform deposit",
    descFr: "Le vendeur demande un virement direct sur son compte personnel ou par mobile money en prétextant des frais réduits. L'argent disparaît.",
    descEn: "Seller asks for a direct bank or mobile money transfer claiming lower fees. The money vanishes.",
    redFlagFr: "« Pour aller plus vite, payez-moi directement »",
    redFlagEn: "\"To speed things up, pay me directly\"",
  },
  {
    icon: FileText,
    color: "var(--tf-amber)",
    titleFr: "Faux titre foncier",
    titleEn: "Fake title deed",
    descFr: "Un PDF photoshopé ou un titre déjà vendu à plusieurs acheteurs. Particulièrement courant sur les terrains périurbains.",
    descEn: "A photoshopped PDF or a deed already sold to multiple buyers. Common on suburban land.",
    redFlagFr: "Refus de fournir le titre original ou de passer par un notaire",
    redFlagEn: "Refusal to provide the original or to use a notary",
  },
  {
    icon: Users,
    color: "var(--tf-purple)",
    titleFr: "Faux agent / fausse agence",
    titleEn: "Fake agent / agency",
    descFr: "Profil créé en 24h, photos volées sur internet, promesses de rendements irréalistes (>30%/an).",
    descEn: "Profile created in 24h, stolen photos, unrealistic return promises (>30%/yr).",
    redFlagFr: "Aucune annonce vérifiée, profil sans avis",
    redFlagEn: "No verified listing, no reviews",
  },
  {
    icon: Phone,
    color: "var(--tf-blue)",
    titleFr: "Phishing OTP / mot de passe",
    titleEn: "OTP / password phishing",
    descFr: "Un faux \"support TerraFrique\" vous appelle pour récupérer votre code OTP ou votre mot de passe.",
    descEn: "A fake \"TerraFrique support\" calls to get your OTP or password.",
    redFlagFr: "TerraFrique ne demande JAMAIS votre OTP par téléphone",
    redFlagEn: "TerraFrique NEVER asks for your OTP by phone",
  },
];

const TIPS_BUYER_FR = [
  "Faites toujours une contre-visite avec un proche local ou un géomètre certifié.",
  "Comparez le prix au m² avec 3 annonces similaires dans la zone.",
  "Demandez le score IA TerraFrique avant de faire une offre.",
  "Ne payez jamais plus de 10% d'acompte avant signature notariée.",
];
const TIPS_BUYER_EN = [
  "Always do a counter-visit with a local relative or certified surveyor.",
  "Compare price/sqm with 3 similar listings in the area.",
  "Request the TerraFrique AI Score before making an offer.",
  "Never pay more than 10% deposit before notarial signing.",
];
const TIPS_AGENT_FR = [
  "Vérifiez l'identité de l'acheteur via son badge KYC TerraFrique.",
  "N'acceptez jamais de paiement en cash > $10 000 (déclaration obligatoire).",
  "Conservez chaque échange dans la messagerie : c'est votre preuve en cas de litige.",
  "Signalez toute demande suspecte via le bouton « Signaler » dans la conversation.",
];
const TIPS_AGENT_EN = [
  "Verify the buyer's identity via their TerraFrique KYC badge.",
  "Never accept cash payments > $10,000 (mandatory declaration).",
  "Keep every exchange in messaging — it's your proof in case of dispute.",
  "Report any suspicious request via the \"Report\" button in the conversation.",
];

function SafetyPage() {
  const { i18n: i } = useTranslation();
  const fr = i.language === "fr";

  const neverDo = fr ? NEVER_DO_FR : NEVER_DO_EN;
  const alwaysDo = fr ? ALWAYS_DO_FR : ALWAYS_DO_EN;
  const tipsBuyer = fr ? TIPS_BUYER_FR : TIPS_BUYER_EN;
  const tipsAgent = fr ? TIPS_AGENT_FR : TIPS_AGENT_EN;

  return (
    <div className="bg-secondary/30 min-h-screen">
      {/* Hero */}
      <section className="text-white" style={{ background: "var(--tf-red)" }}>
        <div className="container mx-auto px-4 max-w-6xl py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
              <ShieldAlert size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">
              {fr ? "Centre de sécurité" : "Safety center"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold mb-3 max-w-3xl">
            {fr ? "Achetez et vendez en toute sécurité." : "Buy and sell with total safety."}
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-2xl">
            {fr
              ? "Les arnaques immobilières existent partout. Voici comment TerraFrique vous protège — et comment vous protéger vous-même."
              : "Real-estate scams exist everywhere. Here's how TerraFrique protects you — and how to protect yourself."}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-10 sm:py-14 space-y-10">
        {/* Never / Always */}
        <section className="grid md:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6 border-l-4" style={{ borderLeftColor: "var(--tf-red)" }}>
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={22} style={{ color: "var(--tf-red)" }} />
              <h2 className="font-display font-bold text-lg">{fr ? "À ne JAMAIS faire" : "NEVER do"}</h2>
            </div>
            <ul className="space-y-3">
              {neverDo.map((t, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--tf-red)" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6 border-l-4" style={{ borderLeftColor: "var(--tf-green)" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={22} style={{ color: "var(--tf-green)" }} />
              <h2 className="font-display font-bold text-lg">{fr ? "À TOUJOURS faire" : "ALWAYS do"}</h2>
            </div>
            <ul className="space-y-3">
              {alwaysDo.map((t, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--tf-green)" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Scam types */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={20} className="text-tf-amber" />
            <h2 className="font-display font-bold text-2xl text-tf-navy">
              {fr ? "Les 4 arnaques les plus courantes" : "The 4 most common scams"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SCAMS.map((s) => (
              <article key={s.titleEn} className="bg-card rounded-2xl border border-border shadow-soft p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: s.color }}>
                    <s.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-base text-tf-navy">{fr ? s.titleFr : s.titleEn}</h3>
                  </div>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed mb-3">{fr ? s.descFr : s.descEn}</p>
                <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "rgba(113,43,19,0.08)", color: "var(--tf-red)" }}>
                  🚩 {fr ? s.redFlagFr : s.redFlagEn}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Tips Buyer / Agent */}
        <section className="grid md:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-display font-bold text-lg text-tf-blue mb-4 flex items-center gap-2">
              <ShieldCheck size={20} /> {fr ? "Conseils acheteurs & investisseurs" : "Tips for buyers & investors"}
            </h3>
            <ol className="space-y-3">
              {tipsBuyer.map((t, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-tf-blue text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="text-foreground/80">{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-display font-bold text-lg text-tf-green mb-4 flex items-center gap-2">
              <ShieldCheck size={20} /> {fr ? "Conseils agents & vendeurs" : "Tips for agents & sellers"}
            </h3>
            <ol className="space-y-3">
              {tipsAgent.map((t, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-tf-green text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="text-foreground/80">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pledge */}
        <section className="rounded-2xl p-6 sm:p-8 text-white shadow-elegant" style={{ background: "linear-gradient(135deg, var(--tf-green) 0%, var(--tf-green-light) 100%)" }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur shrink-0">
              <Lock size={26} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2">
                {fr ? "L'engagement TerraFrique" : "The TerraFrique pledge"}
              </h3>
              <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                {fr
                  ? "Chaque transaction passe par notre escrow. Chaque titre est vérifié par un notaire partenaire. Chaque agent est certifié KYC. En cas de fraude avérée, nous remboursons votre acompte jusqu'à $50 000."
                  : "Every transaction goes through our escrow. Every title is verified by a partner notary. Every agent is KYC-certified. In case of proven fraud, we refund your deposit up to $50,000."}
              </p>
            </div>
          </div>
        </section>

        {/* Report + contacts */}
        <section className="bg-card rounded-2xl border border-border shadow-soft p-6 sm:p-8">
          <h3 className="font-display font-bold text-xl text-tf-navy mb-2 flex items-center gap-2">
            <Flag size={20} className="text-tf-red" /> {fr ? "Signaler une fraude" : "Report a fraud"}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            {fr
              ? "Si vous êtes victime ou témoin d'une tentative d'arnaque, signalez-le immédiatement. Notre équipe sécurité répond sous 2h en semaine."
              : "If you're a victim or witness of an attempted scam, report it immediately. Our security team replies within 2h on weekdays."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/messages"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ background: "var(--tf-red)" }}
            >
              <Flag size={16} /> {fr ? "Signaler maintenant" : "Report now"}
            </Link>
            <a
              href="mailto:security@terrafrique.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card font-semibold text-sm hover:bg-secondary transition-colors"
            >
              <MessageSquare size={16} /> security@terrafrique.com
            </a>
            <a
              href="tel:+18005550199"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card font-semibold text-sm hover:bg-secondary transition-colors"
            >
              <Phone size={16} /> +1 (800) 555-0199
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
