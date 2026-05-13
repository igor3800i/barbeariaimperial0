-- Allow barbers to read profiles of their clients (so embedded selects work)
CREATE POLICY "profiles barber can read own clients"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.barbers b ON b.id = a.barber_id
    WHERE a.client_id = profiles.id AND b.profile_id = auth.uid()
  )
);