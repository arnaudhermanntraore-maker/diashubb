import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";

export function FavoriteButton({
  propertyId,
  className = "",
}: {
  propertyId: string;
  className?: string;
}) {
  const enabled = useFeatureFlag("favorites");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!user || !enabled) return;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", propertyId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user, propertyId, enabled]);

  if (!enabled) return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Auth wall — redirect to /auth with return path
    if (!user) {
      toast.error("Connexion requise pour sauvegarder un bien", {
        action: {
          label: "Se connecter",
          onClick: () =>
            navigate({ to: "/auth" }),
        },
        duration: 4000,
      });
      return;
    }

    if (loading) return;
    setLoading(true);

    if (saved) {
      // Optimistic UI — remove immediately
      setSaved(false);
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

      if (error) {
        setSaved(true); // revert
        toast.error("Erreur lors de la suppression");
      } else {
        toast("Bien retiré des favoris", {
          icon: "🗑️",
          duration: 2000,
        });
      }
    } else {
      // Optimistic UI — save immediately
      setSaved(true);
      setPop(true);
      setTimeout(() => setPop(false), 400);

      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, property_id: propertyId });

      if (error) {
        setSaved(false); // revert
        toast.error("Erreur lors de la sauvegarde");
      } else {
        toast.success("Bien sauvegardé dans vos favoris ❤️", {
          duration: 2500,
        });
      }
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-full
        bg-white/90 backdrop-blur
        shadow-soft
        transition-all duration-200
        hover:scale-110 active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        ${pop ? "scale-125" : ""}
        ${className}
      `}
    >
      <Heart
        size={16}
        className={`transition-colors duration-200 ${
          saved
            ? "fill-red-500 text-red-500"
            : "text-gray-500 hover:text-red-400"
        }`}
      />
    </button>
  );
}
