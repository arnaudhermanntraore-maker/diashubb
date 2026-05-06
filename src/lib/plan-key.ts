import { z } from "zod";

export const PLAN_KEYS = ["starter", "pro", "business", "enterprise"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const planKeySchema = z.enum(PLAN_KEYS);

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && (PLAN_KEYS as readonly string[]).includes(v);
}

/** Localized fallback label when plan_key is invalid/unknown. */
export function planKeyFallbackLabel(lang: "fr" | "en" = "fr"): string {
  return lang === "fr" ? "Plan inconnu" : "Unknown plan";
}

/**
 * Validate a plan_key for persistence. Returns a discriminated result with a
 * localized message when invalid so callers can both refuse the write and
 * surface a friendly fallback in the UI.
 */
export function validatePlanKey(
  value: unknown,
  lang: "fr" | "en" = "fr",
): { ok: true; planKey: PlanKey } | { ok: false; fallback: string; reason: string } {
  const parsed = planKeySchema.safeParse(value);
  if (parsed.success) return { ok: true, planKey: parsed.data };
  return {
    ok: false,
    fallback: planKeyFallbackLabel(lang),
    reason:
      lang === "fr"
        ? `Valeur de plan invalide : ${String(value)}. Plans autorisés : ${PLAN_KEYS.join(", ")}.`
        : `Invalid plan value: ${String(value)}. Allowed plans: ${PLAN_KEYS.join(", ")}.`,
  };
}
