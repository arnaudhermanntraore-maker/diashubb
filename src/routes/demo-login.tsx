import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/demo-login")({ component: DemoLoginPage });

const DEMO_PASSWORD = "DemoPass!2026";
const DEMO_ACCOUNTS = [
  { role: "buyer",      email: "aminata.diallo@demo.tf", name: "Aminata Diallo", country: "🇸🇳 Sénégal",  lang: "FR" },
  { role: "agent",      email: "kouadio.yao@demo.tf",    name: "Kouadio Yao",    country: "🇨🇮 Côte d'Ivoire", lang: "FR" },
  { role: "broker",     email: "marcus.johnson@demo.tf", name: "Marcus Johnson", country: "🇺🇸 USA",     lang: "EN" },
  { role: "contractor", email: "fatou.ndiaye@demo.tf",   name: "Fatou Ndiaye",   country: "🇸🇳 Sénégal",  lang: "FR" },
  { role: "surveyor",   email: "sarah.williams@demo.tf", name: "Sarah Williams", country: "🇺🇸 USA",     lang: "EN" },
];

function DemoLoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const loginAs = async (email: string) => {
    setBusy(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
    setBusy(null);
    if (error) {
      toast.error(error.message + " — make sure demo data is seeded.");
      return;
    }
    toast.success(`Signed in as ${email}`);
    navigate({ to: "/dashboard" });
  };

  const copyPwd = () => {
    navigator.clipboard.writeText(DEMO_PASSWORD);
    toast.success("Password copied");
  };

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-display font-bold mb-2">Demo accounts</h1>
      <p className="text-muted-foreground mb-2">
        One-click sign-in to test Diashubb with realistic profiles across roles and continents.
      </p>
      <div className="flex items-center gap-2 mb-8 text-sm">
        <span className="text-muted-foreground">Shared password:</span>
        <code className="px-2 py-1 rounded bg-muted font-mono">{DEMO_PASSWORD}</code>
        <Button size="sm" variant="ghost" onClick={copyPwd}>Copy</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {DEMO_ACCOUNTS.map((a) => (
          <Card key={a.email} className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.country} · {a.lang}</div>
              </div>
              <Badge variant="secondary" className="capitalize">{a.role}</Badge>
            </div>
            <code className="text-xs text-muted-foreground truncate">{a.email}</code>
            <Button onClick={() => loginAs(a.email)} disabled={busy === a.email} className="mt-auto">
              {busy === a.email ? "Signing in…" : "Sign in"}
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        ⚠️ Demo accounts are for testing only. Disable this page before production.
      </p>
    </div>
  );
}
