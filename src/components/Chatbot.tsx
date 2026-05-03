import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Msg { role: "user" | "assistant"; content: string; }

export function Chatbot() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: i18n.language === "fr" ? "Bonjour ! Je suis Terra, votre assistant immobilier. Comment puis-je vous aider ?" : "Hi! I'm Terra, your real estate assistant. How can I help?" },
  ]);

  const send = async () => {
    const text = input.trim();
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
        <button onClick={() => setOpen(true)} aria-label="Open chat" className="fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elegant flex items-center justify-center hover:scale-105 transition-transform">
          <MessageCircle size={24} />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 left-6 z-30 w-80 h-[480px] bg-card border border-border rounded-2xl shadow-elegant flex flex-col overflow-hidden">
          <div className="bg-gradient-hero text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div><div className="font-display font-bold">Terra</div><div className="text-xs opacity-80">{i18n.language === "fr" ? "Assistant TerraFrique" : "TerraFrique Assistant"}</div></div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m.content}</div>
            ))}
            {busy && <div className="text-xs text-muted-foreground">…</div>}
          </div>
          <div className="border-t border-border p-2 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="…" className="flex-1 bg-muted rounded-full px-3 py-2 text-sm outline-none" />
            <button onClick={send} disabled={busy} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
