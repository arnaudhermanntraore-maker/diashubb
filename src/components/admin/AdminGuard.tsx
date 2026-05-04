import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Users, Home, Shield, BarChart3, Flag, Settings, Gavel } from "lucide-react";

const TABS = [
  { to: "/admin", label: "Vue d'ensemble", icon: Settings },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/listings", label: "Annonces", icon: Home },
  { to: "/admin/foreclosures", label: "Foreclosures", icon: Gavel },
  { to: "/admin/security", label: "Sécurité", icon: Shield },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/flags", label: "Feature Flags", icon: Flag, superOnly: true },
];

export function AdminGuard({ children, requireSuper = false }: { children: ReactNode; requireSuper?: boolean }) {
  const { isAdmin, roles, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isSuper = roles.includes("super_admin");

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Chargement…</div>;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold">403</h1>
        <p className="text-muted-foreground mt-2">Accès administrateur requis.</p>
      </div>
    );
  }
  if (requireSuper && !isSuper) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold">403</h1>
        <p className="text-muted-foreground mt-2">Réservé au Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <nav className="flex flex-wrap gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.filter((t) => !t.superOnly || isSuper).map((t) => {
          const active = path === t.to;
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
