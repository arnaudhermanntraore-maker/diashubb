import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
}

// Buyer creates a deposit Checkout session (manual capture = funds held in escrow)
export const createDepositCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    propertyId: z.string().uuid(),
    amountUsd: z.number().min(50).max(1_000_000),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: prop, error: pe } = await supabaseAdmin
      .from("properties").select("id,title,agent_id,price_usd").eq("id", data.propertyId).single();
    if (pe || !prop) throw new Error("Property not found");
    if (prop.agent_id === userId) throw new Error("You cannot pay deposit on your own listing");

    const s = stripe();
    const session = await s.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Deposit — ${prop.title}` },
          unit_amount: Math.round(data.amountUsd * 100),
        },
        quantity: 1,
      }],
      payment_intent_data: {
        capture_method: "manual", // ESCROW: authorize now, capture on admin release
        metadata: { property_id: prop.id, buyer_id: userId, seller_id: prop.agent_id },
      },
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: { property_id: prop.id, buyer_id: userId, seller_id: prop.agent_id },
    });

    const { error: te } = await supabaseAdmin.from("transactions").insert({
      property_id: prop.id,
      buyer_id: userId,
      seller_id: prop.agent_id,
      amount_usd: data.amountUsd,
      method: "stripe",
      status: "pending",
      external_ref: session.id,
    });
    if (te) console.error("[tx insert]", te);

    return { url: session.url, sessionId: session.id };
  });

// Admin releases escrow → captures the held authorization
export const releaseEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ transactionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: admin } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
    if (!admin) throw new Error("Admin only");

    const { data: tx, error } = await supabaseAdmin.from("transactions").select("*").eq("id", data.transactionId).single();
    if (error || !tx) throw new Error("Transaction not found");
    if (tx.status !== "escrowed") throw new Error(`Cannot release tx in status ${tx.status}`);
    if (!tx.external_ref) throw new Error("Missing Stripe reference");

    const s = stripe();
    const session = await s.checkout.sessions.retrieve(tx.external_ref);
    const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!piId) throw new Error("No payment intent");
    await s.paymentIntents.capture(piId);

    await supabaseAdmin.from("transactions").update({ status: "released", escrow_released: true, updated_at: new Date().toISOString() }).eq("id", tx.id);
    await supabaseAdmin.from("audit_logs").insert({ user_id: userId, action: "escrow.release", metadata: { tx_id: tx.id, amount_usd: tx.amount_usd } });
    return { ok: true };
  });

// Admin cancels escrow → cancels authorization (refund)
export const refundEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ transactionId: z.string().uuid(), reason: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: admin } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
    if (!admin) throw new Error("Admin only");

    const { data: tx, error } = await supabaseAdmin.from("transactions").select("*").eq("id", data.transactionId).single();
    if (error || !tx) throw new Error("Transaction not found");
    if (!["escrowed", "pending"].includes(tx.status)) throw new Error(`Cannot refund tx in status ${tx.status}`);

    const s = stripe();
    if (tx.external_ref) {
      try {
        const session = await s.checkout.sessions.retrieve(tx.external_ref);
        const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
        if (piId) {
          const pi = await s.paymentIntents.retrieve(piId);
          if (pi.status === "requires_capture") await s.paymentIntents.cancel(piId);
          else if (pi.status === "succeeded") await s.refunds.create({ payment_intent: piId });
        }
      } catch (e) { console.error("[stripe cancel]", e); }
    }

    await supabaseAdmin.from("transactions").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", tx.id);
    await supabaseAdmin.from("audit_logs").insert({ user_id: userId, action: "escrow.refund", metadata: { tx_id: tx.id, reason: data.reason ?? null } });
    return { ok: true };
  });
