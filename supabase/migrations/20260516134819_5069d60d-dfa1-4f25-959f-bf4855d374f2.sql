
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated;

DROP POLICY IF EXISTS "services public read" ON public.services;

CREATE POLICY "services public read active"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "services admin read all"
  ON public.services FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');
