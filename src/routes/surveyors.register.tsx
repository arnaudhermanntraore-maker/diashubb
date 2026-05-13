import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { JoinForm } from "@/components/JoinForm";

export const Route = createFileRoute("/surveyors/register")({
  head: () => ({ meta: [{ title: "Rejoindre comme géomètre — Diashubb" }] }),
  component: Page,
});

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <h1 className="text-3xl font-display font-bold text-tf-navy">{fr ? "Rejoignez comme géomètre ONIG" : "Join as ONIG surveyor"}</h1>
      <p className="text-muted-foreground mt-2">{fr ? "Vérifiez les titres et plans cadastraux pour la diaspora." : "Verify titles and cadastral plans for diaspora buyers."}</p>
      <JoinForm kind="surveyor" specialtyLabel={fr ? "Région d'opération" : "Region of operation"} />
    </div>
  );
}
