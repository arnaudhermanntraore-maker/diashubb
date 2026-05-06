import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as never });
}

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      planKey: z.enum(["pro", "business", "enterprise"]),
      cycle: z.enum(["monthly", "yearly"]).default("monthly"),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Lookup plan + price id
    const { data: plan, error: pe } = await supabaseAdmin
      .from("subscription_plans")
      .select("key, name_en, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly")
      .eq("key", data.planKey)
      .single();
    if (pe || !plan) throw new Error("Plan not found");

    // Lookup agency for this owner (optional — user may not have one yet)
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("id, email, stripe_customer_id, name")
      .eq("owner_id", userId)
      .maybeSingle();

    const s = stripe();
    const priceId = data.cycle === "yearly" ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
    const unitAmount = data.cycle === "yearly" ? plan.price_yearly : plan.price_monthly;

    // Build line items: prefer pre-configured Stripe Price, otherwise inline price_data
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            recurring: { interval: data.cycle === "yearly" ? "year" : "month" },
            unit_amount: Math.round(Number(unitAmount ?? 0) * 100),
            product_data: {
              name: `TerraFrique ${plan.name_en} (${data.cycle})`,
            },
          },
        };

    const session = await s.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [lineItem],
      customer: agency?.stripe_customer_id ?? undefined,
      customer_email: agency?.stripe_customer_id ? undefined : agency?.email ?? undefined,
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_key: data.planKey,
          agency_id: agency?.id ?? "",
        },
      },
      metadata: {
        user_id: userId,
        plan_key: data.planKey,
        cycle: data.cycle,
        agency_id: agency?.id ?? "",
      },
    });

    return { url: session.url };
  });

export const confirmSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ sessionId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const s = stripe();
    const session = await s.checkout.sessions.retrieve(data.sessionId, {
      expand: ["subscription", "customer"],
    });

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { ok: false, status: session.status };
    }
    const planKey = session.metadata?.plan_key;
    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== userId) throw new Error("Session does not belong to current user");
    if (!planKey) throw new Error("Missing plan_key on session");

    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    const { error } = await supabaseAdmin
      .from("agencies")
      .update({
        plan_key: planKey,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true, planKey };
  });
