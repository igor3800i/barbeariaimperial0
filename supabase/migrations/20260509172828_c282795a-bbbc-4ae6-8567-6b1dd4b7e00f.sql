
-- Notifications table for barber dashboard
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications (read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications public read"
  ON public.notifications FOR SELECT
  USING (true);

CREATE POLICY "notifications public insert"
  ON public.notifications FOR INSERT
  WITH CHECK (
    length(title) >= 1 AND length(title) <= 200
    AND length(description) >= 1 AND length(description) <= 500
    AND type = ANY(ARRAY['appointment_new','appointment_cancelled','appointment_rescheduled','monthly_report'])
  );

CREATE POLICY "notifications public update"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "notifications public delete"
  ON public.notifications FOR DELETE
  USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Trigger: new appointment -> notification
CREATE OR REPLACE FUNCTION public.notify_on_appointment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date_label TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_date_label := to_char(NEW.date, 'DD/MM');
    INSERT INTO public.notifications (type, title, description, metadata)
    VALUES (
      'appointment_new',
      'Novo agendamento!',
      NEW.client_name || ' agendou ' || NEW.service || ' para ' || v_date_label || ' às ' || NEW.time,
      jsonb_build_object('appointment_id', NEW.id, 'date', NEW.date, 'time', NEW.time)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      v_date_label := to_char(NEW.date, 'DD/MM');
      INSERT INTO public.notifications (type, title, description, metadata)
      VALUES (
        'appointment_cancelled',
        'Agendamento cancelado',
        NEW.client_name || ' cancelou o agendamento de ' || v_date_label || ' às ' || NEW.time,
        jsonb_build_object('appointment_id', NEW.id)
      );
    ELSIF (NEW.date <> OLD.date OR NEW.time <> OLD.time) THEN
      v_date_label := to_char(NEW.date, 'DD/MM');
      INSERT INTO public.notifications (type, title, description, metadata)
      VALUES (
        'appointment_rescheduled',
        'Agendamento remarcado',
        NEW.client_name || ' remarcou para ' || v_date_label || ' às ' || NEW.time,
        jsonb_build_object('appointment_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointments_notify
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_appointment_change();

-- Monthly report function
CREATE OR REPLACE FUNCTION public.generate_monthly_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE := date_trunc('month', (CURRENT_DATE - INTERVAL '1 month'))::date;
  v_end DATE := date_trunc('month', CURRENT_DATE)::date;
  v_count INT;
  v_total NUMERIC;
  v_avg NUMERIC;
  v_month_name TEXT;
  v_months TEXT[] := ARRAY['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
BEGIN
  SELECT COUNT(*), COALESCE(SUM(service_value), 0), COALESCE(AVG(service_value), 0)
    INTO v_count, v_total, v_avg
  FROM public.appointments
  WHERE date >= v_start AND date < v_end
    AND status IN ('completed','confirmed');

  v_month_name := v_months[EXTRACT(MONTH FROM v_start)::int];

  INSERT INTO public.notifications (type, title, description, metadata)
  VALUES (
    'monthly_report',
    'Relatório Mensal — ' || v_month_name,
    'Seu ticket médio em ' || v_month_name || ' foi de R$ ' || to_char(v_avg, 'FM999G990D00') ||
    '. Faturamento total: R$ ' || to_char(v_total, 'FM999G990D00') ||
    '. Total de atendimentos: ' || v_count || '.',
    jsonb_build_object('month', v_month_name, 'total', v_total, 'avg', v_avg, 'count', v_count)
  );
END;
$$;
