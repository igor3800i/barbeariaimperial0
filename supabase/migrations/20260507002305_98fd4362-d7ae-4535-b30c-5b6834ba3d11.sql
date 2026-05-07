
DROP TABLE IF EXISTS public.appointments CASCADE;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  surname text NOT NULL,
  phone text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  service text NOT NULL,
  service_value numeric NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_date_time_unique UNIQUE (date, time)
);

CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients public read"
  ON public.clients FOR SELECT USING (true);

CREATE POLICY "clients public insert"
  ON public.clients FOR INSERT
  WITH CHECK (
    length(name) >= 1 AND length(name) <= 80
    AND length(surname) >= 1 AND length(surname) <= 80
    AND length(phone) >= 8 AND length(phone) <= 20
  );

CREATE POLICY "appointments public read"
  ON public.appointments FOR SELECT USING (true);

CREATE POLICY "appointments public insert"
  ON public.appointments FOR INSERT
  WITH CHECK (
    length(client_name) >= 2 AND length(client_name) <= 120
    AND length(client_phone) >= 8 AND length(client_phone) <= 20
    AND length(service) >= 1 AND length(service) <= 120
    AND service_value >= 0
    AND date >= CURRENT_DATE
    AND status IN ('pending','confirmed')
  );

CREATE POLICY "appointments public update status"
  ON public.appointments FOR UPDATE
  USING (true)
  WITH CHECK (status IN ('pending','confirmed','completed','cancelled'));

ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
