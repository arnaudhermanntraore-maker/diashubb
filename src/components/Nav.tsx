import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Search, Users, LayoutDashboard, MessageSquare, Shield, LogIn, LogOut, Plus, ShieldAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";
import { useEffect, useState } from "react";

const NavIcon = ({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) => (
  <Link
    to={to}
    className="group flex flex-col items-center justify-center gap-0.5 px-2.5 h-full text-foreground/70 hover:text-tf-blue transition-colors"
    activeProps={{ className: "text-tf-blue" }}
  >
    <Icon size={18} strokeWidth={2} />
    <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{label}</span>
  </Link>
);

const Flag = ({ lang }: { lang: "fr" | "en" }) => lang === "fr" ? (
  <svg viewBox="0 0 32 32" width="32" height="32"><rect width="10.66" height="32" fill="#0055A4"/><rect x="10.66" width="10.66" height="32" fill="#fff"/><rect x="21.33" width="10.66" height="32" fill="#EF4135"/></svg>
) : (
  <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" fill="#012169"/><path d="M0 0l32 32M32 0L0 32" stroke="#fff" strokeWidth="4"/><path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="6"/><path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="3"/></svg>
);

export function Nav() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"fr" | "en">((i18n.language as "fr" | "en") || "fr");

  const toggleLang = () => {
    const next = lang === "fr" ? "en" : "fr";
    i18n.changeLanguage(next);
    if (typeof window !== "undefined") localStorage.setItem("tf_lang", next);
    setLang(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border" style={{ height: 50 }}>
      <div className="container mx-auto px-3 h-full flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold font-display text-sm" style={{ background: "var(--tf-navy)" }}>TF</div>
          <span className="font-display font-bold text-sm hidden sm:block text-tf-navy">TerraFrique</span>
        </Link>

        <nav className="flex items-center h-full">
          <NavIcon to="/" icon={Home} label={t("nav.home")} />
          <NavIcon to="/listings" icon={Search} label={t("nav.listings")} />
          <NavIcon to="/agents" icon={Users} label={t("nav.agents")} />
          {user && <NavIcon to="/dashboard" icon={LayoutDashboard} label={t("nav.dashboard")} />}
          {user && <NavIcon to="/messages" icon={MessageSquare} label={t("nav.messages")} />}
          {isAdmin && <NavIcon to="/admin" icon={Shield} label={t("nav.admin")} />}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="w-8 h-8 rounded-md overflow-hidden ring-1 ring-border hover:ring-tf-blue transition-all flex items-center justify-center"
          >
            <Flag lang={lang} />
          </button>
          {user ? (
            <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="flex flex-col items-center gap-0.5 px-2 text-foreground/70 hover:text-tf-blue">
              <LogOut size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{t("nav.logout")}</span>
            </button>
          ) : (
            <Link to="/auth" className="flex flex-col items-center gap-0.5 px-2 text-foreground/70 hover:text-tf-blue">
              <LogIn size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{t("nav.login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function FloatingAddListing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <Link
      to={user ? "/listings/new" : "/auth"}
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 text-white rounded-full px-5 py-3 shadow-elegant hover:scale-105 transition-transform font-semibold text-sm"
      style={{ background: "var(--tf-green)" }}
    >
      <Plus size={18} /> {t("addListing")}
    </Link>
  );
}

export function SecurityBanner() {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("tf_sec_dismissed")) setHidden(true);
  }, []);
  if (hidden) return null;
  return (
    <div className="text-white text-xs py-2 px-4 flex items-center justify-center gap-2 relative" style={{ background: "var(--tf-red)" }}>
      <ShieldAlert size={14} className="shrink-0" />
      <span className="text-center">{t("banner")}</span>
      <button
        aria-label="Dismiss"
        onClick={() => { setHidden(true); if (typeof window !== "undefined") sessionStorage.setItem("tf_sec_dismissed", "1"); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
