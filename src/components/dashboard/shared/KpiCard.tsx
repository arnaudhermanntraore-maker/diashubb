import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "blue" | "green" | "amber" | "purple";

const toneMap: Record<Tone, { bg: string; fg: string; ring: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", fg: "text-blue-600 dark:text-blue-400", ring: "ring-blue-200/60" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", fg: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-200/60" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", fg: "text-amber-600 dark:text-amber-400", ring: "ring-amber-200/60" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", fg: "text-purple-600 dark:text-purple-400", ring: "ring-purple-200/60" },
};

interface Props {
  tone: Tone;
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  trend?: string;
  badge?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export function KpiCard({ tone, icon: Icon, value, label, trend, badge, ctaLabel, ctaTo }: Props) {
  const t = toneMap[tone];
  return (
    <div className={`rounded-2xl p-5 border border-border ${t.bg} relative shadow-sm`}>
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-background ${t.fg} mb-3`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-display font-bold leading-tight">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
      {trend && <div className={`text-xs mt-2 ${t.fg} font-medium`}>{trend}</div>}
      {badge && <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white">{badge}</span>}
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className={`text-xs font-semibold mt-3 inline-block ${t.fg} hover:underline`}>
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
