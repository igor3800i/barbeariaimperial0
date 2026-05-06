
drop function if exists public.get_booked_slots(date);

create view public.booked_slots as
select appointment_date, appointment_time
from public.appointments
where status = 'confirmed';

grant select on public.booked_slots to anon, authenticated;
