import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Public endpoint called by pg_cron to sync HUD foreclosure listings.
// Security: requires CRON_SECRET in Authorization header (Bearer).
// In production, replace the mock fetch with the real HUD Open Data API.

type HudRecord = {
  source_reference: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface_sqft?: number;
  year_built?: number;
  listing_price?: number;
  estimated_market_value?: number;
  listing_date?: string;
  photos?: string[];
  lat?: number;
  lng?: number;
  fha_eligible?: boolean;
  va_eligible?: boolean;
  financing_available?: string[];
};

async function fetchHudListings(): Promise<HudRecord[]> {
  // HUD Homes Open Data (HUD provides ArcGIS-based feeds).
  // Endpoint kept configurable via env; falls back to a small mock for demos.
  const url = process.env.HUD_FEED_URL;
  if (!url) {
    return [
      {
        source_reference: `HUD-DEMO-${Date.now()}`,
        address: "1420 Peachtree St NE",
        city: "Atlanta",
        state: "GA",
        zip_code: "30309",
        property_type: "single_family",
        bedrooms: 3,
        bathrooms: 2,
        surface_sqft: 1650,
        year_built: 1998,
        listing_price: 142000,
        estimated_market_value: 245000,
        listing_date: new Date().toISOString().slice(0, 10),
        fha_eligible: true,
        financing_available: ["FHA", "203k"],
        photos: [],
      },
    ];
  }

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HUD feed failed: ${res.status}`);
  const json: any = await res.json();

  const features: any[] = json.features ?? json.results ?? json.data ?? [];
  return features.map((f) => {
    const a = f.attributes ?? f.properties ?? f;
    const geom = f.geometry ?? {};
    return {
      source_reference: String(a.case_number ?? a.CASE_NUMBER ?? a.id ?? a.OBJECTID),
      address: a.address ?? a.ADDRESS ?? a.street ?? "",
      city: a.city ?? a.CITY ?? "",
      state: (a.state ?? a.STATE ?? "").toString().slice(0, 2).toUpperCase(),
      zip_code: a.zip ?? a.ZIP ?? a.zip_code,
      property_type: a.property_type ?? a.TYPE ?? "single_family",
      bedrooms: Number(a.bedrooms ?? a.BEDROOMS) || undefined,
      bathrooms: Number(a.bathrooms ?? a.BATHROOMS) || undefined,
      surface_sqft: Number(a.sqft ?? a.SQFT) || undefined,
      year_built: Number(a.year_built ?? a.YEAR_BUILT) || undefined,
      listing_price: Number(a.list_price ?? a.LIST_PRICE ?? a.price) || undefined,
      estimated_market_value: Number(a.market_value ?? a.MARKET_VALUE) || undefined,
      listing_date: a.list_date ?? a.LIST_DATE,
      lat: geom.y ?? geom.lat ?? a.lat,
      lng: geom.x ?? geom.lng ?? a.lng,
      fha_eligible: Boolean(a.fha ?? a.FHA_ELIGIBLE ?? true),
      va_eligible: Boolean(a.va ?? a.VA_ELIGIBLE ?? false),
      financing_available: a.financing ? String(a.financing).split(",") : ["FHA"],
      photos: [],
    };
  });
}

async function handle(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET;
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const startedAt = Date.now();
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  try {
    const records = await fetchHudListings();

    for (const r of records) {
      const payload = {
        source: "hud",
        source_reference: r.source_reference,
        foreclosure_type: "hud_home",
        foreclosure_stage: "reo",
        country_code: "US",
        status: "active",
        address: r.address,
        city: r.city,
        state: r.state,
        zip_code: r.zip_code,
        property_type: r.property_type,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        surface_sqft: r.surface_sqft,
        year_built: r.year_built,
        listing_price: r.listing_price,
        estimated_market_value: r.estimated_market_value,
        listing_date: r.listing_date,
        lat: r.lat,
        lng: r.lng,
        fha_eligible: r.fha_eligible ?? true,
        va_eligible: r.va_eligible ?? false,
        financing_available: r.financing_available ?? ["FHA"],
        photos: r.photos ?? [],
        raw_data: r as any,
        last_synced_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("foreclosures")
        .select("id")
        .eq("source", "hud")
        .eq("source_reference", r.source_reference)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("foreclosures")
          .update(payload)
          .eq("id", existing.id);
        if (error) failed++;
        else updated++;
      } else {
        const { error } = await supabase.from("foreclosures").insert(payload);
        if (error) failed++;
        else inserted++;
      }
    }

    await supabase.from("audit_logs").insert({
      action: "hud_sync",
      metadata: {
        inserted,
        updated,
        failed,
        total: records.length,
        duration_ms: Date.now() - startedAt,
      },
    });

    return Response.json({ ok: true, inserted, updated, failed, total: records.length });
  } catch (e: any) {
    await supabase.from("audit_logs").insert({
      action: "hud_sync_error",
      metadata: { message: String(e?.message ?? e) },
    });
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-hud")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
