import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Role = "buyer" | "agent" | "broker" | "contractor" | "surveyor";

const DEMO_USERS: Array<{
  email: string;
  password: string;
  full_name: string;
  country: string;
  lang_pref: "fr" | "en";
  role: Role;
}> = [
  { email: "aminata.diallo@demo.tf", password: "DemoPass!2026", full_name: "Aminata Diallo", country: "SN", lang_pref: "fr", role: "buyer" },
  { email: "kouadio.yao@demo.tf",    password: "DemoPass!2026", full_name: "Kouadio Yao",    country: "CI", lang_pref: "fr", role: "agent" },
  { email: "marcus.johnson@demo.tf", password: "DemoPass!2026", full_name: "Marcus Johnson", country: "US", lang_pref: "en", role: "broker" },
  { email: "fatou.ndiaye@demo.tf",   password: "DemoPass!2026", full_name: "Fatou Ndiaye",   country: "SN", lang_pref: "fr", role: "contractor" },
  { email: "sarah.williams@demo.tf", password: "DemoPass!2026", full_name: "Sarah Williams", country: "US", lang_pref: "en", role: "surveyor" },
];

export const isDatabaseEmpty = createServerFn({ method: "GET" }).handler(async () => {
  const { count } = await supabaseAdmin.from("properties").select("*", { count: "exact", head: true });
  return { empty: (count ?? 0) === 0 };
});

export const seedDemoData = createServerFn({ method: "POST" }).handler(async () => {
  // Idempotency guard
  const { count } = await supabaseAdmin.from("properties").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { ok: true, skipped: true, reason: "already-seeded" };

  // 1) Create auth users (or fetch existing) and ensure profile + role
  const userIds: Record<Role, string> = {} as Record<Role, string>;

  for (const u of DEMO_USERS) {
    let userId: string | undefined;

    const created = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, lang_pref: u.lang_pref },
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      // Likely "already registered" — list and find
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list?.users.find((x) => x.email === u.email)?.id;
    }
    if (!userId) throw new Error(`Could not provision demo user ${u.email}`);

    userIds[u.role] = userId;

    // Profile (handle_new_user trigger usually creates one; upsert to set country/verified)
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: u.email,
      full_name: u.full_name,
      country: u.country,
      lang_pref: u.lang_pref,
      verified: true,
    });

    // Ensure role (trigger adds 'buyer' by default; add the demo role too)
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role }).then(() => {});
  }

  // 2) Properties — 4 Africa, 4 USA
  const agent = userIds.agent;
  const broker = userIds.broker;

  const properties = [
    { agent_id: agent, country: "CI", city: "Abidjan", type: "house" as const, price_usd: 285000, lat: 5.3599, lng: -3.9968, ai_score: 88,
      title: "Villa moderne à Cocody / Modern villa in Cocody",
      description: "FR: Magnifique villa de 4 chambres avec piscine au cœur de Cocody. Quartier sécurisé, proche des écoles internationales.\nEN: Stunning 4-bedroom villa with pool in the heart of Cocody, Abidjan. Secure neighborhood near international schools.",
      cover_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800" },
    { agent_id: agent, country: "SN", city: "Dakar", type: "land" as const, price_usd: 145000, lat: 14.7392, lng: -17.5066, ai_score: 82,
      title: "Terrain titré Almadies / Titled land in Almadies",
      description: "FR: Terrain de 600 m² avec titre foncier à Almadies, Dakar. Vue sur l'océan, idéal pour résidence de standing.\nEN: 600 sqm titled land in Almadies, Dakar. Ocean view, ideal for upscale residence.",
      cover_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800" },
    { agent_id: agent, country: "GH", city: "Accra", type: "apartment" as const, price_usd: 175000, lat: 5.6266, lng: -0.1668, ai_score: 79,
      title: "Appartement East Legon / East Legon apartment",
      description: "FR: Appartement 3 pièces meublé à East Legon, Accra. Résidence sécurisée avec piscine et salle de sport.\nEN: Furnished 3-bedroom apartment in East Legon, Accra. Gated community with pool and gym.",
      cover_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800" },
    { agent_id: agent, country: "MA", city: "Marrakech", type: "house" as const, price_usd: 320000, lat: 31.6295, lng: -7.9811, ai_score: 91,
      title: "Riad rénové Marrakech / Restored riad in Marrakech",
      description: "FR: Riad traditionnel rénové dans la médina de Marrakech. 5 chambres, patio avec fontaine, terrasse panoramique.\nEN: Restored traditional riad in Marrakech medina. 5 bedrooms, patio with fountain, panoramic rooftop.",
      cover_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800" },
    { agent_id: broker, country: "US", city: "Atlanta", type: "house" as const, price_usd: 695000, lat: 33.8490, lng: -84.3700, ai_score: 86,
      title: "Buckhead townhouse — Atlanta, GA",
      description: "EN: Elegant 3-story townhouse in Buckhead, Atlanta. 4 BR, 3.5 BA, rooftop terrace, walking distance to Lenox.\nFR: Élégante maison de ville sur 3 niveaux à Buckhead. 4 chambres, 3,5 sdb, terrasse panoramique.",
      cover_url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800" },
    { agent_id: broker, country: "US", city: "Houston", type: "house" as const, price_usd: 525000, lat: 29.7989, lng: -95.3985, ai_score: 81,
      title: "The Heights bungalow — Houston, TX",
      description: "EN: Charming craftsman bungalow in Houston Heights. 3 BR, 2 BA, large backyard, fully renovated 2024.\nFR: Charmant bungalow dans Houston Heights. 3 chambres, 2 sdb, grand jardin, entièrement rénové en 2024.",
      cover_url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800" },
    { agent_id: broker, country: "US", city: "New York", type: "apartment" as const, price_usd: 1250000, lat: 40.7128, lng: -73.9573, ai_score: 94,
      title: "Brooklyn loft — New York, NY",
      description: "EN: Industrial-style loft in Williamsburg, Brooklyn. 2 BR, 2 BA, exposed brick, panoramic Manhattan views.\nFR: Loft industriel à Williamsburg, Brooklyn. 2 chambres, 2 sdb, briques apparentes, vue sur Manhattan.",
      cover_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800" },
    { agent_id: broker, country: "US", city: "Bethesda", type: "house" as const, price_usd: 1095000, lat: 38.9847, lng: -77.0947, ai_score: 89,
      title: "Bethesda colonial — Maryland",
      description: "EN: Classic colonial in Bethesda, MD. 5 BR, 4 BA, half-acre lot, top-rated school district, 20 min to DC.\nFR: Maison coloniale classique à Bethesda, MD. 5 chambres, 4 sdb, terrain 2000 m², excellentes écoles.",
      cover_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800" },
  ].map((p) => ({ ...p, status: "active" as const, tf_verified: true }));

  const { data: insertedProps, error: pErr } = await supabaseAdmin
    .from("properties").insert(properties).select("id, country, city");
  if (pErr) throw pErr;

  const cocody = insertedProps?.find((p) => p.city === "Abidjan")?.id;
  const brooklyn = insertedProps?.find((p) => p.city === "New York")?.id;
  if (!cocody || !brooklyn) throw new Error("Property seed lookup failed");

  // 3) Messages
  const enc = (s: string) => Buffer.from(s, "utf8").toString("base64");
  await supabaseAdmin.from("messages").insert([
    { sender_id: userIds.buyer, receiver_id: userIds.agent, property_id: cocody,
      content_encrypted: enc("Bonjour, la villa de Cocody est-elle toujours disponible ?") },
    { sender_id: userIds.agent, receiver_id: userIds.buyer, property_id: cocody,
      content_encrypted: enc("Oui, elle est disponible. Souhaitez-vous une visite ce week-end ?") },
    { sender_id: userIds.buyer, receiver_id: userIds.broker, property_id: brooklyn,
      content_encrypted: enc("Hi Marcus — interested in the Brooklyn loft. Can we schedule a virtual tour?") },
  ]);

  // 4) Transactions (2 escrowed)
  await supabaseAdmin.from("transactions").insert([
    { buyer_id: userIds.buyer, seller_id: userIds.agent, property_id: cocody,
      amount_usd: 14250, method: "stripe", status: "escrowed", external_ref: "cs_demo_cocody_001" },
    { buyer_id: userIds.buyer, seller_id: userIds.broker, property_id: brooklyn,
      amount_usd: 62500, method: "stripe", status: "escrowed", external_ref: "cs_demo_brooklyn_002" },
  ]);

  // 5) Feature flags
  await supabaseAdmin.from("feature_flags").upsert([
    { key: "payments_stripe",   enabled: true,  description: "Enable Stripe deposits & escrow (USA)",   target_countries: ["US"] },
    { key: "payments_cinetpay", enabled: false, description: "Enable CinetPay (Africa) — coming soon",  target_countries: ["CI","SN","GH","MA"] },
    { key: "mapbox_enabled",    enabled: true,  description: "Show interactive Mapbox map on listings" },
    { key: "chatbot_enabled",   enabled: true,  description: "Floating Claude assistant on all pages" },
    { key: "ai_property_score", enabled: false, description: "Show AI score on property cards (beta)",  target_roles: ["admin","super_admin"] },
  ], { onConflict: "key" });

  return { ok: true, users: DEMO_USERS.length, properties: properties.length };
});
