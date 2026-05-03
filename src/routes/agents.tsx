import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Users, HardHat, Compass, Briefcase, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "Agents & Pros — TerraFrique" }] }),
  component: Agents,
});

function Agents() {
  const { t } = useTranslation();
  const groups = [
    { icon: Users, key: "agents", title: "Real-estate agents", text: "Certified to list and represent properties on TerraFrique." },
    { icon: HardHat, key: "contractors", title: "Contractors", text: "Vetted builders for renovations, new construction, inspections." },
    { icon: Compass, key: "surveyors", title: "Surveyors", text: "Title verification and land surveys — the backbone of TF Verified." },
    { icon: Briefcase, key: "brokers", title: "Brokers", text: "Earn commissions by sourcing buyers across continents." },
  ];
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-display font-bold">Join our network</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">{t("hero.subtitle")}</p>
      <div className="grid md:grid-cols-2 gap-5 mt-10">
        {groups.map((g) => (
          <div key={g.key} className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><g.icon size={22} /></div>
            <h2 className="font-display text-xl font-semibold">{g.title}</h2>
            <p className="text-sm text-muted-foreground mt-2">{g.text}</p>
            <Link to="/auth" className="mt-4 inline-flex items-center gap-1 text-primary font-medium text-sm">Register <ArrowRight size={14} /></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
