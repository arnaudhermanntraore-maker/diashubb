import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Compass } from "lucide-react";

export const Route = createFileRoute("/surveyors")({
  head: () => ({ meta: [{ title: "Géomètres ONIG — TerraFrique" }] }),
  component: Page,
});

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <Compass size={36} className="text-tf-blue" />
      <h1 className="text-3xl font-display font-bold text-tf-navy mt-3">{fr ? "Géomètres ONIG certifiés" : "ONIG-certified surveyors"}</h1>
      <p className="text-muted-foreground mt-2">{fr ? "Bornage, plans cadastraux et titres fonciers vérifiés." : "Boundary surveys, cadastral plans and verified land titles."}</p>
      <Link to="/surveyors/register" className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-tf-blue text-white text-sm font-semibold">{fr ? "Rejoindre comme géomètre" : "Join as surveyor"}</Link>
    </div>
  );
}
