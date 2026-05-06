
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  duration_min integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id),
  customer_name text not null,
  customer_phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  unique (appointment_date, appointment_time)
);

create index on public.appointments (appointment_date);

alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.appointments enable row level security;

create policy "services public read" on public.services
  for select using (active = true);

create policy "products public read" on public.products
  for select using (active = true);

create policy "appointments public insert" on public.appointments
  for insert with check (
    length(customer_name) between 2 and 80
    and length(customer_phone) between 8 and 20
    and appointment_date >= current_date
    and status = 'confirmed'
  );

-- Function to fetch booked slots without exposing PII
create or replace function public.get_booked_slots(p_date date)
returns table(appointment_time time)
language sql
stable
security definer
set search_path = public
as $$
  select appointment_time
  from public.appointments
  where appointment_date = p_date
    and status = 'confirmed';
$$;

grant execute on function public.get_booked_slots(date) to anon, authenticated;
