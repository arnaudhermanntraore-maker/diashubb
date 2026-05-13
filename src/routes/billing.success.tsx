import { createFileRoute, Link, redirect, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { confirmSubscription } from "@/server/subscriptions.functions";

const search = z.object({ session_id: z.string().optional() });

export const Route = createFileRoute("/billing/success")({
  validateSearch: (s) => search.parse(s),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Subscription confirmed — Diashubb" }] }),
  component: BillingSuccess,
});

function BillingSuccess() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr") ?? true;
  const { session_id } = useSearch({ from: "/billing/success" });
  const confirm = useServerFn(confirmSubscription);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [planKey, setPlanKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) { setStatus("error"); setErr("Missing session id"); return; }
    confirm({ data: { sessionId: session_id } })
      .then((r) => { setPlanKey(r.planKey ?? null); setStatus(r.ok ? "ok" : "error"); })
      .catch((e) => { setErr(e?.message ?? "Error"); setStatus("error"); });
  }, [session_id, confirm]);

  return (
    <div className="container mx-auto px-4 py-20 max-w-xl text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto animate-spin" size={36} />
          <h1 className="text-2xl font-display font-bold mt-4">
            {fr ? "Confirmation de votre abonnement…" : "Confirming your subscription…"}
          </h1>
        </>
      )}
      {status === "ok" && (
        <>
          <div className="mx-auto w-16 h-16 rounded-full grid place-items-center" style={{ background: "rgba(34,197,94,.12)" }}>
            <CheckCircle2 size={36} style={{ color: "var(--tf-green)" }} />
          </div>
          <h1 className="text-3xl font-display font-bold mt-4">
            {fr ? "Bienvenue dans " : "Welcome to "}{(planKey ?? "").toUpperCase()} 🎉
          </h1>
          <p className="text-muted-foreground mt-2">
            {fr ? "Votre plan est maintenant actif." : "Your plan is now active."}
          </p>
          <Link
            to="/agency/dashboard"
            className="inline-flex mt-6 px-6 py-3 rounded-full text-white font-semibold"
            style={{ background: "var(--tf-blue)" }}
          >
            {fr ? "Aller au tableau de bord" : "Go to dashboard"}
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-display font-bold">
            {fr ? "Impossible de confirmer" : "Could not confirm"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{err}</p>
          <Link to="/pricing" className="inline-block mt-6 underline">
            {fr ? "Retour aux tarifs" : "Back to pricing"}
          </Link>
        </>
      )}
    </div>
  );
}
