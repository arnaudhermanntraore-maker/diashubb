import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

// ---- Admin RBAC helpers ----------------------------------------------------

function rateError(code: string, status: number, message: string): Response {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function assertSuperAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["super_admin"]);
  if (error) {
    console.error("assertSuperAdmin error", error);
    throw rateError("RATES_FORBIDDEN", 403, "Forbidden");
  }
  if (!data || data.length === 0) {
    throw rateError("RATES_FORBIDDEN", 403, "super_admin required");
  }
}

const rateSchema = z.object({
  currency_code: z.string().regex(/^[A-Z]{3}$/, "ISO 4217 (3 uppercase letters)"),
  rate_from_usd: z.number().positive().lt(1_000_000),
  trend_24h: z.number().min(-1).max(1),
});

// Upsert a rate (insert if missing, update by currency_code)
export const upsertRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error, data: row } = await supabaseAdmin
      .from("rate_config")
      .upsert(
        {
          currency_code: data.currency_code,
          rate_from_usd: data.rate_from_usd,
          trend_24h: data.trend_24h,
          source: "manual",
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "currency_code" }
      )
      .select()
      .single();
    if (error) {
      console.error("upsertRate error", error);
      throw new Response(error.message, { status: 400 });
    }
    return { ok: true as const, row };
  });

export const deleteRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ currency_code: z.string().regex(/^[A-Z]{3}$/) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("rate_config")
      .delete()
      .eq("currency_code", data.currency_code);
    if (error) {
      console.error("deleteRate error", error);
      throw new Response(error.message, { status: 400 });
    }
    return { ok: true as const };
  });
