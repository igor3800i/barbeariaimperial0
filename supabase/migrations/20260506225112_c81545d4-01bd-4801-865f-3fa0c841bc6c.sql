
alter view public.booked_slots set (security_invoker = on);

create policy "appointments public read times" on public.appointments
  for select using (true);
