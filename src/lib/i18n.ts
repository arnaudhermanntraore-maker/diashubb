import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      nav: { home: "Accueil", listings: "Annonces", agents: "Agents", dashboard: "Espace", messages: "Messages", admin: "Admin", login: "Connexion", logout: "Déconnexion", signup: "Inscription" },
      hero: {
        kicker: "Plateforme bi-continentale",
        title: "L'immobilier africain, vérifié et sans frontières",
        subtitle: "Achetez, vendez et investissez entre les États-Unis et l'Afrique avec confiance — titres vérifiés, paiements sécurisés, agents certifiés TerraFrique.",
        cta: "Explorer les biens",
        ctaSecondary: "Devenir agent",
      },
      search: { placeholder: "Pays, ville, type de bien…", country: "Pays", price: "Prix max (USD)", type: "Type", verified: "Vérifié uniquement", search: "Rechercher" },
      filters: { all: "Tous", land: "Terrain", house: "Maison", apartment: "Appartement", commercial: "Commercial", farm: "Ferme" },
      property: { verified: "Vérifié TerraFrique", aiScore: "Score IA", contact: "Contacter l'agent", tour: "Visite 360°", noResults: "Aucun bien trouvé" },
      banner: "🛡️ Pour votre sécurité, communiquez uniquement sur TerraFrique. Ne partagez jamais d'argent en dehors de la plateforme.",
      addListing: "Ajouter un bien",
      auth: { signIn: "Se connecter", signUp: "Créer un compte", email: "E-mail", password: "Mot de passe", name: "Nom complet", role: "Je suis…", continue: "Continuer", needAccount: "Pas de compte ?", haveAccount: "Déjà inscrit ?" },
      dashboard: { title: "Mon portefeuille", us: "États-Unis", africa: "Afrique", listings: "Mes annonces", saved: "Favoris", txCount: "Transactions", terracoins: "TerraCoins" },
      admin: { title: "Panneau d'administration", users: "Utilisateurs", listings: "Annonces", flags: "Feature flags", audit: "Audit", txs: "Transactions" },
    },
  },
  en: {
    translation: {
      nav: { home: "Home", listings: "Listings", agents: "Agents", dashboard: "Dashboard", messages: "Messages", admin: "Admin", login: "Sign in", logout: "Sign out", signup: "Sign up" },
      hero: {
        kicker: "Bi-continental platform",
        title: "African real estate, verified and borderless",
        subtitle: "Buy, sell and invest across the US and Africa with confidence — verified titles, secure payments, TerraFrique-certified agents.",
        cta: "Browse properties",
        ctaSecondary: "Become an agent",
      },
      search: { placeholder: "Country, city, property type…", country: "Country", price: "Max price (USD)", type: "Type", verified: "Verified only", search: "Search" },
      filters: { all: "All", land: "Land", house: "House", apartment: "Apartment", commercial: "Commercial", farm: "Farm" },
      property: { verified: "TerraFrique Verified", aiScore: "AI Score", contact: "Contact agent", tour: "360° tour", noResults: "No properties found" },
      banner: "🛡️ For your safety, communicate only on TerraFrique. Never send money outside the platform.",
      addListing: "Add listing",
      auth: { signIn: "Sign in", signUp: "Create account", email: "Email", password: "Password", name: "Full name", role: "I am a…", continue: "Continue", needAccount: "No account?", haveAccount: "Already registered?" },
      dashboard: { title: "My portfolio", us: "United States", africa: "Africa", listings: "My listings", saved: "Saved", txCount: "Transactions", terracoins: "TerraCoins" },
      admin: { title: "Admin panel", users: "Users", listings: "Listings", flags: "Feature flags", audit: "Audit", txs: "Transactions" },
    },
  },
};

if (!i18n.isInitialized) {
  const saved = typeof window !== "undefined" ? localStorage.getItem("tf_lang") : null;
  i18n.use(initReactI18next).init({
    resources,
    lng: saved || "fr",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
