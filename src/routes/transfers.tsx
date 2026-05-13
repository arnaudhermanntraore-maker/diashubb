import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, DollarSign } from "lucide-react";

export const Route = createFileRoute("/transfers")({
  head: () => ({ meta: [{ title: "Transferts — Diashubb" }] }),
  component: Page,
});

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <DollarSign size={36} className="text-tf-green" />
      <h1 className="text-3xl font-display font-bold text-tf-navy mt-3">{fr ? "Transferts internationaux" : "International transfers"}</h1>
      <p className="text-muted-foreground mt-2">{fr ? "Envoyez des fonds vers l'Afrique à tarif fixe (12 $)." : "Send funds to Africa with a flat $12 fee."}</p>
      <p className="text-sm text-muted-foreground mt-6">{fr ? "Bientôt disponible." : "Coming soon."}</p>
    </div>
  );
}
