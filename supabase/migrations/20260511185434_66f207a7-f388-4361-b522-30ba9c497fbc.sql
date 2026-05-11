ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;

DROP POLICY IF EXISTS "notifications public insert" ON public.notifications;
CREATE POLICY "notifications public insert"
ON public.notifications
FOR INSERT
TO public
WITH CHECK (
  length(title) >= 1 AND length(title) <= 200
  AND length(description) >= 1 AND length(description) <= 500
  AND type = ANY (ARRAY['appointment_new','appointment_cancelled','appointment_rescheduled','monthly_report','client_new'])
);

CREATE OR REPLACE FUNCTION public.notify_on_new_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, description, metadata)
  VALUES (
    'client_new',
    'Novo cliente cadastrado!',
    NEW.name || ' ' || NEW.surname || ' acabou de criar uma conta na plataforma.',
    jsonb_build_object('client_id', NEW.id, 'phone', NEW.phone)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_notify ON public.clients;
CREATE TRIGGER trg_clients_notify
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_client();

ALTER TABLE public.clients REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;