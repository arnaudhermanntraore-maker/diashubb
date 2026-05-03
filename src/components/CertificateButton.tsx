import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generatePropertyCertificate } from "@/server/certificates.functions";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CertificateButton({ propertyId }: { propertyId: string }) {
  const enabled = useFeatureFlag("pdf_certificates");
  const generate = useServerFn(generatePropertyCertificate);
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  const handle = async () => {
    setBusy(true);
    try {
      const { base64, filename } = await generate({ data: { propertyId } });
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificat téléchargé");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handle} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/70 text-sm font-medium disabled:opacity-50">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Certificat PDF
    </button>
  );
}
