import { createRootRoute, Outlet, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { FlagsProvider, useFeatureFlag } from "@/hooks/useFeatureFlags";
import { Nav, FloatingAddListing, SecurityBanner } from "@/components/Nav";
import { Chatbot } from "@/components/Chatbot";

function GatedChatbot() { return useFeatureFlag("ai_chatbot") ? <Chatbot /> : null; }
function GatedSecurityBanner() { return useFeatureFlag("security_banner") ? <SecurityBanner /> : null; }
import { Toaster } from "@/components/ui/sonner";
import { isDatabaseEmpty, seedDemoData } from "@/server/seed.functions";
import "@/lib/i18n";

function DemoSeeder() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("tf_seed_checked")) return;
    sessionStorage.setItem("tf_seed_checked", "1");
    isDatabaseEmpty()
      .then((r) => { if (r.empty) return seedDemoData(); })
      .catch((e) => console.warn("[seed]", e));
  }, []);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <p className="mt-4 text-muted-foreground">Page introuvable / Page not found</p>
        <Link to="/" className="mt-6 inline-block bg-primary text-primary-foreground px-5 py-2 rounded-full">Home</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Diashubb — Bi-continental real estate" },
      { name: "description", content: "Verified real estate across the US and Africa. Buy, sell, invest with confidence." },
      { property: "og:title", content: "Diashubb — Bi-continental real estate" },
      { name: "twitter:title", content: "Diashubb — Bi-continental real estate" },
      { property: "og:description", content: "Verified real estate across the US and Africa. Buy, sell, invest with confidence." },
      { name: "twitter:description", content: "Verified real estate across the US and Africa. Buy, sell, invest with confidence." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0c9a341-a220-479b-8560-16df797460a1/id-preview-9a202519--f204870e-2dc1-4b89-b3f9-329af453a4e3.lovable.app-1777954130202.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0c9a341-a220-479b-8560-16df797460a1/id-preview-9a202519--f204870e-2dc1-4b89-b3f9-329af453a4e3.lovable.app-1777954130202.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: ({ children }) => (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  ),
  component: () => (
    <AuthProvider>
      <FlagsProvider>
        <DemoSeeder />
        <GatedSecurityBanner />
        <Nav />
        <main className="min-h-[calc(100vh-8rem)]"><Outlet /></main>
        <FloatingAddListing />
        <GatedChatbot />
        <Toaster />
      <footer className="border-t border-border py-6 bg-white">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "var(--tf-navy)" }}>TF</div>
            <span>Diashubb · USA & Africa real estate</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="#" className="hover:text-tf-blue">Terms</a>
            <a href="#" className="hover:text-tf-blue">Privacy</a>
            <a href="#" className="hover:text-tf-blue">Fair Housing</a>
            <a href="#" className="hover:text-tf-blue">Contact</a>
            <a href="#" className="hover:text-tf-blue">Blog</a>
          </div>
        </div>
      </footer>
      </FlagsProvider>
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});
