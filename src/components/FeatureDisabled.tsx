import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function FeatureDisabled({ featureKey }: { featureKey?: string }) {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  return (
    <div className="container mx-auto px-4 py-24 max-w-md text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-display font-bold">
        {fr ? "Fonctionnalité non disponible" : "Feature not available"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {fr ? "Cette fonctionnalité est temporairement désactivée." : "This feature is temporarily disabled."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {fr ? "Contactez le support si vous pensez que c'est une erreur." : "Contact support if you think this is an error."}
      </p>
      {featureKey && <p className="mt-3 text-[10px] font-mono text-muted-foreground">{featureKey}</p>}
      <Link to="/" className="inline-block mt-6 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
        ← {fr ? "Retour" : "Back"}
      </Link>
    </div>
  );
}
