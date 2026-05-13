import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titleKey?: "publish" | "contact" | "save";
}

const COPY = {
  publish: {
    fr: { t: "Connectez-vous pour publier un bien", d: "Créez votre compte agent en moins d'une minute pour publier vos annonces vérifiées sur Diashubb." },
    en: { t: "Sign in to publish a property", d: "Create your agent account in under a minute to publish verified listings on Diashubb." },
  },
  contact: {
    fr: { t: "Connectez-vous pour contacter", d: "Un compte est requis pour échanger en toute sécurité via la messagerie Diashubb." },
    en: { t: "Sign in to contact", d: "An account is required to exchange securely via Diashubb messaging." },
  },
  save: {
    fr: { t: "Connectez-vous pour sauvegarder", d: "Sauvegardez vos biens favoris et recevez des alertes personnalisées." },
    en: { t: "Sign in to save", d: "Save your favorite listings and get personalized alerts." },
  },
};

export function AuthWall({ open, onOpenChange, titleKey = "publish" }: Props) {
  const { i18n } = useTranslation();
  const { user, loading } = useAuth();
  const fr = i18n.language === "fr";
  const c = COPY[titleKey][fr ? "fr" : "en"];

  // Never show login wall to already-authenticated users.
  useEffect(() => {
    if (open && !loading && user) onOpenChange(false);
  }, [open, loading, user, onOpenChange]);

  if (user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: "color-mix(in oklab, var(--tf-blue) 12%, transparent)" }}>
            <Lock size={20} style={{ color: "var(--tf-blue)" }} />
          </div>
          <DialogTitle className="font-display text-xl">{c.t}</DialogTitle>
          <DialogDescription>{c.d}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-muted-foreground my-2">
          <li>✓ {fr ? "Annonces vérifiées et titres certifiés" : "Verified listings and certified deeds"}</li>
          <li>✓ {fr ? "Paiements sécurisés via escrow" : "Secure escrow payments"}</li>
          <li>✓ {fr ? "Messagerie chiffrée" : "Encrypted messaging"}</li>
          <li>✓ {fr ? "+50 DiasCoins offerts à l'inscription" : "+50 DiasCoins on signup"}</li>
        </ul>
        <div className="flex flex-col gap-2 mt-2">
          <Link
            to="/signup"
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-white font-semibold rounded-full py-3"
            style={{ background: "var(--tf-blue)" }}
          >
            {fr ? "Créer mon compte →" : "Create account →"}
          </Link>
          <Link
            to="/signup"
            onClick={() => onOpenChange(false)}
            className="w-full text-center font-medium rounded-full py-3 border border-border hover:bg-muted"
          >
            {fr ? "Se connecter" : "Sign in"}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
