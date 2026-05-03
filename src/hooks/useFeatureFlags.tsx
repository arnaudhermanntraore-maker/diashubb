import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FlagRow {
  key: string;
  enabled: boolean;
  label_fr: string | null;
  label_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  category: string | null;
  updated_at: string;
}

interface Ctx {
  flags: Record<string, boolean>;
  rows: FlagRow[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const FlagsCtx = createContext<Ctx>({ flags: {}, rows: [], loading: true, refresh: async () => {} });

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("feature_flags").select("key,enabled,label_fr,label_en,description_fr,description_en,category,updated_at");
    setRows((data ?? []) as FlagRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("feature_flags-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_flags" }, () => load())
      .subscribe();
    const i = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(i); };
  }, []);

  const flags: Record<string, boolean> = {};
  for (const r of rows) flags[r.key] = r.enabled;

  return <FlagsCtx.Provider value={{ flags, rows, loading, refresh: load }}>{children}</FlagsCtx.Provider>;
}

export function useFlags() {
  return useContext(FlagsCtx);
}

export function useFeatureFlag(key: string): boolean {
  const { flags } = useContext(FlagsCtx);
  return flags[key] ?? false;
}
