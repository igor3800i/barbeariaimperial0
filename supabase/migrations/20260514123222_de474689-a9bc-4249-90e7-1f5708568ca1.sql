
-- Notification trigger for appointment lifecycle
CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barber_profile uuid;
  v_client_name text;
  v_service_name text;
  v_when text;
BEGIN
  SELECT b.profile_id INTO v_barber_profile FROM public.barbers b WHERE b.id = NEW.barber_id;
  SELECT p.full_name INTO v_client_name FROM public.profiles p WHERE p.id = NEW.client_id;
  SELECT s.name INTO v_service_name FROM public.services s WHERE s.id = NEW.service_id;
  v_when := to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI');

  IF TG_OP = 'INSERT' THEN
    -- Tell the barber a new appointment was made
    IF v_barber_profile IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (v_barber_profile, 'appointment_new',
        'Novo agendamento',
        COALESCE(v_client_name, 'Cliente') || ' marcou ' || COALESCE(v_service_name, 'um serviço') || ' em ' || v_when);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Notify the client when status changes
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.client_id,
      'appointment_status',
      CASE NEW.status
        WHEN 'confirmed' THEN 'Agendamento confirmado'
        WHEN 'completed' THEN 'Atendimento concluído'
        WHEN 'cancelled' THEN 'Agendamento cancelado'
        ELSE 'Atualização do agendamento'
      END,
      COALESCE(v_service_name, 'Serviço') || ' em ' || v_when
    );

    -- Notify the barber if the client cancelled
    IF NEW.status = 'cancelled' AND v_barber_profile IS NOT NULL AND v_barber_profile <> NEW.client_id THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (v_barber_profile, 'appointment_cancel',
        'Agendamento cancelado',
        COALESCE(v_client_name, 'Cliente') || ' cancelou ' || COALESCE(v_service_name, 'o atendimento') || ' de ' || v_when);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment_insert ON public.appointments;
CREATE TRIGGER trg_notify_appointment_insert
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();

DROP TRIGGER IF EXISTS trg_notify_appointment_update ON public.appointments;
CREATE TRIGGER trg_notify_appointment_update
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();

-- Storage policies: avatars (each user owns folder named with their uid)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: barbers (staff write, public read)
DROP POLICY IF EXISTS "barbers public read" ON storage.objects;
CREATE POLICY "barbers public read" ON storage.objects
FOR SELECT USING (bucket_id = 'barbers');

DROP POLICY IF EXISTS "barbers staff write" ON storage.objects;
CREATE POLICY "barbers staff write" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'barbers' AND public.is_staff())
WITH CHECK (bucket_id = 'barbers' AND public.is_staff());
