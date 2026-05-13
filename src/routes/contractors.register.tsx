import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShieldCheck, Star, TrendingUp } from "lucide-react";
import { JoinForm } from "@/components/JoinForm";

export const Route = createFileRoute("/contractors/register")({
  head: () => ({ meta: [{ title: "Devenir artisan certifié — Diashubb" }] }),
  component: Page,
});

const TRADES_FR = ["Entrepreneur général","Électricien","Plombier","Climatisation","Peintre","Couvreur","Maçon","Menuisier","Paysagiste","Autre"];
const TRADES_EN = ["General contractor","Electrician","Plumber","HVAC","Painter","Roofer","Mason","Carpenter","Landscaper","Other"];

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <h1 className="text-3xl font-display font-bold text-tf-navy">{fr ? "Rejoignez Diashubb en tant qu'artisan certifié" : "Join Diashubb as a certified contractor"}</h1>
      <p className="text-muted-foreground mt-2">{fr ? "Accédez à des milliers de clients de la diaspora africaine aux USA et en Afrique." : "Access thousands of African diaspora clients in the US and Africa."}</p>
      <div className="grid md:grid-cols-3 gap-3 mt-6">
        <Benefit icon="💰" title={fr ? "Paiements sécurisés" : "Secure payments"} sub={fr ? "Escrow protégé — payé à la livraison" : "Escrow protected — paid on delivery"} />
        <Benefit icon="⭐" title={fr ? "Badge certifié" : "Verified badge"} sub={fr ? "Background check + badge vérifié" : "Background check + verified badge"} />
        <Benefit icon="📈" title={fr ? "Visibilité diaspora" : "Diaspora reach"} sub={fr ? "44M acheteurs potentiels" : "44M potential buyers"} />
      </div>
      <JoinForm
        kind="contractor"
        specialties={fr ? TRADES_FR : TRADES_EN}
        specialtyLabel={fr ? "Spécialité" : "Trade / Specialty"}
      />
    </div>
  );
}

function Benefit({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
