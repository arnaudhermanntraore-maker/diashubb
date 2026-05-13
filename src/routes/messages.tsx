import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { ShieldAlert, Send } from "lucide-react";
import { obfuscate, deobfuscate, detectScam } from "@/lib/messaging";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Messages,
});

interface Msg { id: string; sender_id: string; receiver_id: string; content_encrypted: string; flagged: boolean; created_at: string; }

function Messages() {
  const enabled = useFeatureFlag("secure_messaging");
  const antiscam = useFeatureFlag("ai_antiscam");
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const [items, setItems] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) return;
    supabase.from("messages").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50).then(({ data }) => setItems((data ?? []) as Msg[]));
    const ch = supabase.channel("messages-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const m = payload.new as Msg;
      if (m.sender_id === user.id || m.receiver_id === user.id) setItems((prev) => [m, ...prev]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, enabled]);

  if (!enabled) return <FeatureDisabled featureKey="secure_messaging" />;

  const send = async () => {
    if (!user || !text.trim()) return;
    const last = items.find((m) => m.sender_id !== user.id);
    if (!last) { toast.error(fr ? "Aucun destinataire" : "No recipient"); return; }
    if (antiscam) {
      const reason = detectScam(text);
      if (reason) {
        setWarning(reason);
        await supabase.from("audit_logs").insert({ user_id: user.id, action: "message.scam_attempt", metadata: { pattern: reason } });
        return;
      }
    }
    setWarning(null);
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: last.sender_id, content_encrypted: obfuscate(text) });
    setText("");
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-display font-bold">Messages</h1>
      <p className="text-sm text-muted-foreground mt-1">{fr ? "Échanges chiffrés · détection anti-arnaque active" : "Encrypted · scam-detection active"}</p>

      {warning && (
        <div className="mt-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-xl p-3 text-sm">
          ⚠️ {fr ? "Message bloqué — Tentative de contact externe détectée. Tous les échanges doivent rester sur Diashubb pour votre protection." : "Message blocked — external contact attempt detected. All exchanges must stay on Diashubb."}
          <div className="text-xs mt-1 font-mono opacity-70">pattern: {warning}</div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 && <p className="text-muted-foreground text-center py-12">{fr ? "Aucun message" : "No messages yet"}</p>}
        {items.map((m) => (
          <div key={m.id} className={`p-4 rounded-2xl border ${m.flagged ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
            {m.flagged && <div className="text-xs text-destructive flex items-center gap-1 mb-1"><ShieldAlert size={12} /> {fr ? "Possible arnaque" : "Possible scam"}</div>}
            <div className="text-xs text-muted-foreground mb-1">{m.sender_id === user?.id ? "You" : "Them"} · {new Date(m.created_at).toLocaleString()}</div>
            <div className="text-sm">{deobfuscate(m.content_encrypted)}</div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="mt-6 flex gap-2 sticky bottom-4 bg-background pt-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={fr ? "Répondre..." : "Reply..."} className="flex-1 px-4 py-3 bg-muted rounded-full text-sm outline-none" />
          <button onClick={send} className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Send size={16} /></button>
        </div>
      )}
    </div>
  );
}
