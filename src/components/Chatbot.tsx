import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Msg { role: "user" | "assistant"; content: string; }

const SUGGESTIONS_FR = ["Comment vérifier un titre ?", "Frais de transfert USA → Afrique ?", "Quels documents pour acheter ?"];
const SUGGESTIONS_EN = ["How are titles verified?", "USA → Africa transfer fees?", "What documents do I need?"];

export function Chatbot() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: i18n.language === "fr" ? "Bonjour ! Je suis Terra, votre assistant immobilier. Comment puis-je vous aider ?" : "Hi! I'm Terra, your real estate assistant. How can I help?" },
  ]);

  const suggestions = i18n.language === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang: i18n.language }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || data.error || "..." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, I'm offline right now." }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full text-white shadow-elegant flex items-center justify-center hover:scale-105 transition-transform"
          style={{ background: "var(--tf-navy)" }}
        >
          <MessageCircle size={24} />
        </button>
      )}
      {open && (
        <div className="fixed bottom-24 right-6 z-30 w-[340px] h-[500px] bg-card border border-border rounded-2xl shadow-elegant flex flex-col overflow-hidden">
          <div className="text-white px-4 py-3 flex items-center justify-between" style={{ background: "var(--tf-navy)" }}>
            <div className="flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-dot" />
              </span>
              <div>
                <div className="font-display font-bold text-sm">TerraFrique AI</div>
                <div className="text-[10px] opacity-80">Powered by Claude</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "ml-auto bg-tf-blue text-white" : "bg-white text-foreground border border-border"}`}>{m.content}</div>
            ))}
            {busy && <div className="text-xs text-muted-foreground">…</div>}
          </div>
          {msgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-white hover:border-tf-blue hover:text-tf-blue transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-border p-2 flex gap-2 bg-white">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="…" className="flex-1 bg-muted rounded-full px-3 py-2 text-sm outline-none" />
            <button onClick={() => send()} disabled={busy} className="w-9 h-9 rounded-full text-white flex items-center justify-center disabled:opacity-50" style={{ background: "var(--tf-navy)" }}><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
