import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Search, Users, LayoutDashboard, MessageSquare, Shield, LogIn, LogOut, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";
import { useState } from "react";

const NavIcon = ({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) => (
  <Link to={to} className="group flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors" activeProps={{ className: "text-primary" }}>
    <Icon size={18} strokeWidth={2} />
    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground">{label}</span>
  </Link>
);

const Flag = ({ lang }: { lang: "fr" | "en" }) => lang === "fr" ? (
  <svg viewBox="0 0 32 32" width="28" height="28"><rect width="10.66" height="32" fill="#0055A4"/><rect x="10.66" width="10.66" height="32" fill="#fff"/><rect x="21.33" width="10.66" height="32" fill="#EF4135"/></svg>
) : (
  <svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" fill="#012169"/><path d="M0 0l32 32M32 0L0 32" stroke="#fff" strokeWidth="4"/><path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="6"/><path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="3"/></svg>
);

export function Nav() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"fr" | "en">((i18n.language as "fr" | "en") || "fr");

  const toggleLang = () => {
    const next = lang === "fr" ? "en" : "fr";
    i18n.changeLanguage(next);
    localStorage.setItem("tf_lang", next);
    setLang(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold font-display">TF</div>
          <span className="font-display font-bold text-lg hidden sm:block">TerraFrique</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavIcon to="/" icon={Home} label={t("nav.home")} />
          <NavIcon to="/listings" icon={Search} label={t("nav.listings")} />
          <NavIcon to="/agents" icon={Users} label={t("nav.agents")} />
          {user && <NavIcon to="/dashboard" icon={LayoutDashboard} label={t("nav.dashboard")} />}
          {user && <NavIcon to="/messages" icon={MessageSquare} label={t("nav.messages")} />}
          {isAdmin && <NavIcon to="/admin" icon={Shield} label={t("nav.admin")} />}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={toggleLang} aria-label="Toggle language" className="rounded-full overflow-hidden ring-2 ring-border hover:ring-primary transition-all">
            <Flag lang={lang} />
          </button>
          {user ? (
            <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-muted">
              <LogOut size={18} />
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{t("nav.logout")}</span>
            </button>
          ) : (
            <Link to="/auth" className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-muted">
              <LogIn size={18} />
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{t("nav.login")}</span>
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
    <Link to={user ? "/listings/new" : "/auth"} className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 bg-success text-success-foreground rounded-full px-5 py-3 shadow-elegant hover:scale-105 transition-transform font-medium">
      <Plus size={18} /> {t("addListing")}
    </Link>
  );
}

export function SecurityBanner() {
  const { t } = useTranslation();
  return (
    <div className="bg-ink text-background text-xs py-2 px-4 text-center">{t("banner")}</div>
  );
}
