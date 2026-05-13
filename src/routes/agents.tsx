import { createFileRoute } from "@tanstack/react-router";
import { PartnerDirectory, type PartnerCard } from "@/components/PartnerDirectory";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agences immobilières certifiées — Diashubb" },
      { name: "description", content: "Trouvez un agent de confiance pour votre achat aux USA ou en Afrique." },
    ],
  }),
  component: AgentsPage,
});

const AGENCIES: PartnerCard[] = [
  {
    id: "agency-afriimmo",
    initials: "AI",
    avatarColor: "var(--tf-blue)",
    badge: { label: "Certifié Diashubb", tone: "green" },
    name: "AfriImmo Group",
    location: "Atlanta, GA · USA",
    region: "usa",
    speciality: "Achat · Vente · Diaspora",
    listings: 147,
    rating: 4.9,
    reviews: 23,
    since: 2023,
    languages: ["FR", "EN"],
    online: true,
    certified: true,
    featured: true,
  },
  {
    id: "agency-ndiaye",
    initials: "ND",
    avatarColor: "#7C3AED",
    badge: { label: "Vérifié", tone: "blue" },
    name: "N'Diaye Immobilier",
    location: "Dakar, Sénégal · Afrique",
    region: "africa",
    speciality: "Terrains · Villas · Investissement",
    listings: 89,
    rating: 4.8,
    since: 2022,
    languages: ["FR"],
  },
  {
    id: "agency-kouassi",
    initials: "KR",
    avatarColor: "var(--tf-green)",
    badge: { label: "Certifié Diashubb", tone: "green" },
    name: "Kouassi Realty",
    location: "Abidjan, CI · Afrique",
    region: "africa",
    speciality: "Résidentiel · Commercial",
    listings: 63,
    rating: 4.7,
    since: 2023,
    languages: ["FR", "EN"],
    online: true,
    certified: true,
  },
  {
    id: "agency-premium-atl",
    initials: "PA",
    avatarColor: "#EF9F27",
    badge: { label: "Vérifié", tone: "blue" },
    name: "Premium Atlanta Homes",
    location: "Atlanta, GA · USA",
    region: "usa",
    speciality: "Luxury · First-time buyers",
    listings: 211,
    rating: 4.9,
    since: 2021,
    languages: ["EN", "FR"],
  },
];

function AgentsPage() {
  return (
    <PartnerDirectory
      title="Agences immobilières certifiées"
      subtitle="Trouvez un agent de confiance pour votre achat aux USA ou en Afrique."
      searchPlaceholder="Rechercher une agence..."
      cards={AGENCIES}
      ctaTitle="Vous êtes agent ou agence immobilière ?"
      ctaText="Rejoignez Diashubb et accédez à 44M+ d'acheteurs de la diaspora africaine."
      ctaButton="Devenir partenaire"
      steps={[
        { title: "Créez votre profil certifié", text: "Vérification KYC et badge Diashubb en 48h." },
        { title: "Publiez vos annonces FR/EN", text: "Outil bilingue, photos 360°, score IA inclus." },
        { title: "Recevez des leads qualifiés", text: "Acheteurs vérifiés, messagerie sécurisée." },
      ]}
      partnerKind="agent"
    />
  );
}
