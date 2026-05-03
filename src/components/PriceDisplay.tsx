import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  getLocalCurrency,
  formatUSD,
  formatLocal,
  loadCurrencyRates,
  subscribeCurrencyRates,
} from "@/lib/currency";

interface Props {
  priceUsd: number;
  country: string;
  className?: string;
  style?: React.CSSProperties;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({ priceUsd, country, className = "", style, size = "lg" }: Props) {
  const [, setTick] = useState(0);
  const [showUsd, setShowUsd] = useState(false);

  useEffect(() => {
    loadCurrencyRates().then(() => setTick((n) => n + 1));
    const unsub = subscribeCurrencyRates(() => setTick((n) => n + 1));
    return () => { unsub; };
  }, []);

  const local = getLocalCurrency(country);
  const sizes = { sm: "text-base", md: "text-lg", lg: "text-xl" };

  if (!local) {
    return <span className={`font-bold font-display ${sizes[size]} ${className}`} style={style}>{formatUSD(priceUsd)}</span>;
  }

  const primary = showUsd ? formatUSD(priceUsd) : formatLocal(priceUsd, local);
  const secondary = showUsd ? formatLocal(priceUsd, local) : formatUSD(priceUsd);

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowUsd((v) => !v); }}
      className={`group inline-flex items-baseline gap-1.5 ${className}`}
      style={style}
      title={`Voir en ${showUsd ? local.code : "USD"}`}
    >
      <span className={`font-bold font-display ${sizes[size]}`} style={style}>{primary}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-0.5 group-hover:text-foreground">
        <ArrowLeftRight size={9} /> {secondary}
      </span>
    </button>
  );
}
