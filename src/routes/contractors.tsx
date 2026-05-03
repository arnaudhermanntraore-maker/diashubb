import { createFileRoute } from "@tanstack/react-router";
import { PartnerDirectory, type PartnerCard } from "@/components/PartnerDirectory";

export const Route = createFileRoute("/contractors")({
  head: () => ({
    meta: [
      { title: "Artisans & entrepreneurs certifiés — TerraFrique" },
      { name: "description", content: "Trouvez un artisan vérifié pour vos travaux aux USA et en Afrique." },
    ],
  }),
  component: ContractorsPage,
});

const CONTRACTORS: PartnerCard[] = [
  {
    id: "ctr-batisseurs",
    initials: "BC",
    avatarColor: "var(--tf-blue)",
    badge: { label: "Certifié TerraFrique", tone: "green" },
    name: "Bâtisseurs CI",
    location: "Abidjan, CI · Afrique",
    region: "africa",
    speciality: "Construction · Rénovation · Villas",
    listings: 58,
    rating: 4.9,
    reviews: 41,
    since: 2022,
    languages: ["FR", "EN"],
    online: true,
    certified: true,
    featured: true,
  },
  {
    id: "ctr-atl-renovate",
    initials: "AR",
    avatarColor: "#7C3AED",
    badge: { label: "Vérifié", tone: "blue" },
    name: "Atlanta Renovate Co.",
    location: "Atlanta, GA · USA",
    region: "usa",
    speciality: "Kitchen · Bath · ADU",
    listings: 92,
    rating: 4.8,
    since: 2021,
    languages: ["EN"],
  },
  {
    id: "ctr-sahel",
    initials: "SB",
    avatarColor: "var(--tf-green)",
    badge: { label: "Certifié TerraFrique", tone: "green" },
    name: "Sahel Build",
    location: "Dakar, SN · Afrique",
    region: "africa",
    speciality: "Gros œuvre · Maçonnerie",
    listings: 34,
    rating: 4.7,
    since: 2023,
    languages: ["FR"],
    certified: true,
  },
  {
    id: "ctr-houston-pro",
    initials: "HP",
    avatarColor: "#EF9F27",
    badge: { label: "Vérifié", tone: "blue" },
    name: "Houston Pro Builders",
    location: "Houston, TX · USA",
    region: "usa",
    speciality: "New construction · Roofing",
    listings: 117,
    rating: 4.9,
    since: 2020,
    languages: ["EN", "ES"],
    online: true,
  },
];

function ContractorsPage() {
  return (
    <PartnerDirectory
      title="Artisans & entrepreneurs certifiés"
      subtitle="Trouvez un artisan de confiance pour vos travaux aux USA ou en Afrique."
      searchPlaceholder="Rechercher un artisan..."
      cards={CONTRACTORS}
      ctaTitle="Vous êtes artisan ou entreprise du bâtiment ?"
      ctaText="Rejoignez TerraFrique et recevez des chantiers qualifiés de la diaspora africaine."
      ctaButton="Devenir partenaire"
      steps={[
        { title: "Créez votre profil vérifié", text: "Licences, assurances et avis vérifiés." },
        { title: "Publiez vos services FR/EN", text: "Photos de chantiers, devis types, zones d'intervention." },
        { title: "Recevez des chantiers qualifiés", text: "Clients diaspora et locaux, paiement sécurisé escrow." },
      ]}
      partnerKind="contractor"
    />
  );
}
