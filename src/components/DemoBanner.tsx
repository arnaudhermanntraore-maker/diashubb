import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";

const STORAGE_KEY = "demo_banner_dismissed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {/* ignore */}
  return readCookie(STORAGE_KEY) === "1";
}

export function DemoBanner() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { user } = useAuth();
  const flagEnabled = useFeatureFlag("demo_data_banner");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(isDismissed());
  }, []);

  if (!flagEnabled || dismissed || user) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {/* ignore */}
    writeCookie(STORAGE_KEY, "1");
    setDismissed(true);
  };

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
        onClick={handleDismiss}
        aria-label={fr ? "Masquer" : "Dismiss"}
        className="ml-2 hover:opacity-70 transition-opacity"
        style={{ color: "#7DD3FC" }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
