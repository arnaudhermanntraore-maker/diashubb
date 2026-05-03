import { createRootRoute, Outlet, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Nav, FloatingAddListing, SecurityBanner } from "@/components/Nav";
import { Chatbot } from "@/components/Chatbot";
import "@/lib/i18n";

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
      { title: "TerraFrique Global — Bi-continental real estate" },
      { name: "description", content: "Verified real estate across the US and Africa. Buy, sell, invest with confidence." },
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
      <SecurityBanner />
      <Nav />
      <main className="min-h-[calc(100vh-8rem)]"><Outlet /></main>
      <FloatingAddListing />
      <Chatbot />
      <footer className="border-t border-border mt-16 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TerraFrique Global · Bi-continental real estate
      </footer>
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});
