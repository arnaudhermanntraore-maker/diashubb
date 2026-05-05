import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      nav: { home: "Accueil", listings: "Annonces", agents: "Agences", dashboard: "Espace", messages: "Messages", admin: "Admin", login: "Connexion", logout: "Déconnexion", signup: "Inscription" },
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
      banner: "TerraFrique protège chaque transaction. Ne communiquez jamais en dehors de cette plateforme. Ne partagez aucune information bancaire par message.",
      addListing: "Ajouter un bien",
      auth: { signIn: "Se connecter", signUp: "Créer un compte", email: "E-mail", password: "Mot de passe", name: "Nom complet", role: "Je suis…", continue: "Continuer", needAccount: "Pas de compte ?", haveAccount: "Déjà inscrit ?" },
      dashboard: { title: "Mon portefeuille", us: "États-Unis", africa: "Afrique", listings: "Mes annonces", saved: "Favoris", txCount: "Transactions", terracoins: "TerraCoins" },
      agency: {
        title: "Espace Agence",
        subtitle: "Gérez vos annonces et vos prospects",
        publishCta: "Publier un nouveau bien",
        stats: { active: "Actives", pending: "En attente", draft: "Brouillons", sold: "Vendues" },
        quickActions: "Actions rapides",
        actions: {
          publish: "Publier un bien",
          publishSub: "Formulaire en 5 étapes",
          listings: "Mes annonces",
          listingsSub: "Voir, modifier, booster",
          messages: "Messagerie",
          messagesSub: "Vos prospects en attente",
        },
      },
      admin: { title: "Panneau d'administration", users: "Utilisateurs", listings: "Annonces", flags: "Feature flags", audit: "Audit", txs: "Transactions" },
      rateErrors: {
        unauthorized: "Session expirée — veuillez vous reconnecter.",
        forbidden: "Accès refusé — rôle super administrateur requis.",
        validation: "Données invalides — vérifiez le code ISO, le taux et le trend.",
        dbError: "Erreur base de données : {{message}}",
        network: "Impossible de joindre le serveur. Réessayez.",
        unknown: "Une erreur inattendue est survenue.",
      },
      lightbox: {
        gallery: "Galerie photos",
        galleryWith: "Galerie photos — {{label}}",
        counter: "Photo {{current}} sur {{total}}",
        zoomIn: "Zoom avant",
        zoomOut: "Zoom arrière",
        zoomLevel: "Niveau de zoom {{percent}} %",
        reset: "Réinitialiser le zoom et la position",
        close: "Fermer la galerie (Échap)",
        prev: "Photo précédente ({{current}} sur {{total}})",
        next: "Photo suivante ({{current}} sur {{total}})",
        thumbs: "Miniatures des photos",
        thumb: "Afficher la photo {{current}} sur {{total}}",
        hint: "← → naviguer · +/− zoom · 0 réinitialiser · Échap fermer",
      },
    },
  },
  en: {
    translation: {
      nav: { home: "Home", listings: "Listings", agents: "Agencies", dashboard: "Dashboard", messages: "Messages", admin: "Admin", login: "Sign in", logout: "Sign out", signup: "Sign up" },
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
      banner: "TerraFrique protects every transaction. Never communicate outside this platform. Never share banking information in messages.",
      addListing: "Add listing",
      auth: { signIn: "Sign in", signUp: "Create account", email: "Email", password: "Password", name: "Full name", role: "I am a…", continue: "Continue", needAccount: "No account?", haveAccount: "Already registered?" },
      dashboard: { title: "My portfolio", us: "United States", africa: "Africa", listings: "My listings", saved: "Saved", txCount: "Transactions", terracoins: "TerraCoins" },
      agency: {
        title: "Agency Workspace",
        subtitle: "Manage your listings and prospects",
        publishCta: "Publish a new property",
        stats: { active: "Active", pending: "Pending", draft: "Drafts", sold: "Sold" },
        quickActions: "Quick actions",
        actions: {
          publish: "Publish a property",
          publishSub: "5-step form",
          listings: "My listings",
          listingsSub: "View, edit, boost",
          messages: "Messages",
          messagesSub: "Your waiting prospects",
        },
      },
      admin: { title: "Admin panel", users: "Users", listings: "Listings", flags: "Feature flags", audit: "Audit", txs: "Transactions" },
      rateErrors: {
        unauthorized: "Session expired — please sign in again.",
        forbidden: "Access denied — super admin role required.",
        validation: "Invalid data — check ISO code, rate and trend.",
        dbError: "Database error: {{message}}",
        network: "Could not reach the server. Please retry.",
        unknown: "An unexpected error occurred.",
      },
      lightbox: {
        gallery: "Photo gallery",
        galleryWith: "Photo gallery — {{label}}",
        counter: "Photo {{current}} of {{total}}",
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        zoomLevel: "Zoom level {{percent}} percent",
        reset: "Reset zoom and position",
        close: "Close gallery (Escape)",
        prev: "Previous photo ({{current}} of {{total}})",
        next: "Next photo ({{current}} of {{total}})",
        thumbs: "Photo thumbnails",
        thumb: "Show photo {{current}} of {{total}}",
        hint: "← → navigate · +/− zoom · 0 reset · Esc close",
      },
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
