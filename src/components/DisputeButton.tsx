import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

const REASONS_FR = ["Paiement non reçu", "Bien non conforme à la description", "Suspicion de fraude documentaire", "Vendeur ne répond pas", "Autre"];
const REASONS_EN = ["Payment not received", "Property not as described", "Document fraud suspected", "Seller not responding", "Other"];

export function DisputeButton({ transactionId }: { transactionId: string }) {
  const enabled = useFeatureFlag("dispute_system");
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  const reasons = fr ? REASONS_FR : REASONS_EN;

  const submit = async () => {
    if (!user) return;
    if (desc.length < 50) { toast.error(fr ? "Description min. 50 caractères" : "Description min 50 chars"); return; }
    setBusy(true);
    const { error } = await supabase.from("disputes").insert({ transaction_id: transactionId, opened_by: user.id, reason, description: desc });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      await supabase.from("transactions").update({ status: "disputed" }).eq("id", transactionId);
      toast.success(fr ? "Litige ouvert" : "Dispute opened");
      setOpen(false); setReason(""); setDesc("");
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10">
        <AlertTriangle size={12} /> {fr ? "Ouvrir un litige" : "Open dispute"}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-background rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold">{fr ? "Ouvrir un litige" : "Open a dispute"}</h3>
            <div className="text-xs font-mono text-muted-foreground mt-1">tx: {transactionId.slice(0, 8)}</div>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-4 w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none">
              <option value="">{fr ? "Choisir un motif" : "Select reason"}</option>
              {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder={fr ? "Décrivez le problème (min 50 caractères)" : "Describe the issue (min 50 chars)"} className="mt-3 w-full px-3 py-2 bg-muted rounded-lg text-sm outline-none" />
            <div className="text-xs text-muted-foreground mt-1">{desc.length}/50</div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm">{fr ? "Annuler" : "Cancel"}</button>
              <button disabled={!reason || desc.length < 50 || busy} onClick={submit} className="bg-destructive text-white rounded-full px-4 py-2 text-sm disabled:opacity-50">{fr ? "Soumettre" : "Submit"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
