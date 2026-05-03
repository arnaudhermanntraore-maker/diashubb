import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/messages")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Messages,
});

interface Msg { id: string; sender_id: string; receiver_id: string; content_encrypted: string; flagged: boolean; created_at: string; }

const decrypt = (s: string) => { try { return decodeURIComponent(escape(atob(s))); } catch { return s; } };

function Messages() {
  const { user } = useAuth();
  const [items, setItems] = useState<Msg[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("messages").select("*").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50).then(({ data }) => setItems((data ?? []) as Msg[]));

    const ch = supabase.channel("messages-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const m = payload.new as Msg;
      if (m.sender_id === user.id || m.receiver_id === user.id) setItems((prev) => [m, ...prev]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-display font-bold">Messages</h1>
      <p className="text-sm text-muted-foreground mt-1">End-to-end obfuscated · scam-detection active</p>
      <div className="mt-6 space-y-3">
        {items.length === 0 && <p className="text-muted-foreground text-center py-12">No messages yet.</p>}
        {items.map((m) => (
          <div key={m.id} className={`p-4 rounded-2xl border ${m.flagged ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
            {m.flagged && <div className="text-xs text-destructive flex items-center gap-1 mb-1"><ShieldAlert size={12} /> Possible scam — keep all communication on TerraFrique.</div>}
            <div className="text-xs text-muted-foreground mb-1">{m.sender_id === user?.id ? "You" : "Them"} · {new Date(m.created_at).toLocaleString()}</div>
            <div className="text-sm">{decrypt(m.content_encrypted)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
