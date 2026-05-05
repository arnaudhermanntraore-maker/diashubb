import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PartnerAppSchema = z.object({
  kind: z.enum(["contractor", "broker", "agent", "surveyor"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(40).regex(/^[+\d\s().-]+$/, "Invalid phone"),
  specialty: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  experience_years: z.number().int().min(0).max(80).optional(),
  license_number: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  document_url: z.string().url().max(1000).optional().or(z.literal("")),
  user_id: z.string().uuid().optional(),
});

export const submitPartnerApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PartnerAppSchema.parse(input))
  .handler(async ({ data }) => {
    const { error, data: row } = await supabaseAdmin
      .from("partner_applications")
      .insert({
        kind: data.kind,
        name: data.name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty || null,
        city: data.city || null,
        region: data.region || null,
        experience_years: data.experience_years ?? null,
        license_number: data.license_number || null,
        bio: data.bio || null,
        document_url: data.document_url || null,
        user_id: data.user_id ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[partner-application] insert failed", error);
      throw new Error("Submission failed");
    }
    return { id: row.id };
  });
