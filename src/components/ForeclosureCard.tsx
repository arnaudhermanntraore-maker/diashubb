import { Link } from "@tanstack/react-router";
import { typeBadge, daysUntil, type Foreclosure } from "@/lib/foreclosures";
import { useTranslation } from "react-i18next";

export function ForeclosureCard({ f }: { f: Foreclosure }) {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const t = typeBadge(f.foreclosure_type);
  const photo = f.photos?.[0];
  const auctionDays = daysUntil(f.auction_date);
  const savings = f.estimated_market_value && f.listing_price ? f.estimated_market_value - f.listing_price : 0;

  return (
    <Link to="/foreclosures/$id" params={{ id: f.id }} className="block bg-white rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition group">
      <div className="relative h-40 bg-muted">
        {photo && <img src={photo} alt={f.address} className="w-full h-full object-cover group-hover:scale-105 transition" />}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded text-white" style={{ background: t.bg }}>
          {t.emoji} {t.label}
        </span>
        {f.discount_percent && f.discount_percent > 10 && (
          <span className="absolute top-2 right-2 bg-white text-[11px] font-medium px-2 py-1 rounded" style={{ color: "#DC2626" }}>
            -{Math.round(f.discount_percent)}% {fr ? "marché" : "market"}
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {f.fha_eligible && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-600 text-white">FHA ✓</span>}
          {f.va_eligible && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">VA ✓</span>}
          {f.financing_available?.includes("Cash only") && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-white">Cash only</span>}
        </div>
        {auctionDays !== null && auctionDays >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[11px] font-semibold px-2 py-1 text-center">
            🔨 {fr ? `Enchère dans ${auctionDays} jours` : `Auction in ${auctionDays} days`} · {new Date(f.auction_date!).toLocaleDateString(fr ? "fr-FR" : "en-US", { month: "short", day: "numeric" })}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[13px] font-medium text-gray-900 truncate">{f.address}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{f.city}, {f.state} {f.zip_code ?? ""}</div>
        <div className="text-[11px] text-gray-500 mt-1">
          {f.bedrooms ?? "?"}bd · {f.bathrooms ?? "?"}ba · {f.surface_sqft?.toLocaleString() ?? "?"} sqft{f.year_built ? ` · ${f.year_built}` : ""}
        </div>
        <div className="mt-2">
          <div className="text-[16px] font-semibold" style={{ color: "#DC2626" }}>
            ${Number(f.listing_price ?? 0).toLocaleString()}
          </div>
          {f.estimated_market_value && (
            <div className="text-[11px] text-gray-400 line-through">${Number(f.estimated_market_value).toLocaleString()} {fr ? "valeur estimée" : "estimated value"}</div>
          )}
          {savings > 0 && (
            <div className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
              {fr ? "Économie" : "You save"} ${savings.toLocaleString()} · -{Math.round(f.discount_percent ?? 0)}%
            </div>
          )}
        </div>
        {f.ai_investment_score !== null && (
          <div className="mt-2 text-[11px] text-gray-600">
            {fr ? "Score IA" : "AI Score"}: <strong>{f.ai_investment_score}/100</strong>
          </div>
        )}
        {f.lender_name && (
          <div className="mt-1 text-[11px] text-gray-500">🏦 {f.lender_name}</div>
        )}
      </div>
    </Link>
  );
}
