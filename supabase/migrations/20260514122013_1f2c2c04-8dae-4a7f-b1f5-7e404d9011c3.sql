
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.barbers WHERE profile_id = auth.uid() AND active = true
  )
$$;

DROP POLICY IF EXISTS "services admin write" ON public.services;
CREATE POLICY "services staff write" ON public.services
  FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "barbers admin write" ON public.barbers;
CREATE POLICY "barbers staff write" ON public.barbers
  FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "working_hours barber/admin write" ON public.working_hours;
CREATE POLICY "working_hours staff write" ON public.working_hours
  FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
