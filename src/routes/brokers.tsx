import { createFileRoute } from "@tanstack/react-router";
import { PartnerDirectory, type PartnerCard } from "@/components/PartnerDirectory";

export const Route = createFileRoute("/brokers")({
  head: () => ({
    meta: [
      { title: "Courtiers Diashubb — gagnez des commissions" },
      { name: "description", content: "Réseau de courtiers bi-continentaux entre USA et Afrique." },
    ],
  }),
  component: BrokersPage,
});

const BROKERS: PartnerCard[] = [
  {
    id: "brk-diaspora-capital",
    initials: "DC",
    avatarColor: "var(--tf-blue)",
    badge: { label: "Certifié Diashubb", tone: "green" },
    name: "Diaspora Capital Brokers",
    location: "New York, NY · USA",
    region: "usa",
    speciality: "Investissement · Cross-border",
    listings: 76,
    rating: 4.9,
    reviews: 18,
    since: 2022,
    languages: ["EN", "FR"],
    online: true,
    certified: true,
    featured: true,
  },
  {
    id: "brk-saharan",
    initials: "SB",
    avatarColor: "#7C3AED",
    badge: { label: "Vérifié", tone: "blue" },
    name: "Saharan Brokerage",
    location: "Rabat, MA · Afrique",
    region: "africa",
    speciality: "Commercial · Hôtelier",
    listings: 42,
    rating: 4.7,
    since: 2021,
    languages: ["FR", "AR"],
  },
  {
    id: "brk-accra-link",
    initials: "AL",
    avatarColor: "var(--tf-green)",
    badge: { label: "Certifié Diashubb", tone: "green" },
    name: "Accra Link Brokers",
    location: "Accra, GH · Afrique",
    region: "africa",
    speciality: "Résidentiel · Diaspora UK/US",
    listings: 51,
    rating: 4.8,
    since: 2023,
    languages: ["EN"],
    certified: true,
    online: true,
  },
  {
    id: "brk-md-bridge",
    initials: "MB",
    avatarColor: "#EF9F27",
    badge: { label: "Vérifié", tone: "blue" },
    name: "Maryland Bridge Realty",
    location: "Silver Spring, MD · USA",
    region: "usa",
    speciality: "Premier acheteur · FHA",
    listings: 88,
    rating: 4.9,
    since: 2020,
    languages: ["EN", "FR"],
  },
];

function BrokersPage() {
  return (
    <PartnerDirectory
      title="Courtiers bi-continentaux Diashubb"
      subtitle="Trouvez un courtier qui négocie pour vous entre USA et Afrique."
      searchPlaceholder="Rechercher un courtier..."
      cards={BROKERS}
      ctaTitle="Vous êtes courtier en immobilier ?"
      ctaText="Rejoignez Diashubb, gagnez des commissions sur les transactions de la diaspora."
      ctaButton="Devenir courtier partenaire"
      steps={[
        { title: "Créez votre profil de courtier", text: "Licences vérifiées, badge Diashubb." },
        { title: "Sourcez acheteurs et biens", text: "Outils CRM, leads bi-continentaux, FX intégré." },
        { title: "Touchez vos commissions escrow", text: "Paiement sécurisé dès la clôture du dossier." },
      ]}
      partnerKind="broker"
    />
  );
}
