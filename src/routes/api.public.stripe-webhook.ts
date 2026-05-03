import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Stripe webhook — marks deposit as 'escrowed' once authorization succeeds.
// NOTE: For production set STRIPE_WEBHOOK_SECRET and verify signature.
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.STRIPE_SECRET_KEY;
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!key) return new Response("not configured", { status: 500 });
        const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });

        const body = await request.text();
        let event: Stripe.Event;
        const sig = request.headers.get("stripe-signature");
        if (whSecret && sig) {
          try { event = stripe.webhooks.constructEvent(body, sig, whSecret); }
          catch (e) { return new Response(`bad sig: ${(e as Error).message}`, { status: 400 }); }
        } else {
          event = JSON.parse(body) as Stripe.Event; // dev mode
        }

        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
            if (piId) {
              const pi = await stripe.paymentIntents.retrieve(piId);
              const newStatus = pi.status === "requires_capture" ? "escrowed" : pi.status === "succeeded" ? "released" : "pending";
              await supabaseAdmin.from("transactions").update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              }).eq("external_ref", session.id);
            }
          }
        } catch (e) { console.error("[webhook]", e); }

        return new Response("ok");
      },
    },
  },
});
