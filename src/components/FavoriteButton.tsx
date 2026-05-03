import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { toast } from "sonner";

export function FavoriteButton({ propertyId, className = "" }: { propertyId: string; className?: string }) {
  const enabled = useFeatureFlag("favorites");
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!user || !enabled) return;
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("property_id", propertyId).maybeSingle().then(({ data }) => setSaved(!!data));
  }, [user, propertyId, enabled]);

  if (!enabled) return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Sign in required"); return; }
    if (saved) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", propertyId);
      setSaved(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: propertyId });
      if (error) { toast.error(error.message); return; }
      setSaved(true); setPop(true); setTimeout(() => setPop(false), 300);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="favorite"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-soft hover:scale-110 transition-transform ${pop ? "animate-pulse" : ""} ${className}`}
    >
      <Heart size={16} className={saved ? "fill-red-500 text-red-500" : "text-gray-600"} />
    </button>
  );
}
