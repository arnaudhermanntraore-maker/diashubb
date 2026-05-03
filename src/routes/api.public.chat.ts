import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Chat is not configured. Add ANTHROPIC_API_KEY." }, { status: 500 });
        }
        const body = (await request.json()) as { messages: { role: "user" | "assistant"; content: string }[]; lang?: string };
        const lang = body.lang === "fr" ? "fr" : "en";
        const system = lang === "fr"
          ? "Tu es Terra, l'assistant IA de TerraFrique Global, plateforme immobilière bi-continentale (USA et Afrique). Tu réponds toujours en français, brièvement et chaleureusement. Conseille de communiquer uniquement sur la plateforme et n'invente jamais de prix."
          : "You are Terra, the AI assistant of TerraFrique Global — a bi-continental real estate platform (USA and Africa). Always reply in English, briefly and warmly. Always advise users to communicate only on the platform and never invent prices.";
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({
              model: "claude-3-5-haiku-latest",
              max_tokens: 400,
              system,
              messages: body.messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error("Anthropic error", res.status, errText);
            return Response.json({ error: `AI error (${res.status})` }, { status: 502 });
          }
          const data = await res.json() as { content?: { type: string; text: string }[] };
          const reply = data.content?.find((c) => c.type === "text")?.text ?? "…";
          return Response.json({ reply });
        } catch (e) {
          console.error("Chat error", e);
          return Response.json({ error: "Chat service unavailable" }, { status: 502 });
        }
      },
    },
  },
});
