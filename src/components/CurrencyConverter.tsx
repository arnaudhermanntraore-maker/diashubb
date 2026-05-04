import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, ArrowUpDown, ChevronDown, Search, X } from "lucide-react";
import { CURRENCIES, convertFromUSD, findCurrency, formatLocal, formatRateOneUSD } from "@/lib/currencies";
import { useAuth } from "@/hooks/useAuth";
import { useLiveRates, liveRate } from "@/hooks/useLiveRates";

const QUICK = [100, 500, 1000, 5000, 10000];
const FEE_USD = 12;

interface Props {
  initialCurrency?: string;
  initialCountry?: string;
  initialAmount?: number;
}

export function CurrencyConverter({ initialCurrency = "XOF", initialCountry = "CI", initialAmount = 1000 }: Props) {
  const { t, i18n } = useTranslation();
  const fr = i18n.language?.startsWith("fr");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number>(initialAmount);
  const [currencyCode, setCurrencyCode] = useState<string>(initialCurrency);
  const [countryCode, setCountryCode] = useState<string>(initialCountry);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [swapped, setSwapped] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currency = findCurrency(currencyCode)!;
  const country = currency.countries.find((c) => c.code === countryCode) ?? currency.countries[0];
  const converted = convertFromUSD(amount, currencyCode);
  const trendPct = currency.trend * 100;

  // Close dropdown
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    setTimeout(() => searchRef.current?.focus(), 50);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Flat list of country options with currency context
  const options = useMemo(() => {
    const list: { country: CountryEntry; currency: CurrencyEntry }[] = [];
    for (const c of CURRENCIES) for (const co of c.countries) list.push({ country: co, currency: c });
    return list;
  }, []);

  type CountryEntry = (typeof CURRENCIES)[number]["countries"][number];
  type CurrencyEntry = (typeof CURRENCIES)[number];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(({ country, currency }) =>
      country.name.toLowerCase().includes(q) ||
      currency.name.toLowerCase().includes(q) ||
      currency.code.toLowerCase().includes(q) ||
      currency.symbol.toLowerCase().includes(q),
    );
  }, [options, query]);

  const popular = options.filter((o) => o.country.popular);

  const select = (currCode: string, ctyCode: string) => {
    setCurrencyCode(currCode);
    setCountryCode(ctyCode);
    setOpen(false);
    setQuery("");
  };

  const onSend = () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/transfers?amount=${amount}&currency=${currencyCode}` } as any });
      return;
    }
    navigate({ to: "/transfers" as any, search: { amount, currency: currencyCode } as any }).catch(() => {
      window.location.href = `/transfers?amount=${amount}&currency=${currencyCode}`;
    });
  };

  const total = amount + FEE_USD;

  const trendLabel =
    trendPct > 0.05 ? { text: `↑ +${trendPct.toFixed(1)}% ${fr ? "vs hier" : "vs yesterday"}`, color: "#0F6E56" } :
    trendPct < -0.05 ? { text: `↓ ${trendPct.toFixed(1)}% ${fr ? "vs hier" : "vs yesterday"}`, color: "#C0282D" } :
    { text: fr ? "→ Stable" : "→ Stable", color: "#9CA3AF" };

  const labelSend = fr ? "Vous envoyez" : "You send";
  const labelReceive = fr ? "Ils reçoivent" : "They receive";

  return (
    <div
      className="mx-auto bg-white"
      style={{ border: "0.5px solid #E5E7EB", borderRadius: 16, padding: 20, maxWidth: 520, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-[18px] h-[18px]" style={{ color: "#185FA5" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>
            {fr ? "Convertisseur de devises" : "Currency converter"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 10, color: "#085041", background: "#E1F5EE", borderRadius: 20, padding: "3px 10px" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#0F6E56" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#0F6E56" }} />
            </span>
            {fr ? "Taux en direct" : "Live rates"}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{fr ? "Mis à jour: il y a 2 min" : "Updated: 2 min ago"}</span>
        </div>
      </div>

      {/* FROM (USD) */}
      <Row label={labelSend}>
        <div className="flex items-center" style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" }}>
          <div className="flex items-center gap-2 pr-3" style={{ borderRight: "0.5px solid #E5E7EB" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>🇺🇸</span>
            <div className="leading-tight">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>USD</div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>US Dollar</div>
            </div>
          </div>
          <input
            type="number"
            value={Number.isFinite(amount) ? amount : ""}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            placeholder="0"
            className="w-full bg-transparent border-0 outline-none text-right tabular-nums"
            style={{ fontSize: 22, fontWeight: 500, color: "#111827", marginLeft: 12 }}
            min={0}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {QUICK.map((q) => {
            const active = q === amount;
            return (
              <button
                key={q}
                onClick={() => setAmount(q)}
                style={{
                  background: active ? "#E6F1FB" : "white",
                  border: `0.5px solid ${active ? "#185FA5" : "#E5E7EB"}`,
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 11,
                  color: active ? "#185FA5" : "#6B7280",
                  fontWeight: active ? 500 : 400,
                  cursor: "pointer",
                }}
              >${q.toLocaleString("en-US")}</button>
            );
          })}
        </div>
      </Row>

      {/* Swap */}
      <div className="flex justify-center" style={{ margin: "10px 0" }}>
        <button
          onClick={() => setSwapped((s) => !s)}
          aria-label={fr ? "Inverser" : "Swap"}
          className="group flex items-center justify-center transition-all"
          style={{ width: 36, height: 36, borderRadius: "50%", background: "white", border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
        >
          <ArrowUpDown
            className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
            style={{ color: "#185FA5", transform: swapped ? "rotate(180deg)" : undefined }}
          />
        </button>
      </div>

      {/* TO */}
      <Row label={labelReceive}>
        <div className="relative" ref={dropRef}>
          <div className="flex items-center" style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 16px" }}>
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 pr-3 focus:outline-none" style={{ borderRight: "0.5px solid #E5E7EB" }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{country.flag}</span>
              <div className="leading-tight text-left">
                <div className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {currency.code} <ChevronDown className="w-3 h-3" style={{ color: "#6B7280" }} />
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{country.name}</div>
              </div>
            </button>
            <div className="w-full text-right tabular-nums" style={{ fontSize: 22, fontWeight: 500, color: "#0F6E56", marginLeft: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
              {formatLocal(converted, currencyCode)}
            </div>
          </div>

          {open && (
            <div
              className="absolute left-0 right-0 z-50 overflow-hidden"
              style={{ marginTop: 4, background: "white", border: "0.5px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
            >
              <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ borderBottom: "0.5px solid #F3F4F6" }}>
                <Search className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={fr ? "Rechercher un pays..." : "Search country..."}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 13, color: "#111827" }}
                />
                {query && <button onClick={() => setQuery("")}><X className="w-4 h-4" style={{ color: "#9CA3AF" }} /></button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {!query && popular.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", margin: "8px 14px 4px", letterSpacing: 0.5 }}>
                      {fr ? "Populaires" : "Popular"}
                    </div>
                    {popular.map(({ country: co, currency: cu }) => (
                      <Option key={`p-${co.code}`} co={co} cu={cu} selected={cu.code === currencyCode && co.code === countryCode} onClick={() => select(cu.code, co.code)} />
                    ))}
                    <div style={{ height: 1, background: "#F3F4F6", margin: "6px 0" }} />
                  </>
                )}
                {filtered.length === 0 ? (
                  <div className="text-center py-8" style={{ fontSize: 12, color: "#9CA3AF" }}>{fr ? "Aucun résultat" : "No results"}</div>
                ) : (
                  filtered
                    .slice()
                    .sort((a, b) => a.country.name.localeCompare(b.country.name))
                    .map(({ country: co, currency: cu }) => (
                      <Option key={`${cu.code}-${co.code}`} co={co} cu={cu} selected={cu.code === currencyCode && co.code === countryCode} onClick={() => select(cu.code, co.code)} />
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </Row>

      {/* Rate row */}
      <div className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: "0.5px solid #F3F4F6" }}>
        <div style={{ fontSize: 12, color: "#6B7280" }}>
          1 USD = <span style={{ fontWeight: 700, color: "#111827" }}>{formatRateOneUSD(currencyCode)}</span>
        </div>
        <div style={{ fontSize: 12, color: trendLabel.color }}>{trendLabel.text}</div>
      </div>

      {/* Fee */}
      <div className="flex justify-between" style={{ padding: "6px 0", fontSize: 12 }}>
        <span style={{ color: "#111827" }}>{fr ? "Frais TerraFrique" : "TerraFrique fee"}</span>
        <span style={{ color: "#6B7280" }}>${FEE_USD.toFixed(2)} {fr ? "fixe" : "flat"}</span>
      </div>

      {/* Total */}
      <div className="flex justify-between" style={{ padding: "6px 0", fontSize: 12, fontWeight: 500 }}>
        <span style={{ color: "#111827" }}>{fr ? "Total débité" : "Total debited"}</span>
        <span style={{ color: "#111827" }}>${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
      </div>

      {/* Recipient receives */}
      <div className="flex items-center justify-between" style={{ background: "#E1F5EE", borderRadius: 8, padding: "10px 14px", margin: "8px 0" }}>
        <span style={{ fontSize: 12, color: "#085041" }}>{fr ? "Montant reçu" : "Amount received"}</span>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#0F6E56" }}>{formatLocal(converted, currencyCode)}</span>
      </div>

      {/* CTA */}
      <button
        onClick={onSend}
        className="w-full transition-opacity hover:opacity-90"
        style={{ background: "#1D9E75", color: "white", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 500, marginTop: 12 }}
      >
        {fr ? "Envoyer maintenant →" : "Send now →"}
      </button>

      <div className="text-center" style={{ fontSize: 10, color: "#9CA3AF", marginTop: 8 }}>
        {fr
          ? "Taux indicatifs mis à jour quotidiennement. Taux définitif confirmé à l'envoi."
          : "Indicative rates updated daily. Final rate confirmed at time of sending."}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Option({ co, cu, selected, onClick }: {
  co: { code: string; name: string; flag: string };
  cu: { code: string; name: string; symbol: string; rate: number };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 transition-colors"
      style={{
        padding: "10px 14px",
        background: selected ? "#E6F1FB" : "transparent",
        borderLeft: selected ? "3px solid #185FA5" : "3px solid transparent",
        textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget.style.background = "#F9FAFB"); }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget.style.background = "transparent"); }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{co.flag}</span>
      <div className="flex-1 leading-tight">
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{co.name}</div>
        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{cu.name} · {cu.code}</div>
      </div>
      <div style={{ fontSize: 12, color: "#0F6E56", whiteSpace: "nowrap" }}>1 USD = {formatRateOneUSD(cu.code)}</div>
    </button>
  );
}
