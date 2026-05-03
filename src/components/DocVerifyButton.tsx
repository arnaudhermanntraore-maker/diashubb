import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyDocument } from "@/server/docverify.functions";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { ShieldCheck, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Result { score: number; verdict: "valid" | "suspicious" | "invalid"; reasons: string[]; document_type: string | null; }

export function DocVerifyButton({ propertyId, documentUrl }: { propertyId: string; documentUrl: string }) {
  const enabled = useFeatureFlag("ai_doc_verification");
  const verify = useServerFn(verifyDocument);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  if (!enabled) return null;

  const run = async () => {
    setBusy(true);
    try {
      const r = await verify({ data: { propertyId, documentUrl } });
      setResult(r);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const color = result?.verdict === "valid" ? "text-success" : result?.verdict === "suspicious" ? "text-accent-foreground" : "text-destructive";
  const Icon = result?.verdict === "valid" ? ShieldCheck : result?.verdict === "suspicious" ? AlertTriangle : XCircle;

  return (
    <div className="space-y-2">
      <button onClick={run} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Vérifier avec l'IA
      </button>
      {result && (
        <div className="bg-card border border-border rounded-xl p-3 text-sm">
          <div className={`flex items-center gap-2 font-medium ${color}`}>
            <Icon className="w-4 h-4" />
            {result.verdict.toUpperCase()} · score {result.score}/100
          </div>
          {result.document_type && <div className="text-xs text-muted-foreground mt-1">Type : {result.document_type}</div>}
          {result.reasons.length > 0 && (
            <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
              {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
