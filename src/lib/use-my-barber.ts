import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Returns the `barbers` row linked to the current user (via profile_id).
 * If none is linked, returns null — pages should treat this as "see all barbers"
 * (single-shop assumption) until an admin links the user.
 */
export function useMyBarber() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-barber", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, display_name, photo_url")
        .eq("profile_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
