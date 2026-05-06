import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { validatePlanKey, isPlanKey, type PlanKey } from "@/lib/plan-key";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as never });
}

async function updateAgencyPlan(opts: {
  userId?: string | null;
  agencyId?: string | null;
  customerId?: string | null;
  planKey: string;
}) {
  const patch: { plan_key: string; updated_at: string; stripe_customer_id?: string } = {
    plan_key: opts.planKey,
    updated_at: new Date().toISOString(),
  };
  if (opts.customerId) patch.stripe_customer_id = opts.customerId;

  let q = supabaseAdmin.from("agencies").update(patch);
  if (opts.agencyId) q = q.eq("id", opts.agencyId);
  else if (opts.userId) q = q.eq("owner_id", opts.userId);
  else if (opts.customerId) q = q.eq("stripe_customer_id", opts.customerId);
  else return;
  const { error } = await q;
  if (error) console.error("[stripe-webhook] agency update", error);
}

async function planKeyFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const meta = sub.metadata?.plan_key;
  if (meta && PLAN_KEYS.has(meta)) return meta;
  // Fallback: lookup by price id
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return null;
  const { data } = await supabaseAdmin
    .from("subscription_plans")
    .select("key")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .maybeSingle();
  return (data?.key as string) ?? null;
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !whSecret) {
          return new Response("Missing signature or webhook secret", { status: 400 });
        }
        const body = await request.text();
        const s = stripe();
        let event: Stripe.Event;
        try {
          event = s.webhooks.constructEvent(body, sig, whSecret);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Invalid signature";
          console.error("[stripe-webhook] signature error", msg);
          return new Response(`Webhook Error: ${msg}`, { status: 400 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode !== "subscription") break;
              const userId = session.metadata?.user_id ?? null;
              const agencyId = session.metadata?.agency_id || null;
              const planKey = session.metadata?.plan_key;
              const customerId =
                typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
              if (planKey && PLAN_KEYS.has(planKey)) {
                await updateAgencyPlan({ userId, agencyId, customerId, planKey });
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated": {
              const sub = event.data.object as Stripe.Subscription;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
              const userId = sub.metadata?.user_id ?? null;
              const agencyId = sub.metadata?.agency_id || null;
              const active = ["active", "trialing", "past_due"].includes(sub.status);
              const planKey = active ? await planKeyFromSubscription(sub) : "starter";
              if (planKey) {
                await updateAgencyPlan({ userId, agencyId, customerId, planKey });
              }
              break;
            }
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
              const userId = sub.metadata?.user_id ?? null;
              const agencyId = sub.metadata?.agency_id || null;
              await updateAgencyPlan({ userId, agencyId, customerId, planKey: "starter" });
              break;
            }
            default:
              break;
          }
        } catch (e) {
          console.error("[stripe-webhook] handler error", e);
          return new Response("handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
