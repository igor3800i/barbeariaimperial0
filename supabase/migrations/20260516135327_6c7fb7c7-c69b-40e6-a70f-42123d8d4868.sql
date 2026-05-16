
-- Create the auth user (idempotent) for the barber login: imperial2026 / 102030
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'imperial2026@barberimperial.internal';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      crypt('102030', gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      jsonb_build_object('full_name','Imperial'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', v_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
      SET encrypted_password = crypt('102030', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Ensure profile exists as admin
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (v_user_id, 'Imperial', v_email, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email;

  -- Ensure linked barber row exists
  IF NOT EXISTS (SELECT 1 FROM public.barbers WHERE profile_id = v_user_id) THEN
    INSERT INTO public.barbers (profile_id, display_name, active, commission_rate)
    VALUES (v_user_id, 'Imperial', true, 1.0);
  END IF;
END $$;
