import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type Property } from "@/components/PropertyCard";

interface Props {
  region: "us" | "africa";
  limit?: number;
}

const ADD_TO = {
  us: "/listings_/new",
  africa: "/listings_/new",
} as const;
const ADD_SEARCH = {
  us: undefined,
  africa: { continent: "africa" as const },
};

const SELECT = "id,title,title_fr,title_en,country,city,neighborhood,price_usd,type,cover_url,images,ai_score,tf_verified,bedrooms,bathrooms,surface_m2,has_360_tour,lat,lng,boosted_until";

export function FeaturedPropertiesRow({ region, limit = 4 }: Props) {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const [items, setItems] = useState<Property[] | null>(null);

  useEffect(() => {
    let q = supabase
      .from("properties")
      .select(SELECT)
      .eq("status", "active")
      .order("boosted_until", { ascending: false, nullsFirst: false })
      .order("ai_score", { ascending: false })
      .limit(limit);
    q = region === "us" ? q.eq("country", "US") : q.neq("country", "US");
    q.then(({ data, error }) => {
      if (error) { setItems([]); return; }
      setItems((data ?? []) as Property[]);
    });
  }, [region, limit]);

  if (items === null) {
    return (
      <>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
        ))}
        <AddCard label={region === "us" ? (fr ? "Lister un bien" : "List a property") : (fr ? "Lister en Afrique" : "List in Africa")} />
      </>
    );
  }

  return (
    <>
      {items.map((p) => <PropertyCard key={p.id} p={p} />)}
      <AddCard label={region === "us" ? (fr ? "Lister un bien" : "List a property") : (fr ? "Lister en Afrique" : "List in Africa")} />
    </>
  );
}

function AddCard({ label }: { label: string }) {
  return (
    <Link
      to="/listings_/new"
      className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      <Plus size={28} />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
