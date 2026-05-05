import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

export const Route = createFileRoute("/market")({
  head: () => ({ meta: [{ title: "Intelligence de marché — TerraFrique" }] }),
  component: Page,
});

function Page() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const enabled = useFeatureFlag("market_intelligence");
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4 hover:text-foreground"><ArrowLeft size={14}/> {fr ? "Retour" : "Back"}</Link>
      <BarChart3 size={36} className="text-tf-blue" />
      <h1 className="text-3xl font-display font-bold text-tf-navy mt-3">{fr ? "Intelligence de marché" : "Market intelligence"}</h1>
      {enabled ? (
        <p className="text-muted-foreground mt-2">{fr ? "Analyse complète des marchés US et africains à venir." : "Full US and African market analysis coming soon."}</p>
      ) : (
        <p className="text-muted-foreground mt-2">{fr ? "Cette fonctionnalité est désactivée. Revenez bientôt." : "This feature is currently disabled. Check back soon."}</p>
      )}
    </div>
  );
}
