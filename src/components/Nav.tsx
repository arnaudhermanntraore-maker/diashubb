import { Link, useNavigate } from "@tanstack/react-router";
import { Home, LayoutGrid, Circle, Globe2, Wrench, Building2, Star, LogIn, UserPlus, LogOut, Plus, ShieldAlert, X, User as UserIcon, Heart, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import i18n from "@/lib/i18n";
import { useEffect, useState } from "react";
import { AuthWall } from "@/components/AuthWall";

const NavIcon = ({ to, icon: Icon, label, search, exact }: { to: string; icon: typeof Home; label: string; search?: Record<string, string>; exact?: boolean }) => (
  <Link
    to={to}
    search={search as never}
    className="group flex flex-col items-center justify-center gap-0.5 px-2.5 h-full text-foreground/70 hover:text-tf-blue transition-colors data-[status=active]:text-tf-blue"
    activeOptions={{ exact: exact ?? false, includeSearch: false }}
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
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<"fr" | "en">((i18n.language as "fr" | "en") || "fr");
  const fr = lang === "fr";
  const isSuper = roles.includes("super_admin");

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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: "var(--tf-blue)" }}>
            <Home size={16} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display font-bold text-sm text-tf-navy">TerraFrique</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground -mt-0.5">Global</span>
          </div>
        </Link>

        <nav className="flex items-center h-full">
          <NavIcon to="/" icon={Home} label={fr ? "Accueil" : "Home"} exact />
          <NavIcon to="/listings" icon={LayoutGrid} label={fr ? "Acheter" : "Buy"} search={{ type: "buy" }} />
          <NavIcon to="/listings" icon={Circle} label={fr ? "Louer" : "Rent"} search={{ type: "rent" }} />
          <NavIcon to="/listings" icon={Globe2} label={fr ? "Afrique" : "Africa"} search={{ region: "africa" }} />
          <NavIcon to="/contractors" icon={Wrench} label={fr ? "Artisans" : "Contractors"} />
          <NavIcon to="/agents" icon={Building2} label={fr ? "Agences" : "Agencies"} />
          <NavIcon to="/brokers" icon={Star} label={fr ? "Courtiers" : "Brokers"} />
          {user && <NavIcon to="/favorites" icon={Heart} label={fr ? "Favoris" : "Saved"} />}
          {user && <NavIcon to="/alerts" icon={Bell} label={fr ? "Alertes" : "Alerts"} />}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="w-8 h-8 rounded-md overflow-hidden ring-1 ring-border hover:ring-tf-blue transition-all flex items-center justify-center"
          >
            <Flag lang={lang} />
          </button>
          <span className="w-px h-6 bg-border mx-1" />
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-muted transition-colors" title={user.email ?? ""}>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: "var(--tf-blue)" }}
                >
                  {((user.user_metadata?.full_name as string) || user.email || "?").trim().charAt(0).toUpperCase()}
                </span>
                {isSuper && <span className="text-[8px] font-bold text-white px-1 rounded" style={{ background: "var(--tf-amber)" }} title="Super Admin">SA</span>}
                <span className="hidden md:flex flex-col leading-none">
                  <span className="text-[10px] font-semibold text-foreground truncate max-w-[120px]">
                    {(user.user_metadata?.full_name as string) || user.email}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-tf-green font-bold">● {fr ? "Connecté" : "Signed in"}</span>
                </span>
                <UserIcon size={14} className="md:hidden text-foreground/70" />
              </Link>
              <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="flex flex-col items-center gap-0.5 px-2 text-foreground/70 hover:text-tf-blue" aria-label={fr ? "Déconnexion" : "Sign out"}>
                <LogOut size={16} />
                <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{fr ? "Sortir" : "Log out"}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="flex flex-col items-center gap-0.5 px-2 text-foreground/70 hover:text-tf-blue">
                <LogIn size={16} />
                <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{fr ? "Connexion" : "Log in"}</span>
              </Link>
              <Link to="/signup" className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-white" style={{ background: "var(--tf-blue)" }}>
                <UserPlus size={16} />
                <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{fr ? "Inscription" : "Sign up"}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function FloatingAddListing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallOpen, setWallOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { if (user) navigate({ to: "/listings/new" }); else setWallOpen(true); }}
        className="fixed bottom-24 right-6 z-30 inline-flex items-center gap-2 text-white rounded-full px-5 py-3 font-semibold text-sm hover:scale-105 transition-transform"
        style={{ background: "var(--tf-green)", boxShadow: "0 4px 16px rgba(29,158,117,0.35)" }}
      >
        <Plus size={18} /> {t("addListing")}
      </button>
      <AuthWall open={wallOpen} onOpenChange={setWallOpen} titleKey="publish" />
    </>
  );
}

export function SecurityBanner() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("tf_sec_dismissed")) setHidden(true);
  }, []);
  if (hidden) return null;
  return (
    <div className="text-white text-xs py-2 px-4 flex items-center justify-center gap-2 relative" style={{ background: "var(--tf-red)" }}>
      <ShieldAlert size={14} className="shrink-0" />
      <span className="text-center">
        {t("banner")} <a href="#" className="font-semibold underline ml-1" style={{ color: "var(--tf-amber)" }}>{fr ? "Voir les arnaques courantes →" : "See common scams →"}</a>
      </span>
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
