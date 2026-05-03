import { useRef, useState } from "react";
import { Upload, Loader2, X, FileText, Image as ImageIcon, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Bucket = "property-photos" | "property-videos" | "property-tours" | "property-docs";

const ACCEPTS: Record<Bucket, string> = {
  "property-photos": "image/jpeg,image/png,image/webp",
  "property-videos": "video/mp4,video/webm,video/quicktime",
  "property-tours": "image/jpeg,image/png",
  "property-docs": "application/pdf,image/jpeg,image/png",
};

const MAX_MB: Record<Bucket, number> = {
  "property-photos": 10,
  "property-videos": 100,
  "property-tours": 25,
  "property-docs": 15,
};

async function uploadOne(bucket: Bucket, userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function validate(bucket: Bucket, file: File): string | null {
  const maxBytes = MAX_MB[bucket] * 1024 * 1024;
  if (file.size > maxBytes) return `Fichier trop volumineux (max ${MAX_MB[bucket]} MB)`;
  const accept = ACCEPTS[bucket].split(",");
  if (file.type && !accept.includes(file.type)) return `Format non autorisé`;
  return null;
}

interface SingleProps {
  bucket: Bucket;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  icon?: "doc" | "video" | "image";
}

export function SingleFileUploader({ bucket, value, onChange, label, icon = "doc" }: SingleProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File) => {
    if (!user) { toast.error("Connexion requise"); return; }
    const err = validate(bucket, file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const url = await uploadOne(bucket, user.id, file);
      onChange(url);
      toast.success("Fichier téléversé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      setBusy(false);
    }
  };

  const Icon = icon === "video" ? Video : icon === "image" ? ImageIcon : FileText;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTS[bucket]}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
      />
      {value ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <Icon size={16} className="text-muted-foreground shrink-0" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs truncate text-tf-blue hover:underline">{value.split("/").pop()}</a>
          <button type="button" onClick={() => onChange("")} className="shrink-0 w-7 h-7 rounded-md bg-background hover:bg-destructive hover:text-white flex items-center justify-center"><X size={12} /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-tf-blue hover:text-tf-blue inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? "Téléversement…" : (label ?? "Téléverser un fichier")}
        </button>
      )}
    </div>
  );
}

interface MultiProps {
  values: string[];
  onChange: (urls: string[]) => void;
  cover?: string;
  onCover?: (url: string) => void;
  max?: number;
}

export function MultiPhotoUploader({ values, onChange, cover, onCover, max = 20 }: MultiProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bucket: Bucket = "property-photos";

  const handle = async (files: FileList) => {
    if (!user) { toast.error("Connexion requise"); return; }
    const remaining = max - values.length;
    if (remaining <= 0) { toast.error(`Maximum ${max} photos`); return; }
    const list = Array.from(files).slice(0, remaining);
    setBusy(true);
    const uploaded: string[] = [];
    for (const f of list) {
      const err = validate(bucket, f);
      if (err) { toast.error(`${f.name}: ${err}`); continue; }
      try {
        const url = await uploadOne(bucket, user.id, f);
        uploaded.push(url);
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "erreur"}`);
      }
    }
    if (uploaded.length) {
      const newList = [...values, ...uploaded];
      onChange(newList);
      if (!cover && onCover && uploaded[0]) onCover(uploaded[0]);
      toast.success(`${uploaded.length} photo(s) ajoutée(s)`);
    }
    setBusy(false);
  };

  const remove = (url: string) => {
    onChange(values.filter((u) => u !== url));
    if (cover === url && onCover) onCover(values.find((u) => u !== url) ?? "");
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTS[bucket]}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handle(e.target.files); e.target.value = ""; }}
      />
      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {values.map((url) => (
            <div key={url} className={`relative group aspect-square rounded-md overflow-hidden border-2 ${cover === url ? "border-tf-amber" : "border-transparent"}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {onCover && cover !== url && (
                  <button type="button" onClick={() => onCover(url)} className="px-2 py-1 text-[10px] bg-white text-black rounded">Couverture</button>
                )}
                <button type="button" onClick={() => remove(url)} className="w-7 h-7 rounded-full bg-white text-destructive flex items-center justify-center"><X size={14} /></button>
              </div>
              {cover === url && <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] rounded bg-tf-amber text-white font-bold">COVER</span>}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || values.length >= max}
        className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-tf-blue hover:text-tf-blue inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {busy ? "Téléversement…" : `Ajouter des photos (${values.length}/${max})`}
      </button>
    </div>
  );
}
