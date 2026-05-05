import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STATUSES = ["pending", "reviewing", "approved", "rejected"] as const;

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Forbidden");
}

export const listPartnerApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      status: z.enum(["all", ...STATUSES]).default("all"),
      kind: z.enum(["all", "contractor", "broker", "agent", "surveyor"]).default("all"),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("partner_applications")
      .select("id,kind,name,email,phone,specialty,city,region,experience_years,license_number,bio,document_url,status,created_at,updated_at,user_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const updatePartnerApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(STATUSES),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("partner_applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "partner_application.status_change",
      metadata: { application_id: data.id, status: data.status },
    });
    return { ok: true };
  });

// Returns a fresh short-lived signed URL for an application's document.
// Accepts either a stored signed URL or a raw object path.
export const getPartnerApplicationDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("partner_applications")
      .select("document_url")
      .eq("id", data.id)
      .single();
    if (error || !row?.document_url) throw new Error("No document on file");

    // Extract object path inside the partner-docs bucket
    let path = row.document_url;
    const marker = "/partner-docs/";
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      path = path.substring(idx + marker.length).split("?")[0];
    }

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("partner-docs")
      .createSignedUrl(decodeURIComponent(path), 60 * 5); // 5-minute access
    if (sErr || !signed?.signedUrl) {
      // Fallback: return stored URL
      return { url: row.document_url };
    }
    return { url: signed.signedUrl };
  });
