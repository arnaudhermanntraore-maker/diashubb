import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { JoinForm } from "@/components/JoinForm";

export const Route = createFileRoute("/brokers/register")({
  head: () => ({ meta: [{ title: "Devenir démarcheur — TerraFrique" }] }),
  component: Page,
});

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <h1 className="text-3xl font-display font-bold text-tf-navy">{fr ? "Devenez démarcheur certifié" : "Become a certified broker"}</h1>
      <p className="text-muted-foreground mt-2">{fr ? "Connectez vos prospects diaspora aux meilleurs biens." : "Connect your diaspora leads with verified properties."}</p>
      <JoinForm kind="broker" specialtyLabel={fr ? "Zone d'opération" : "Area of operation"} />
    </div>
  );
}
