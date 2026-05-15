
-- Auto-vincular o e-mail igorfelipe2407@icloud.com como admin/barber ao se cadastrar
CREATE OR REPLACE FUNCTION public.auto_link_owner_barber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
BEGIN
  IF lower(NEW.email) = 'igorfelipe2407@icloud.com' THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
    SELECT id INTO v_existing FROM public.barbers WHERE profile_id = NEW.id LIMIT 1;
    IF v_existing IS NULL THEN
      INSERT INTO public.barbers (profile_id, display_name, active, commission_rate)
      VALUES (NEW.id, COALESCE(NULLIF(NEW.full_name,''), 'Igor'), true, 1.0);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_link_owner_barber_trg ON public.profiles;
CREATE TRIGGER auto_link_owner_barber_trg
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_link_owner_barber();
