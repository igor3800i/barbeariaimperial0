import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DbAppointment = Database["public"]["Tables"]["appointments"]["Row"];

export function useAppointments() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<DbAppointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => qc.invalidateQueries({ queryKey: ["appointments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}