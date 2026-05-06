
drop policy "appointments public read times" on public.appointments;

create policy "appointments read date/time only" on public.appointments
  for select using (true);

revoke select on public.appointments from anon, authenticated;
grant select (appointment_date, appointment_time, status) on public.appointments to anon, authenticated;
