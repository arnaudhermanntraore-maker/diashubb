import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({ foreclosureId: z.string().uuid() });

interface AIAnalysis {
  renovation_estimate_usd: number;
  investment_score: number; // 0-100
  rationale: string;
  risks: string[];
  opportunities: string[];
}

export const analyzeForeclosure = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { data: f, error } = await supabaseAdmin
      .from("foreclosures")
      .select("*")
      .eq("id", data.foreclosureId)
      .single();
    if (error || !f) throw new Error("Foreclosure not found");

    const prompt = `You are a US real estate investment analyst. Analyze this foreclosure and respond ONLY with valid JSON matching this schema:
{"renovation_estimate_usd": number, "investment_score": number (0-100), "rationale": string (max 280 chars), "risks": string[] (max 3), "opportunities": string[] (max 3)}

Property:
- Address: ${f.address}, ${f.city}, ${f.state} ${f.zip_code ?? ""}
- Type: ${f.property_type ?? "unknown"} | ${f.bedrooms ?? "?"}bd/${f.bathrooms ?? "?"}ba | ${f.surface_sqft ?? "?"} sqft | built ${f.year_built ?? "?"}
- Listing price: $${f.listing_price ?? "?"} | Market value: $${f.estimated_market_value ?? "?"} | Discount: ${f.discount_percent ?? "?"}%
- Foreclosure type: ${f.foreclosure_type} (${f.foreclosure_stage ?? "n/a"})
- FHA: ${f.fha_eligible} | VA: ${f.va_eligible} | Financing: ${f.financing_available?.join(", ") ?? "n/a"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise US real estate analyst. Reply with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json: any = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let analysis: AIAnalysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    await supabaseAdmin
      .from("foreclosures")
      .update({
        ai_renovation_estimate: analysis.renovation_estimate_usd,
        ai_investment_score: Math.max(0, Math.min(100, Math.round(analysis.investment_score))),
        ai_analysis: analysis as any,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", f.id);

    return analysis;
  });
