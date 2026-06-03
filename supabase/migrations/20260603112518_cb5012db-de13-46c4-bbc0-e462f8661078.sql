DROP POLICY IF EXISTS "allow_barber_read_by_id" ON public.appointments;

DROP POLICY IF EXISTS "allow_anonymous_insert_appointments" ON public.appointments;
CREATE POLICY "anon_guest_insert_appointments"
  ON public.appointments
  FOR INSERT
  TO anon
  WITH CHECK (
    client_id IS NULL
    AND barber_id IS NOT NULL
    AND service_id IS NOT NULL
    AND scheduled_at > now()
    AND scheduled_at < now() + interval '120 days'
    AND status IN ('pending','confirmed')
  );

CREATE OR REPLACE FUNCTION public.get_busy_slots(_barber_id uuid, _day date)
RETURNS TABLE(scheduled_at timestamptz, ends_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.scheduled_at, a.ends_at
  FROM public.appointments a
  WHERE a.barber_id = _barber_id
    AND a.status <> 'cancelled'
    AND a.scheduled_at >= (_day::timestamptz)
    AND a.scheduled_at <  ((_day + 1)::timestamptz);
$$;
REVOKE ALL ON FUNCTION public.get_busy_slots(uuid, date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date) TO anon, authenticated;

DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
CREATE POLICY "profiles self insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'client');

REVOKE SELECT ON public.barbers FROM anon;
GRANT SELECT (id, active, profile_id, display_name, photo_url, specialty, bio, instagram, created_at)
  ON public.barbers TO anon;

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;