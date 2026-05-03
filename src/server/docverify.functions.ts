import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface AIResp {
  score: number;
  verdict: "valid" | "suspicious" | "invalid";
  reasons: string[];
  document_type: string | null;
}

export const verifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    propertyId: z.string().uuid(),
    documentUrl: z.string().url(),
  }).parse(d))
  .handler(async ({ data, context }): Promise<AIResp> => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en verification de documents fonciers africains (titres de propriete, actes notaries, attestations). Reponds UNIQUEMENT en JSON: {\"score\":0-100, \"verdict\":\"valid|suspicious|invalid\", \"reasons\":[...], \"document_type\":\"...\"}",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyse ce document foncier. Verifie : type de document, presence de cachets/signatures, coherence des informations, signes de falsification." },
              { type: "image_url", image_url: { url: data.documentUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("AI verification failed", res.status, txt);
      if (res.status === 429) throw new Error("Trop de requetes, reessayez dans 1 minute");
      if (res.status === 402) throw new Error("Credits IA epuises");
      throw new Error("Verification IA indisponible");
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: AIResp;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { score: 0, verdict: "suspicious", reasons: ["Reponse IA illisible"], document_type: null };
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "document_ai_verified",
      metadata: { property_id: data.propertyId, ...parsed },
    });

    return parsed;
  });
