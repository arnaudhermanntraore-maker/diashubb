import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface QuickAction {
  label: string;
  to: string;
  icon?: ReactNode;
  tone?: "primary" | "green" | "amber" | "blue" | "outline";
}

const tones: Record<NonNullable<QuickAction["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  amber: "bg-amber-500 text-white hover:bg-amber-600",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-border bg-background hover:bg-muted",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {actions.map((a, i) => (
        <Link
          key={i}
          to={a.to}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold ${tones[a.tone ?? "outline"]}`}
        >
          {a.icon}
          {a.label}
        </Link>
      ))}
    </div>
  );
}
