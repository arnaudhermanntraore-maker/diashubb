import { CheckCircle2, Building2, Star } from "lucide-react";

export type PlanKey = "starter" | "pro" | "business" | "enterprise";

const BADGES: Record<PlanKey, { fr: string; en: string; bg: string; color: string; Icon: typeof Building2 }> = {
  starter:    { fr: "Agence Diashubb",  en: "Diashubb Agency", bg: "#F3F4F6", color: "#6B7280", Icon: Building2 },
  pro:        { fr: "Agent Pro Certifié",  en: "Pro Certified Agent", bg: "#EFF6FF", color: "#185FA5", Icon: CheckCircle2 },
  business:   { fr: "Agence Certifiée",    en: "Certified Agency",    bg: "#E1F5EE", color: "#0F6E56", Icon: CheckCircle2 },
  enterprise: { fr: "Partenaire Officiel", en: "Official Partner",    bg: "#FEFCE8", color: "#854D0E", Icon: Star },
};

export function PlanBadge({ planKey, size = "sm", lang = "fr" }: { planKey: PlanKey; size?: "sm" | "md"; lang?: "fr" | "en" }) {
  const b = BADGES[planKey] ?? BADGES.starter;
  const Icon = b.Icon;
  const sm = size === "sm";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-medium"
      style={{
        background: b.bg,
        color: b.color,
        padding: sm ? "2px 8px" : "4px 12px",
        fontSize: sm ? 10 : 12,
      }}
    >
      <Icon size={sm ? 10 : 12} />
      {lang === "fr" ? b.fr : b.en}
    </span>
  );
}
