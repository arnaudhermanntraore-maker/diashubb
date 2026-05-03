import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/estimate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Estimation is not configured." }, { status: 500 });
        }
        let body: { address?: string; type?: string; size?: string; sizeUnit?: "sqft" | "m2"; year?: string; lang?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
        const address = (body.address ?? "").toString().trim().slice(0, 200);
        const type = (body.type ?? "").toString().trim().slice(0, 50);
        const size = (body.size ?? "").toString().trim().slice(0, 20);
        const sizeUnit = body.sizeUnit === "m2" ? "m²" : "sqft";
        const year = (body.year ?? "").toString().trim().slice(0, 4);
        const lang = body.lang === "fr" ? "fr" : "en";

        if (!address) {
          return Response.json({ error: lang === "fr" ? "Adresse requise" : "Address required" }, { status: 400 });
        }

        const system = lang === "fr"
          ? "Tu es un expert en évaluation immobilière pour les marchés US et africains. Donne une fourchette d'estimation réaliste basée sur les ventes comparables typiques. Réponds STRICTEMENT en JSON valide: {\"low\": number, \"high\": number, \"currency\": \"USD\", \"rationale\": \"phrase courte\"}."
          : "You are a real-estate appraiser for US and African markets. Provide a realistic estimate range based on typical comparable sales. Reply STRICTLY in valid JSON: {\"low\": number, \"high\": number, \"currency\": \"USD\", \"rationale\": \"short sentence\"}.";

        const userMsg = `Address: ${address}\nType: ${type}\nSize: ${size} ${sizeUnit}\nYear built: ${year}`;

        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({
              model: "claude-3-5-haiku-latest",
              max_tokens: 300,
              system,
              messages: [{ role: "user", content: userMsg }],
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error("Anthropic estimate error", res.status, errText);
            return Response.json({ error: `AI error (${res.status})` }, { status: 502 });
          }
          const data = await res.json() as { content?: { type: string; text: string }[] };
          const text = data.content?.find((c) => c.type === "text")?.text ?? "";
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) {
            return Response.json({ error: "Invalid AI response" }, { status: 502 });
          }
          const parsed = JSON.parse(match[0]) as { low: number; high: number; currency?: string; rationale?: string };
          return Response.json({
            low: Math.round(Number(parsed.low) || 0),
            high: Math.round(Number(parsed.high) || 0),
            currency: parsed.currency ?? "USD",
            rationale: parsed.rationale ?? "",
          });
        } catch (e) {
          console.error("Estimate error", e);
          return Response.json({ error: "Estimation service unavailable" }, { status: 502 });
        }
      },
    },
  },
});
