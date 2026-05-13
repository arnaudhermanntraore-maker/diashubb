import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoadingDashboard } from "./shared/LoadingDashboard";
import { BuyerDashboard } from "./BuyerDashboard";
import { AgentDashboard } from "./AgentDashboard";
import { ContractorDashboard } from "./ContractorDashboard";
import { BrokerDashboard } from "./BrokerDashboard";
import { SurveyorDashboard } from "./SurveyorDashboard";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  lang_pref: string;
  terracoins: number;
  verified: boolean;
}

type Role = "buyer" | "agent" | "contractor" | "broker" | "surveyor" | "admin" | "super_admin";

// Higher index = higher priority for choosing the dashboard
const ROLE_PRIORITY: Role[] = ["buyer", "agent", "contractor", "broker", "surveyor", "admin", "super_admin"];

function pickRole(roles: string[]): Role {
  let chosen: Role = "buyer";
  for (const r of roles) {
    const idx = ROLE_PRIORITY.indexOf(r as Role);
    if (idx > ROLE_PRIORITY.indexOf(chosen)) chosen = r as Role;
  }
  return chosen;
}

export function DashboardRouter() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile((data as Profile) ?? null);
      setProfileLoading(false);
    });
  }, [user]);

  const role = pickRole(roles);

  useEffect(() => {
    if (!loading && !profileLoading && (role === "admin" || role === "super_admin")) {
      navigate({ to: "/admin" });
    }
  }, [loading, profileLoading, role, navigate]);

  if (loading || profileLoading) return <LoadingDashboard />;

  switch (role) {
    case "agent": return <AgentDashboard profile={profile} />;
    case "contractor": return <ContractorDashboard profile={profile} />;
    case "broker": return <BrokerDashboard profile={profile} />;
    case "surveyor": return <SurveyorDashboard profile={profile} />;
    case "admin":
    case "super_admin":
      return <LoadingDashboard />;
    default: return <BuyerDashboard profile={profile} />;
  }
}
