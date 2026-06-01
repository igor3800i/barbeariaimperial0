CREATE OR REPLACE FUNCTION public.notify_appointment_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_barber_profile uuid;
  v_client_name text;
  v_service_name text;
  v_when text;
BEGIN
  SELECT b.profile_id INTO v_barber_profile FROM public.barbers b WHERE b.id = NEW.barber_id;
  IF NEW.client_id IS NOT NULL THEN
    SELECT p.full_name INTO v_client_name FROM public.profiles p WHERE p.id = NEW.client_id;
  END IF;
  SELECT s.name INTO v_service_name FROM public.services s WHERE s.id = NEW.service_id;
  v_when := to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI');

  IF TG_OP = 'INSERT' THEN
    IF v_barber_profile IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (v_barber_profile, 'appointment_new',
        'Novo agendamento',
        COALESCE(v_client_name, 'Cliente') || ' marcou ' || COALESCE(v_service_name, 'um serviço') || ' em ' || v_when);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Notify client only if there is a registered client
    IF NEW.client_id IS NOT NULL THEN
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
    END IF;

    IF NEW.status = 'cancelled' AND v_barber_profile IS NOT NULL AND v_barber_profile IS DISTINCT FROM NEW.client_id THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (v_barber_profile, 'appointment_cancel',
        'Agendamento cancelado',
        COALESCE(v_client_name, 'Cliente') || ' cancelou ' || COALESCE(v_service_name, 'o atendimento') || ' de ' || v_when);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;