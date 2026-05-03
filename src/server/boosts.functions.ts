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

export const BOOST_PLANS = {
  day: { days: 1, amount: 4, label: "1 jour" },
  week: { days: 7, amount: 25, label: "7 jours" },
  month: { days: 30, amount: 80, label: "30 jours" },
  quarter: { days: 90, amount: 180, label: "90 jours" },
} as const;

export const createBoostCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      itemType: z.enum(["property", "contractor", "broker"]),
      itemId: z.string().uuid(),
      plan: z.enum(["day", "week", "month", "quarter"]),
      audience: z.enum(["local", "national", "diaspora"]),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const planCfg = BOOST_PLANS[data.plan];

    // Verify ownership for properties
    if (data.itemType === "property") {
      const { data: prop, error } = await supabaseAdmin
        .from("properties").select("id, agent_id, title").eq("id", data.itemId).single();
      if (error || !prop) throw new Error("Property not found");
      if (prop.agent_id !== userId) throw new Error("You can only boost your own listings");
    }

    // Insert pending boost
    const { data: boost, error: be } = await supabaseAdmin.from("boosts").insert({
      user_id: userId,
      item_type: data.itemType,
      item_id: data.itemId,
      plan: data.plan,
      audience: data.audience,
      amount_usd: planCfg.amount,
      status: "pending",
    }).select("id").single();
    if (be || !boost) throw new Error(be?.message || "Failed to create boost");

    const s = stripe();
    const session = await s.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Boost ${planCfg.label} — TerraFrique` },
          unit_amount: Math.round(planCfg.amount * 100),
        },
        quantity: 1,
      }],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: { boost_id: boost.id, kind: "boost" },
    });

    await supabaseAdmin.from("boosts").update({ stripe_session_id: session.id }).eq("id", boost.id);
    return { url: session.url, sessionId: session.id, boostId: boost.id };
  });

export const cancelBoost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ boostId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: b, error } = await supabaseAdmin.from("boosts").select("*").eq("id", data.boostId).single();
    if (error || !b) throw new Error("Boost not found");
    const { data: admin } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
    if (b.user_id !== userId && !admin) throw new Error("Not authorized");

    await supabaseAdmin.from("boosts").update({ status: "cancelled", ends_at: new Date().toISOString() }).eq("id", b.id);
    if (b.item_type === "property") {
      await supabaseAdmin.from("properties").update({ boosted_until: null }).eq("id", b.item_id);
    }
    return { ok: true };
  });
