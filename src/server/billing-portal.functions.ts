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

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      returnUrl: z.string().url(),
      flow: z.enum(["invoices", "payment_methods", "subscription_cancel"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: agency, error } = await supabaseAdmin
      .from("agencies")
      .select("stripe_customer_id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!agency?.stripe_customer_id) {
      throw new Error("No Stripe customer found. Subscribe to a plan first.");
    }
    const s = stripe();
    const session = await s.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: data.returnUrl,
    });
    return { url: session.url };
  });
