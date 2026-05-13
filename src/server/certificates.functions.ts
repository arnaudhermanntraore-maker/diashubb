import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const generatePropertyCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ propertyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: prop, error } = await supabaseAdmin
      .from("properties")
      .select("id, title, city, country, type, price_usd, tf_verified, ai_score, agent_id, created_at")
      .eq("id", data.propertyId)
      .single();
    if (error || !prop) throw new Error("Property not found");

    const { data: agent } = await supabaseAdmin
      .from("profiles").select("full_name, email").eq("id", prop.agent_id).single();

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.047, 0.267, 0.486);
    const amber = rgb(0.937, 0.624, 0.153);
    const gray = rgb(0.4, 0.4, 0.4);

    // Header
    page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: navy });
    page.drawText("Diashubb", { x: 40, y: 800, size: 28, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Certificat de propriete", { x: 40, y: 778, size: 11, font, color: rgb(0.85, 0.9, 1) });

    // Verified badge
    if (prop.tf_verified) {
      page.drawRectangle({ x: 440, y: 790, width: 115, height: 30, color: amber, borderWidth: 0 });
      page.drawText("TF VERIFIED", { x: 458, y: 800, size: 12, font: bold, color: rgb(1, 1, 1) });
    }

    // Title
    let y = 720;
    page.drawText(prop.title.slice(0, 60), { x: 40, y, size: 20, font: bold, color: navy });
    y -= 25;
    page.drawText(`${prop.city ?? "—"}, ${prop.country}`, { x: 40, y, size: 12, font, color: gray });

    // Details
    y -= 50;
    const rows: [string, string][] = [
      ["ID", prop.id],
      ["Type", prop.type],
      ["Prix USD", `$${Number(prop.price_usd).toLocaleString()}`],
      ["Score IA", String(prop.ai_score ?? "—")],
      ["Verification Diashubb", prop.tf_verified ? "VERIFIE" : "Non verifie"],
      ["Agent", agent?.full_name ?? "—"],
      ["Email agent", agent?.email ?? "—"],
      ["Date creation", new Date(prop.created_at).toLocaleDateString("fr-FR")],
    ];
    for (const [k, v] of rows) {
      page.drawText(k, { x: 40, y, size: 10, font: bold, color: gray });
      page.drawText(String(v).slice(0, 70), { x: 200, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 22;
    }

    // Mention legale
    y -= 40;
    page.drawText("Ce document atteste de l'existence de cette annonce sur la plateforme Diashubb", {
      x: 40, y, size: 9, font, color: gray,
    });
    y -= 14;
    page.drawText("au moment de l'edition. Il ne constitue pas un titre de propriete officiel.", {
      x: 40, y, size: 9, font, color: gray,
    });

    // Footer
    const issuedAt = new Date().toISOString();
    const refCode = `TF-${prop.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 50, color: rgb(0.97, 0.97, 0.98) });
    page.drawText(`Reference: ${refCode}`, { x: 40, y: 28, size: 9, font: bold, color: navy });
    page.drawText(`Edite le ${new Date().toLocaleString("fr-FR")} - Demandeur: ${userId.slice(0, 8)}`, {
      x: 40, y: 14, size: 8, font, color: gray,
    });

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "certificate_generated",
      metadata: { property_id: prop.id, ref: refCode, issued_at: issuedAt },
    });

    const bytes = await pdf.save();
    const base64 = btoa(String.fromCharCode(...bytes));
    return { base64, filename: `${refCode}.pdf`, ref: refCode };
  });
