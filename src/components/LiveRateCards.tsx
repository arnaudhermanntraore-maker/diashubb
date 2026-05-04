import { useTranslation } from "react-i18next";
import { CURRENCIES, formatRateOneUSD } from "@/lib/currencies";

const FEATURED: { currency: string; country: string }[] = [
  { currency: "XOF", country: "CI" },
  { currency: "XOF", country: "SN" },
  { currency: "GHS", country: "GH" },
  { currency: "NGN", country: "NG" },
  { currency: "MAD", country: "MA" },
  { currency: "XAF", country: "CM" },
  { currency: "KES", country: "KE" },
  { currency: "ZAR", country: "ZA" },
];

interface Props {
  selected?: { currency: string; country: string };
  onSelect?: (currency: string, country: string) => void;
}

export function LiveRateCards({ selected, onSelect }: Props) {
  const { i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#111827", marginBottom: 8 }}>
        {fr ? "Taux du jour" : "Today's rates"}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {FEATURED.map(({ currency: cc, country: co }) => {
          const cu = CURRENCIES.find((c) => c.code === cc);
          if (!cu) return null;
          const country = cu.countries.find((x) => x.code === co);
          if (!country) return null;
          const isSel = selected?.currency === cc && selected?.country === co;
          const tp = cu.trend * 100;
          const trend =
            tp > 0.05 ? { text: `↑ +${tp.toFixed(1)}%`, color: "#0F6E56" } :
            tp < -0.05 ? { text: `↓ ${tp.toFixed(1)}%`, color: "#C0282D" } :
            { text: fr ? "→ Stable" : "→ Stable", color: "#9CA3AF" };
          return (
            <button
              key={`${cc}-${co}`}
              onClick={() => onSelect?.(cc, co)}
              className="shrink-0 transition-colors text-left"
              style={{
                background: isSel ? "#F0F7FF" : "white",
                border: `0.5px solid ${isSel ? "#185FA5" : "#E5E7EB"}`,
                borderRadius: 10,
                padding: "10px 12px",
                minWidth: 130,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "#185FA5"; e.currentTarget.style.background = "#F0F7FF"; } }}
              onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "white"; } }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 18, lineHeight: 1 }}>{country.flag}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{cu.code}</span>
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{country.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F6E56", marginTop: 4 }}>{formatRateOneUSD(cu.code)}</div>
              <div style={{ fontSize: 10, color: trend.color, marginTop: 2 }}>{trend.text}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
