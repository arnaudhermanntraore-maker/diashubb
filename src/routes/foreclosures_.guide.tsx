import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/foreclosures_/guide")({
  head: () => ({
    meta: [
      { title: "How to buy a foreclosure — Diashubb" },
      { name: "description", content: "Complete guide to buying foreclosure properties: HUD, REO, auction and pre-foreclosure." },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { i18n } = useTranslation();
  const fr = i18n.language === "fr";

  const steps = [
    {
      n: 1,
      title: fr ? "Comprendre les types" : "Understand the types",
      body: fr
        ? "HUD (gouvernement, FHA), REO (banque), Enchères (cash), Pré-saisie (négociation directe). Chaque type a ses avantages et risques."
        : "HUD (government, FHA), REO (bank-owned), Auctions (cash), Pre-foreclosure (direct negotiation). Each type has pros and cons.",
    },
    {
      n: 2,
      title: fr ? "Préparer le financement" : "Get financing ready",
      body: fr
        ? "Lettre de pré-approbation requise. FHA : 3,5% d'apport. VA : 0% (vétérans). Enchères : cash uniquement."
        : "Pre-approval letter required. FHA: 3.5% down. VA: 0% (veterans). Auction: cash or certified funds only.",
    },
    {
      n: 3,
      title: fr ? "Inspecter avant d'acheter" : "Inspect before buying",
      body: fr
        ? "Vendu en l'état (AS-IS). Engagez un inspecteur ($300–500). Prévoyez 10–20% du prix pour les travaux."
        : "Sold AS-IS. Hire an inspector ($300–500). Budget 10–20% of the price for repairs.",
    },
    {
      n: 4,
      title: fr ? "Faire votre offre" : "Make your offer",
      body: fr
        ? "HUD : enchère en ligne sur hudhomestore.gov. REO : offre standard via agent. Enchère : inscription + dépôt requis."
        : "HUD: online bid at hudhomestore.gov. REO: standard offer through agent. Auction: register + deposit required.",
    },
    {
      n: 5,
      title: fr ? "Conclure l'achat" : "Close the deal",
      body: fr
        ? "Recherche de titre obligatoire. Assurance titre recommandée. Frais de clôture : 2–5% du prix. Délai : 30–90 jours."
        : "Title search mandatory. Title insurance recommended. Closing costs: 2–5% of price. Timeline: 30–90 days.",
    },
  ];

  const faqs = [
    { q: fr ? "Qu'est-ce qu'un bien HUD ?" : "What is a HUD home?", a: fr ? "Une propriété FHA saisie, vendue par le gouvernement américain. Éligible à la plupart des financements." : "An FHA-insured property foreclosed by the US government. Eligible for most financing types." },
    { q: fr ? "Puis-je financer une enchère ?" : "Can I finance an auction property?", a: fr ? "Non, les enchères exigent généralement du cash ou des fonds certifiés sous 30 jours." : "No, auctions typically require cash or certified funds within 30 days." },
    { q: fr ? "Y a-t-il des risques cachés ?" : "Are there hidden risks?", a: fr ? "Oui : titre douteux, dégâts non visibles, occupants illégaux. Faites toujours une inspection et une recherche de titre." : "Yes: title defects, hidden damage, illegal occupants. Always inspect and run a title search." },
    { q: fr ? "La diaspora peut-elle acheter ?" : "Can diaspora buyers purchase?", a: fr ? "Oui. Aucune restriction de nationalité pour acheter aux États-Unis." : "Yes. There are no nationality restrictions on buying property in the US." },
    { q: fr ? "Combien coûtent les rénovations en moyenne ?" : "What do renovations typically cost?", a: fr ? "Entre $20 et $50 par sqft selon l'état. Notre IA fournit une estimation par bien." : "Between $20–$50 per sqft depending on condition. Our AI provides per-property estimates." },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="text-white py-12" style={{ background: "linear-gradient(135deg,#7F1D1D,#DC2626)" }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            {fr ? "Comment acheter un bien en saisie" : "How to buy a foreclosure"}
          </h1>
          <p className="mt-3 text-sm md:text-base opacity-90">
            {fr ? "Guide complet en 5 étapes pour acheter une saisie aux États-Unis en toute confiance." : "Complete 5-step guide to buying a US foreclosure with confidence."}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4 items-start bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0">{s.n}</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                <p className="text-sm text-gray-700 mt-1">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-display font-bold mt-12 mb-4">{fr ? "Questions fréquentes" : "Frequently asked questions"}</h2>
        <Accordion type="single" collapsible className="bg-gray-50 rounded-xl px-4">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-gray-700">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12 py-10 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
          <h3 className="text-xl font-semibold text-red-900">{fr ? "Prêt à trouver votre bien ?" : "Ready to find your foreclosure?"}</h3>
          <Link to="/foreclosures" className="inline-block mt-4 bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition">
            {fr ? "Parcourir les saisies →" : "Browse foreclosures →"}
          </Link>
        </div>
      </section>
    </div>
  );
}
