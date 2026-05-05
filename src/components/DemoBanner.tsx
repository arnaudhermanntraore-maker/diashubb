import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const SS_KEY = "demo_banner_dismissed";

export function DemoBanner() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { user } = useAuth();
  const flagEnabled = useFeatureFlag("demo_data_banner");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(sessionStorage.getItem(SS_KEY) === "1");
    }
  }, []);

  if (!flagEnabled || dismissed || user) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px]"
      style={{ background: "#F0F9FF", borderBottom: "0.5px solid #BAE6FD", color: "#0369A1" }}
    >
      <Info size={14} style={{ color: "#0284C7" }} aria-hidden />
      <span>
        🔬 Demo —{" "}
        {fr
          ? "Ces annonces sont des données d'exemple. Devenez agent pour publier vos vrais biens."
          : "These are sample listings. Become an agent to publish real properties."}
      </span>
      <Link to="/listings_/new" className="underline font-medium" style={{ color: "#0284C7" }}>
        {fr ? "Publier mes biens →" : "Publish my listings →"}
      </Link>
      <button
        onClick={() => {
          sessionStorage.setItem(SS_KEY, "1");
          setDismissed(true);
        }}
        aria-label={fr ? "Masquer" : "Dismiss"}
        className="ml-2 hover:opacity-70 transition-opacity"
        style={{ color: "#7DD3FC" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
