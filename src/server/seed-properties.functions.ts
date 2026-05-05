import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

type Seed = {
  agent: "us" | "africa";
  title_fr: string; title_en: string;
  description_fr: string; description_en: string;
  type: "land" | "house" | "apartment" | "commercial" | "farm";
  price_usd: number; surface_m2?: number; bedrooms?: number; bathrooms?: number;
  country: string; city: string; neighborhood: string; address: string;
  lat: number; lng: number; ai_score: number;
  has_360_tour?: boolean; video_url?: string | null;
  boosted_days?: number; views_count: number; saves_count: number;
  metadata?: Record<string, unknown>;
  images: string[];
};

const PROPERTIES: Seed[] = [
  // ───── USA (12) ─────
  { agent: "us", title_fr: "Maison familiale 4 chambres · Buckhead", title_en: "4-Bedroom Family Home · Buckhead",
    description_fr: "Magnifique maison dans le quartier prisé de Buckhead. Cuisine rénovée, grande terrasse, jardin paysager. À 10 min du centre-ville d'Atlanta.",
    description_en: "Beautiful home in sought-after Buckhead neighborhood. Renovated kitchen, large deck, landscaped yard. 10 min from downtown Atlanta.",
    type: "house", price_usd: 485000, surface_m2: 195, bedrooms: 4, bathrooms: 3,
    country: "US", city: "Atlanta", neighborhood: "Buckhead", address: "2847 Peachtree Rd NE, Atlanta, GA 30305",
    lat: 33.8431, lng: -84.3879, ai_score: 87, has_360_tour: true, boosted_days: 25, views_count: 1842, saves_count: 47,
    images: ["1570129477492-45c003edd2be", "1558618666-fcd25c85cd64", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136", "1583608205776-bfd35f0d9f83"].map(IMG),
    metadata: { mls: "7234891", year_built: 2005, garage: 2 } },
  { agent: "us", title_fr: "Villa moderne · Sugar Land", title_en: "Modern Villa · Sugar Land",
    description_fr: "Villa contemporaine dans la communauté fermée de Sugar Land. Cuisine ouverte, patio couvert. Écoles top-rated.",
    description_en: "Contemporary villa in gated Sugar Land community. Open kitchen, covered patio. Top-rated schools nearby.",
    type: "house", price_usd: 312000, surface_m2: 153, bedrooms: 3, bathrooms: 2,
    country: "US", city: "Houston", neighborhood: "Sugar Land", address: "4521 Sweetwater Blvd, Sugar Land, TX 77479",
    lat: 29.6197, lng: -95.6349, ai_score: 82, views_count: 743, saves_count: 28,
    images: ["1568605114967-8130f3a36994", "1512917774080-9991f1c4c750", "1523217582562-09d0def993a6", "1560448204-e02f11c3d0e2"].map(IMG) },
  { agent: "us", title_fr: "Grande maison · Silver Spring", title_en: "Spacious Home · Silver Spring",
    description_fr: "Superbe propriété 5 chambres. Proche du metro, Washington DC à 20 min. Sous-sol aménagé, garage 2 voitures.",
    description_en: "Stunning 5-bedroom property. Near metro, Washington DC 20 min away. Finished basement, 2-car garage.",
    type: "house", price_usd: 678000, surface_m2: 297, bedrooms: 5, bathrooms: 4,
    country: "US", city: "Silver Spring", neighborhood: "Downtown Silver Spring", address: "1423 Colesville Rd, Silver Spring, MD 20910",
    lat: 38.9947, lng: -77.0264, ai_score: 91, has_360_tour: true, boosted_days: 18, views_count: 2341, saves_count: 89,
    images: ["1583608205776-bfd35f0d9f83", "1564013799919-ab600027ffc6", "1576941089067-2de3c901e126", "1571055107559-3e67626fa8be", "1507089947368-19c1da9775ae"].map(IMG) },
  { agent: "us", title_fr: "Condo 2 chambres · Harlem NYC", title_en: "2BR Condo · Harlem NYC",
    description_fr: "Appartement moderne en plein cœur de Harlem. Vue dégagée, doorman 24h, accès direct au metro.",
    description_en: "Modern condo in the heart of Harlem. Open views, 24h doorman, direct metro access.",
    type: "apartment", price_usd: 595000, surface_m2: 84, bedrooms: 2, bathrooms: 2,
    country: "US", city: "New York", neighborhood: "Harlem", address: "2150 Adam Clayton Powell Jr Blvd, NY 10027",
    lat: 40.8116, lng: -73.9465, ai_score: 79, views_count: 1120, saves_count: 34,
    images: ["1560448204-e02f11c3d0e2", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136"].map(IMG) },
  { agent: "us", title_fr: "Maison 3 chambres · SW Atlanta", title_en: "3BR House · Southwest Atlanta",
    description_fr: "Charmante maison rénovée dans un quartier en plein essor. Cuisine moderne, parquet, grande cour.",
    description_en: "Charming renovated home in booming area. Modern kitchen, hardwood floors, large yard.",
    type: "house", price_usd: 245000, surface_m2: 130, bedrooms: 3, bathrooms: 2,
    country: "US", city: "Atlanta", neighborhood: "Southwest Atlanta", address: "1247 Cascade Rd SW, Atlanta, GA 30311",
    lat: 33.7490, lng: -84.4372, ai_score: 74, views_count: 567, saves_count: 19,
    images: ["1576941089067-2de3c901e126", "1558618666-fcd25c85cd64", "1523217582562-09d0def993a6"].map(IMG) },
  { agent: "us", title_fr: "Bungalow rénové · Decatur", title_en: "Renovated Bungalow · Decatur",
    description_fr: "Adorable bungalow entièrement rénové. Quartier artistique, restaurants à pied, école A+.",
    description_en: "Adorable fully renovated bungalow. Arts district, walkable restaurants, A+ school.",
    type: "house", price_usd: 389000, surface_m2: 149, bedrooms: 3, bathrooms: 2,
    country: "US", city: "Decatur", neighborhood: "Downtown Decatur", address: "892 W Ponce de Leon Ave, Decatur, GA 30030",
    lat: 33.7748, lng: -84.2971, ai_score: 85, views_count: 891, saves_count: 41,
    images: ["1507089947368-19c1da9775ae", "1571055107559-3e67626fa8be", "1570129477492-45c003edd2be"].map(IMG) },
  { agent: "us", title_fr: "Townhouse · Heights Houston", title_en: "Modern Townhouse · Houston Heights",
    description_fr: "Townhouse 3 étages dans le quartier branché des Heights. Rooftop deck avec vue skyline.",
    description_en: "3-story townhouse in trendy Heights. Rooftop deck with skyline view.",
    type: "house", price_usd: 425000, surface_m2: 177, bedrooms: 3, bathrooms: 3,
    country: "US", city: "Houston", neighborhood: "The Heights", address: "1423 Harvard St, Houston, TX 77008",
    lat: 29.8021, lng: -95.3987, ai_score: 83, views_count: 654, saves_count: 22,
    images: ["1564013799919-ab600027ffc6", "1583608205776-bfd35f0d9f83", "1568605114967-8130f3a36994"].map(IMG) },
  { agent: "us", title_fr: "Maison coloniale · Rockville MD", title_en: "Colonial Home · Rockville MD",
    description_fr: "Belle maison coloniale, quartier calme. Sous-sol, jardin clôturé. Metro Red Line à 5 min.",
    description_en: "Beautiful colonial home, quiet area. Basement, fenced yard. Metro Red Line 5 min away.",
    type: "house", price_usd: 549000, surface_m2: 223, bedrooms: 4, bathrooms: 3,
    country: "US", city: "Rockville", neighborhood: "West End", address: "1876 Veirs Mill Rd, Rockville, MD 20851",
    lat: 39.0840, lng: -77.1528, ai_score: 88, views_count: 789, saves_count: 31,
    images: ["1512917774080-9991f1c4c750", "1571055107559-3e67626fa8be", "1507089947368-19c1da9775ae"].map(IMG) },
  { agent: "us", title_fr: "Penthouse · Midtown Atlanta", title_en: "Penthouse · Midtown Atlanta",
    description_fr: "Penthouse exceptionnel avec terrasse panoramique. Vue 360° sur Atlanta, concierge 24h, rooftop pool.",
    description_en: "Exceptional penthouse with panoramic terrace. 360° Atlanta views, 24h concierge, rooftop pool.",
    type: "apartment", price_usd: 1250000, surface_m2: 279, bedrooms: 3, bathrooms: 3,
    country: "US", city: "Atlanta", neighborhood: "Midtown", address: "1065 Peachtree St NE, Atlanta, GA 30309",
    lat: 33.7815, lng: -84.3850, ai_score: 94, has_360_tour: true, boosted_days: 30, views_count: 3421, saves_count: 127,
    images: ["1560448204-e02f11c3d0e2", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136", "1570129477492-45c003edd2be"].map(IMG) },
  { agent: "us", title_fr: "Maison de ville · Alexandria VA", title_en: "Townhouse · Alexandria VA",
    description_fr: "Townhouse 3 niveaux dans le vieux quartier d'Alexandria. Finitions haut de gamme, garage.",
    description_en: "3-level townhouse in historic Old Town Alexandria. High-end finishes, garage.",
    type: "house", price_usd: 789000, surface_m2: 204, bedrooms: 3, bathrooms: 3,
    country: "US", city: "Alexandria", neighborhood: "Old Town", address: "312 King St, Alexandria, VA 22314",
    lat: 38.8048, lng: -77.0426, ai_score: 90, views_count: 1023, saves_count: 55,
    images: ["1523217582562-09d0def993a6", "1576941089067-2de3c901e126", "1558618666-fcd25c85cd64"].map(IMG) },
  { agent: "us", title_fr: "Maison neuve · South End Charlotte", title_en: "New Build · South End Charlotte",
    description_fr: "Construction neuve 2024. Open plan, smart home, finitions premium. À pied des bars.",
    description_en: "2024 new construction. Open plan, smart home, premium finishes. Walking distance to bars.",
    type: "house", price_usd: 465000, surface_m2: 186, bedrooms: 4, bathrooms: 3,
    country: "US", city: "Charlotte", neighborhood: "South End", address: "1200 South Blvd, Charlotte, NC 28203",
    lat: 35.2112, lng: -80.8549, ai_score: 86, views_count: 432, saves_count: 18,
    images: ["1564013799919-ab600027ffc6", "1583608205776-bfd35f0d9f83"].map(IMG) },
  { agent: "us", title_fr: "Ranch style · Plano Dallas", title_en: "Ranch Style Home · Plano Dallas",
    description_fr: "Ranch typique texan dans les meilleures écoles de Plano. Grande piscine, BBQ extérieur, 3 garages.",
    description_en: "Classic Texas ranch in top-rated Plano schools. Large pool, outdoor BBQ, 3-car garage.",
    type: "house", price_usd: 520000, surface_m2: 252, bedrooms: 4, bathrooms: 3,
    country: "US", city: "Plano", neighborhood: "West Plano", address: "4521 Preston Rd, Plano, TX 75093",
    lat: 33.0198, lng: -96.8236, ai_score: 81, views_count: 678, saves_count: 24,
    images: ["1512917774080-9991f1c4c750", "1568605114967-8130f3a36994", "1570129477492-45c003edd2be"].map(IMG) },

  // ───── AFRICA (12) ─────
  { agent: "africa", title_fr: "Lot viabilisé 400m² · Cocody Angré", title_en: "Serviced Plot 400m² · Cocody Angré",
    description_fr: "Magnifique terrain viabilisé. Titre foncier CI-COC-2019-4821 vérifié. Eau, électricité, voie bitumée.",
    description_en: "Beautiful serviced plot. Title deed CI-COC-2019-4821 verified. Water, electricity, paved road.",
    type: "land", price_usd: 72000, surface_m2: 400,
    country: "CI", city: "Abidjan", neighborhood: "Cocody Angré", address: "Lot L-007, Rue des Jardins, Cocody Angré",
    lat: 5.3600, lng: -3.9900, ai_score: 87, boosted_days: 22, views_count: 2847, saves_count: 93,
    images: ["1500382017468-9049fed747ef", "1472214103451-9374bd1c798e", "1518780664697-55e3ad937233", "1574362848149-11496d93a7c7"].map(IMG),
    metadata: { tf_number: "CI-COC-2019-4821", viabilise: true, onig_certified: true } },
  { agent: "africa", title_fr: "Villa contemporaine · Almadies Dakar", title_en: "Contemporary Villa · Almadies Dakar",
    description_fr: "Villa moderne. Vue mer partielle, piscine, jardin tropical, gardien 24h. 4 chambres climatisées.",
    description_en: "Modern villa. Partial sea view, pool, tropical garden, 24h security. 4 AC bedrooms.",
    type: "house", price_usd: 128000, surface_m2: 220, bedrooms: 4, bathrooms: 3,
    country: "SN", city: "Dakar", neighborhood: "Almadies", address: "Villa V-12, Route des Almadies, Dakar",
    lat: 14.7469, lng: -17.5170, ai_score: 91, has_360_tour: true, boosted_days: 15, views_count: 1923, saves_count: 78,
    images: ["1613977257363-707ba9348227", "1564013799919-ab600027ffc6", "1583608205776-bfd35f0d9f83", "1571055107559-3e67626fa8be", "1512917774080-9991f1c4c750"].map(IMG) },
  { agent: "africa", title_fr: "Lot commercial · Airport City Accra", title_en: "Commercial Plot · Airport City Accra",
    description_fr: "Terrain en zone commerciale, face à l'aéroport Kotoka. Indenture deed valide. Accès N1.",
    description_en: "Plot in commercial zone, facing Kotoka airport. Valid indenture deed. N1 highway access.",
    type: "commercial", price_usd: 48000, surface_m2: 500,
    country: "GH", city: "Accra", neighborhood: "Airport City", address: "Plot AC-17, Liberation Rd, Airport City, Accra",
    lat: 5.6037, lng: -0.1870, ai_score: 78, views_count: 892, saves_count: 34,
    images: ["1500382017468-9049fed747ef", "1574362848149-11496d93a7c7", "1472214103451-9374bd1c798e"].map(IMG) },
  { agent: "africa", title_fr: "Villa de standing · Hay Riad Rabat", title_en: "Premium Villa · Hay Riad Rabat",
    description_fr: "Somptueuse villa dans le quartier diplomatique. Marbre, hammam, piscine chauffée. 5 chambres.",
    description_en: "Sumptuous villa in diplomatic district. Marble, hammam, heated pool. 5 bedrooms.",
    type: "house", price_usd: 420000, surface_m2: 310, bedrooms: 5, bathrooms: 4,
    country: "MA", city: "Rabat", neighborhood: "Hay Riad", address: "Villa 47, Rue Ibn Batouta, Hay Riad, Rabat",
    lat: 33.9716, lng: -6.8498, ai_score: 89, has_360_tour: true, boosted_days: 28, views_count: 1547, saves_count: 62,
    images: ["1613977257363-707ba9348227", "1560448204-e02f11c3d0e2", "1583608205776-bfd35f0d9f83", "1571055107559-3e67626fa8be"].map(IMG) },
  { agent: "africa", title_fr: "Appartement vue mer · Plateau Abidjan", title_en: "Sea View Apartment · Plateau Abidjan",
    description_fr: "Appartement 3 pièces 12ème étage avec vue panoramique sur la lagune. Gardiennage, parking.",
    description_en: "3-room apartment 12th floor with panoramic lagoon view. Security, parking.",
    type: "apartment", price_usd: 85000, surface_m2: 98, bedrooms: 3, bathrooms: 2,
    country: "CI", city: "Abidjan", neighborhood: "Le Plateau", address: "Immeuble Les Palmiers, Blvd de la République, Plateau",
    lat: 5.3167, lng: -4.0167, ai_score: 82, views_count: 734, saves_count: 29,
    images: ["1484154218962-a197022b5858", "1560448204-e02f11c3d0e2", "1556909114-f6e7ad7d3136"].map(IMG) },
  { agent: "africa", title_fr: "Villa moderne · Lekki Phase 1 Lagos", title_en: "Modern Villa · Lekki Phase 1 Lagos",
    description_fr: "Villa 4 chambres, sécurité 24h, CCTV, groupe électrogène. Certificate of Occupancy disponible.",
    description_en: "4-bedroom villa, 24h security, CCTV, generator. Certificate of Occupancy available.",
    type: "house", price_usd: 195000, surface_m2: 285, bedrooms: 4, bathrooms: 4,
    country: "NG", city: "Lagos", neighborhood: "Lekki Phase 1", address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    lat: 6.4421, lng: 3.5852, ai_score: 85, views_count: 1123, saves_count: 45,
    images: ["1613977257363-707ba9348227", "1564013799919-ab600027ffc6", "1583608205776-bfd35f0d9f83"].map(IMG) },
  { agent: "africa", title_fr: "Terrain 600m² · Bonanjo Douala", title_en: "Plot 600m² · Bonanjo Douala",
    description_fr: "Terrain dans le quartier des affaires. Titre foncier solide. Vue Wouri. Tous réseaux.",
    description_en: "Plot in business district. Solid title deed. Wouri river view. All utilities.",
    type: "land", price_usd: 65000, surface_m2: 600,
    country: "CM", city: "Douala", neighborhood: "Bonanjo", address: "Lot B-23, Rue du Commerce, Bonanjo, Douala",
    lat: 4.0483, lng: 9.6966, ai_score: 76, views_count: 456, saves_count: 17,
    images: ["1500382017468-9049fed747ef", "1518780664697-55e3ad937233"].map(IMG) },
  { agent: "africa", title_fr: "Appartement moderne · Westlands Nairobi", title_en: "Modern Apartment · Westlands Nairobi",
    description_fr: "Appartement 3 chambres dans résidence sécurisée. Piscine, gym, parking couvert. Title deed valide.",
    description_en: "3-bedroom apartment in secure residence. Pool, gym, covered parking. Valid title deed.",
    type: "apartment", price_usd: 112000, surface_m2: 145, bedrooms: 3, bathrooms: 2,
    country: "KE", city: "Nairobi", neighborhood: "Westlands", address: "Westview Apartments, Westlands Rd, Nairobi",
    lat: -1.2641, lng: 36.8022, ai_score: 80, views_count: 678, saves_count: 28,
    images: ["1560448204-e02f11c3d0e2", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136"].map(IMG) },
  { agent: "africa", title_fr: "Riad authentique · Médina Marrakech", title_en: "Authentic Riad · Medina Marrakech",
    description_fr: "Riad traditionnel 8 chambres. Patio central avec fontaine, terrasse panoramique, hammam privatif.",
    description_en: "Traditional 8-room riad. Central courtyard with fountain, panoramic terrace, private hammam.",
    type: "house", price_usd: 285000, surface_m2: 380, bedrooms: 8, bathrooms: 6,
    country: "MA", city: "Marrakech", neighborhood: "Médina", address: "Riad Dar Nour, Derb Sidi Bouamar, Marrakech",
    lat: 31.6295, lng: -7.9897, ai_score: 88, views_count: 1456, saves_count: 67,
    images: ["1566073771259-6a8506099945", "1540541338537-1220dba5d364", "1571003123894-1f0594d2b5d9"].map(IMG) },
  { agent: "africa", title_fr: "Villa avec piscine · Bingerville", title_en: "Pool Villa · Bingerville",
    description_fr: "Villa 5 chambres avec piscine à débordement. Vue lagune Ebrié. Gardien, groupe électrogène.",
    description_en: "5-bedroom villa with infinity pool. Ebrié lagoon view. Security, generator.",
    type: "house", price_usd: 145000, surface_m2: 320, bedrooms: 5, bathrooms: 4,
    country: "CI", city: "Abidjan", neighborhood: "Bingerville", address: "Villa L-14, Route de Bingerville, Abidjan",
    lat: 5.3500, lng: -3.8833, ai_score: 84, has_360_tour: true, views_count: 987, saves_count: 43,
    images: ["1613977257363-707ba9348227", "1512917774080-9991f1c4c750", "1564013799919-ab600027ffc6", "1574362848149-11496d93a7c7"].map(IMG) },
  { agent: "africa", title_fr: "Terrain bord de mer · Ngor Dakar", title_en: "Seafront Plot · Ngor Dakar",
    description_fr: "Terrain exceptionnel en première ligne de mer. Vue panoramique océan Atlantique. Rare opportunité.",
    description_en: "Exceptional seafront plot. Panoramic Atlantic Ocean view. Rare opportunity.",
    type: "land", price_usd: 98000, surface_m2: 350,
    country: "SN", city: "Dakar", neighborhood: "Ngor", address: "Lot N-03, Front de Mer, Ngor, Dakar",
    lat: 14.7647, lng: -17.5319, ai_score: 92, views_count: 1234, saves_count: 58,
    images: ["1518495973542-4542c06a5843", "1500382017468-9049fed747ef", "1472214103451-9374bd1c798e"].map(IMG) },
  { agent: "africa", title_fr: "Appartement neuf · Kiyovu Kigali", title_en: "New Apartment · Kiyovu Kigali",
    description_fr: "Appartement 2 chambres résidence neuve 2024. Vue collines, fibre, parking. Leasehold 99 ans.",
    description_en: "2-bedroom apartment in new 2024 residence. Hill views, fiber, parking. 99-year leasehold.",
    type: "apartment", price_usd: 68000, surface_m2: 95, bedrooms: 2, bathrooms: 2,
    country: "RW", city: "Kigali", neighborhood: "Kiyovu", address: "Kiyovu Heights, KG 5 Ave, Kiyovu, Kigali",
    lat: -1.9441, lng: 30.0588, ai_score: 83, views_count: 543, saves_count: 22,
    images: ["1484154218962-a197022b5858", "1560448204-e02f11c3d0e2"].map(IMG) },
];

export const seedRealisticProperties = createServerFn({ method: "POST" }).handler(async () => {
  // Find existing demo agents (created by seed.functions.ts)
  const { data: agentRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["agent", "broker"]);

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .like("email", "%@demo.tf");

  const findAgent = (emailFragment: string): string | undefined =>
    profiles?.find((p) => p.email?.includes(emailFragment))?.id;

  let usAgent = findAgent("marcus.johnson");
  let africaAgent = findAgent("kouadio.yao");

  if (!usAgent || !africaAgent) {
    return { ok: false, error: "Demo agents not found. Run seedDemoData first.", usAgent, africaAgent, agentRoleCount: agentRoles?.length ?? 0 };
  }

  // Wipe previous demo properties (those owned by these agents)
  await supabaseAdmin.from("properties").delete().in("agent_id", [usAgent, africaAgent]);

  const rows = PROPERTIES.map((p) => ({
    agent_id: p.agent === "us" ? usAgent! : africaAgent!,
    title: p.title_en,
    title_fr: p.title_fr,
    title_en: p.title_en,
    description: `${p.description_fr}\n\n${p.description_en}`,
    description_fr: p.description_fr,
    description_en: p.description_en,
    type: p.type,
    status: "active" as const,
    price_usd: p.price_usd,
    surface_m2: p.surface_m2 ?? null,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    country: p.country,
    city: p.city,
    neighborhood: p.neighborhood,
    address: p.address,
    lat: p.lat, lng: p.lng,
    ai_score: p.ai_score,
    tf_verified: true,
    cover_url: p.images[0],
    images: p.images,
    has_360_tour: p.has_360_tour ?? false,
    video_url: p.video_url ?? null,
    boosted_until: p.boosted_days ? new Date(Date.now() + p.boosted_days * 86400000).toISOString() : null,
    views_count: p.views_count,
    saves_count: p.saves_count,
    metadata: (p.metadata ?? {}) as never,
  }));

  const { data, error } = await supabaseAdmin.from("properties").insert(rows as never).select("id");
  if (error) throw error;
  return { ok: true, inserted: data?.length ?? 0 };
});
