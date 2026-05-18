import { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import terraMascot from "@/assets/terra-chatbot.png";

interface Msg {
  role: "user" | "assistant";
  content: string;
  ts?: number;
}

const SUGGESTIONS_FR = [
  "Comment vérifier un titre foncier ?",
  "Frais de transfert USA → Afrique ?",
  "Documents pour acheter aux USA ?",
  "Comment booster mon annonce ?",
];

const SUGGESTIONS_EN = [
  "How are property titles verified?",
  "USA → Africa transfer fees?",
  "Documents needed to buy in the US?",
  "How do I boost my listing?",
];

const WELCOME_FR = "Bonjour 👋 Je suis **Terra**, votre assistant immobilier Diashubb.\n\nJe peux vous aider sur l'achat, l'investissement, les transferts USA ↔ Afrique et bien plus.";
const WELCOME_EN = "Hello 👋 I'm **Terra**, your Diashubb real estate assistant.\n\nI can help with buying, investing, US ↔ Africa transfers and much more.";

function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Simple markdown-like renderer (bold only)
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

export function Chatbot() {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content: fr ? WELCOME_FR : WELCOME_EN,
      ts: Date.now(),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = fr ? SUGGESTIONS_FR : SUGGESTIONS_EN;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgs, open, minimized]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  // Count unread when closed
  useEffect(() => {
    if (!open) {
      const assistantMsgs = msgs.filter((m) => m.role === "assistant").length;
      if (assistantMsgs > 1) setUnread(assistantMsgs - 1);
    } else {
      setUnread(0);
    }
  }, [msgs, open]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const ts = Date.now();
    const next: Msg[] = [...msgs, { role: "user", content: text, ts }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, lang: i18n.language }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: data.reply || data.error || "...", ts: Date.now() },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: fr
            ? "Je suis temporairement hors ligne. Réessayez dans quelques instants."
            : "I'm temporarily offline. Please try again in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setMsgs([
      {
        role: "assistant",
        content: fr ? WELCOME_FR : WELCOME_EN,
        ts: Date.now(),
      },
    ]);
    setInput("");
  };

  const toggleOpen = () => {
    if (!open) {
      setOpen(true);
      setMinimized(false);
      setUnread(0);
    } else {
      setOpen(false);
    }
  };

  return (
    <>
      {/* ── BOUTON FLOTTANT ── */}
      <button
        onClick={toggleOpen}
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat Terra"}
        className="fixed bottom-6 right-6 z-40 group"
        style={{ filter: "drop-shadow(0 4px 16px rgba(10,48,96,0.25))" }}
      >
        <div className="relative">
          {/* Avatar ou icône selon état */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rounded-xl overflow-hidden"
            style={{ background: open ? "#EF4444" : "var(--tf-navy)" }}
          >
            {open ? (
              <X size={22} className="text-white" />
            ) : (
              <img
                src={terraMascot}
                alt="Terra"
                width={56}
                height={56}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Indicateur en ligne */}
          {!open && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse"
              style={{ background: "#22C55E" }}
            />
          )}

          {/* Badge non lus */}
          {!open && unread > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#EF4444" }}
            >
              {unread}
            </span>
          )}

          {/* Tooltip */}
          {!open && (
            <div
              className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ background: "var(--tf-navy)" }}
            >
              {fr ? "Parlez à Terra IA" : "Chat with Terra AI"}
              <span
                className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-4 border-transparent"
                style={{ borderLeftColor: "var(--tf-navy)" }}
              />
            </div>
          )}
        </div>
      </button>

      {/* ── FENÊTRE CHAT ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "360px",
            height: minimized ? "auto" : "520px",
            boxShadow: "0 24px 64px -12px rgba(10,48,96,0.30), 0 0 0 1px rgba(10,48,96,0.08)",
            animation: "chatSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <style>{`
            @keyframes chatSlideIn {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)    scale(1);    }
            }
            @keyframes typingDot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40%            { transform: scale(1);   opacity: 1;   }
            }
            .typing-dot { animation: typingDot 1.2s infinite; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            .msg-in {
              animation: msgIn 0.2s ease;
            }
            @keyframes msgIn {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0);   }
            }
          `}</style>

          {/* ── HEADER ── */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: "var(--tf-navy)" }}
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <img
                  src={terraMascot}
                  alt="Terra"
                  width={36}
                  height={36}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: "#22C55E", borderColor: "var(--tf-navy)" }}
                />
              </div>

              {/* Infos */}
              <div>
                <div className="text-white font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Terra
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
                  >
                    AI
                  </span>
                </div>
                <div className="text-[11px] flex items-center gap-1"
                  style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
                    style={{ background: "#22C55E" }}
                  />
                  {fr ? "En ligne · Powered by Claude" : "Online · Powered by Claude"}
                </div>
              </div>
            </div>

            {/* Actions header */}
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                aria-label={fr ? "Réinitialiser" : "Reset"}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                title={fr ? "Nouvelle conversation" : "New conversation"}
              >
                <RotateCcw size={13} className="text-white/70" />
              </button>
              <button
                onClick={() => setMinimized((v) => !v)}
                aria-label={minimized ? "Agrandir" : "Réduire"}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <ChevronDown
                  size={15}
                  className="text-white/70 transition-transform"
                  style={{ transform: minimized ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              >
                <X size={15} className="text-white/70" />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          {!minimized && (
            <>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ background: "#F8FAFC" }}
              >
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={`flex msg-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* Avatar assistant */}
                    {m.role === "assistant" && (
                      <div
                        className="w-6 h-6 rounded-lg overflow-hidden shrink-0 mr-2 mt-0.5"
                        style={{ background: "var(--tf-navy)" }}
                      >
                        <img
                          src={terraMascot}
                          alt=""
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[78%]`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user"
                            ? "text-white rounded-br-sm"
                            : "text-foreground rounded-bl-sm border"
                        }`}
                        style={
                          m.role === "user"
                            ? { background: "var(--tf-blue)" }
                            : { background: "#fff", borderColor: "rgba(0,0,0,0.07)" }
                        }
                      >
                        {renderContent(m.content)}
                      </div>
                      {m.ts && (
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {formatTime(m.ts)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {busy && (
                  <div className="flex justify-start msg-in">
                    <div
                      className="w-6 h-6 rounded-lg overflow-hidden shrink-0 mr-2 mt-0.5"
                      style={{ background: "var(--tf-navy)" }}
                    >
                      <img src={terraMascot} alt="" width={24} height={24}
                        className="w-full h-full object-cover" />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm border flex items-center gap-1"
                      style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="typing-dot w-1.5 h-1.5 rounded-full inline-block"
                          style={{
                            background: "var(--tf-blue)",
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {msgs.length <= 1 && (
                <div
                  className="px-4 py-2 flex flex-wrap gap-1.5 border-t"
                  style={{ background: "#F8FAFC", borderColor: "rgba(0,0,0,0.06)" }}
                >
                  <p className="w-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <Sparkles size={10} />
                    {fr ? "Questions fréquentes" : "Quick questions"}
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[11px] px-3 py-1.5 rounded-full border transition-all hover:scale-[1.02] font-medium"
                      style={{
                        background: "#fff",
                        borderColor: "rgba(10,48,96,0.15)",
                        color: "var(--tf-navy)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--tf-blue)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--tf-blue)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(10,48,96,0.15)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--tf-navy)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div
                className="px-3 py-3 flex items-center gap-2 border-t"
                style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={fr ? "Posez votre question…" : "Ask your question…"}
                  disabled={busy}
                  className="flex-1 text-sm outline-none rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-50"
                  style={{
                    background: "#F1F5F9",
                    border: "1.5px solid transparent",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--tf-blue)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background = "#F1F5F9";
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  aria-label={fr ? "Envoyer" : "Send"}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95 shrink-0"
                  style={{ background: "var(--tf-blue)" }}
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>

              {/* Footer */}
              <div
                className="px-4 py-1.5 text-center"
                style={{ background: "#F8FAFC", borderTop: "0.5px solid rgba(0,0,0,0.05)" }}
              >
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <MessageSquare size={9} />
                  {fr
                    ? "Terra ne remplace pas un conseiller juridique ou financier"
                    : "Terra does not replace legal or financial advice"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
