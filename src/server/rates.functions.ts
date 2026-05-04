import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface RateRow {
  currency_code: string;
  rate_from_usd: number;
  trend_24h: number;
  updated_at: string;
}

export const getRates = createServerFn({ method: "GET" }).handler(async (): Promise<{ rates: RateRow[]; updatedAt: string | null }> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("rate_config")
      .select("currency_code, rate_from_usd, trend_24h, updated_at")
      .order("currency_code");
    if (error) {
      console.error("getRates error", error);
      return { rates: [], updatedAt: null };
    }
    const rows = (data ?? []) as RateRow[];
    const updatedAt = rows.reduce<string | null>((acc, r) => (!acc || r.updated_at > acc ? r.updated_at : acc), null);
    return { rates: rows, updatedAt };
  } catch (e) {
    console.error("getRates exception", e);
    return { rates: [], updatedAt: null };
  }
});
