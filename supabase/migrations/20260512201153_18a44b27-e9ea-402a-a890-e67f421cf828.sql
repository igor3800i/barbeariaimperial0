
-- Revoke execute from public/anon/authenticated; only triggers (postgres) and policies invoke these
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten storage SELECT policies: keep public read of individual objects via signed/public URLs,
-- but do not allow arbitrary listing (storage.objects SELECT used by list endpoints).
-- We replace broad public SELECT with a no-op listing restriction; direct file fetches via /storage/v1/object/public/... still work.
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "barbers public read" ON storage.objects;

CREATE POLICY "avatars owner list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.get_my_role() = 'admin'));

CREATE POLICY "barbers admin list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'barbers' AND public.get_my_role() = 'admin');
