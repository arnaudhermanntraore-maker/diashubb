import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const COUNTRIES = [
  "US", "CA", "FR", "GB",
  "SN", "CI", "CM", "BJ", "TG", "ML", "BF", "GN", "GA", "CD", "CG",
  "MA", "TN", "DZ", "EG", "NG", "GH", "KE", "RW", "ZA", "ET", "TZ", "UG",
] as const;

const AgencySchema = z.object({
  name: z.string().trim().min(2).max(120),
  legal_name: z.string().trim().max(180).optional().or(z.literal("")),
  registration_number: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.enum(COUNTRIES),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(40).regex(/^[+0-9 ()\-.]+$/, "Invalid phone"),
  email: z.string().trim().email().max(255),
  website: z.string().trim().url().max(255).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const registerAgency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AgencySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("agencies")
      .select("id, status")
      .eq("owner_id", userId)
      .maybeSingle();

    if (existing) {
      return { ok: false as const, error: "already_registered", status: existing.status };
    }

    const payload = {
      owner_id: userId,
      name: data.name,
      legal_name: data.legal_name || null,
      registration_number: data.registration_number || null,
      country: data.country,
      city: data.city || null,
      address: data.address || null,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      description: data.description || null,
      status: "pending",
    };

    const { data: created, error } = await supabase
      .from("agencies")
      .insert(payload)
      .select("id, status")
      .single();

    if (error) {
      return { ok: false as const, error: error.message };
    }

    // Best-effort: grant agent role so user can begin onboarding once verified.
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "agent" })
      .then(() => undefined, () => undefined);

    return { ok: true as const, id: created.id, status: created.status };
  });
