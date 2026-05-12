
-- ==============================
-- 1. DROP OLD OBJECTS
-- ==============================
DROP TRIGGER IF EXISTS trg_appointments_notify ON public.appointments;
DROP TRIGGER IF EXISTS trg_clients_notify ON public.clients;
DROP FUNCTION IF EXISTS public.notify_on_appointment_change() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_new_client() CASCADE;
DROP FUNCTION IF EXISTS public.generate_monthly_report() CASCADE;

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- ==============================
-- 2. PROFILES
-- ==============================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin','barber','client')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role without recursion (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles admin read" ON public.profiles
  FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================
-- 3. BARBERS
-- ==============================
CREATE TABLE public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL DEFAULT '',
  photo_url text,
  specialty text[] DEFAULT '{}',
  bio text,
  instagram text,
  commission_rate numeric NOT NULL DEFAULT 0.5,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "barbers public read" ON public.barbers
  FOR SELECT USING (true);
CREATE POLICY "barbers admin write" ON public.barbers
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ==============================
-- 4. SERVICES
-- ==============================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_min int NOT NULL,
  price numeric NOT NULL,
  category text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services public read" ON public.services
  FOR SELECT USING (active = true OR public.get_my_role() = 'admin');
CREATE POLICY "services admin write" ON public.services
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ==============================
-- 5. WORKING HOURS
-- ==============================
CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_day_off boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "working_hours public read" ON public.working_hours
  FOR SELECT USING (true);
CREATE POLICY "working_hours barber/admin write" ON public.working_hours
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = barber_id AND b.profile_id = auth.uid())
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = barber_id AND b.profile_id = auth.uid())
  );

-- ==============================
-- 6. APPOINTMENTS
-- ==============================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes text,
  price_charged numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_barber_time ON public.appointments(barber_id, scheduled_at);
CREATE INDEX idx_appointments_client ON public.appointments(client_id);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments client read" ON public.appointments
  FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "appointments barber read" ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = barber_id AND b.profile_id = auth.uid())
  );
CREATE POLICY "appointments admin read" ON public.appointments
  FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "appointments client insert" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "appointments client update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
CREATE POLICY "appointments barber update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = barber_id AND b.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = barber_id AND b.profile_id = auth.uid()));
CREATE POLICY "appointments admin all" ON public.appointments
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ==============================
-- 7. PAYMENTS
-- ==============================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL CHECK (method IN ('cash','card','pix')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments admin/barber read" ON public.payments
  FOR SELECT TO authenticated USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.barbers b ON b.id = a.barber_id
      WHERE a.id = appointment_id AND b.profile_id = auth.uid()
    )
  );
CREATE POLICY "payments admin/barber write" ON public.payments
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.barbers b ON b.id = a.barber_id
      WHERE a.id = appointment_id AND b.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.barbers b ON b.id = a.barber_id
      WHERE a.id = appointment_id AND b.profile_id = auth.uid()
    )
  );

-- ==============================
-- 8. REVIEWS
-- ==============================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews authenticated read" ON public.reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews client insert own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id AND a.client_id = auth.uid()
    )
  );
CREATE POLICY "reviews client update own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- ==============================
-- 9. NOTIFICATIONS
-- ==============================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications self read" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications self update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications self delete" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
-- Inserts done server-side via service role (no client policy needed)

-- ==============================
-- 10. REALTIME
-- ==============================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==============================
-- 11. STORAGE BUCKETS
-- ==============================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('barbers', 'barbers', true)
  ON CONFLICT (id) DO NOTHING;

-- avatars: public read, authenticated upload to own folder (auth.uid()/...)
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- barbers: public read, admin write
CREATE POLICY "barbers public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'barbers');
CREATE POLICY "barbers admin write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'barbers' AND public.get_my_role() = 'admin')
  WITH CHECK (bucket_id = 'barbers' AND public.get_my_role() = 'admin');
