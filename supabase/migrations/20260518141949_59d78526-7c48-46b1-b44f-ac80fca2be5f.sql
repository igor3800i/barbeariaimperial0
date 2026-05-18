-- Reatribuir quaisquer dados do barbeiro órfão para o barbeiro vinculado ao usuário imperial2026
UPDATE public.appointments SET barber_id = '410042ea-a1e6-452e-9b27-dfbc5e88694a' WHERE barber_id = 'ee4ea8e5-6907-4e69-9af3-3f9941bd53d5';
UPDATE public.working_hours SET barber_id = '410042ea-a1e6-452e-9b27-dfbc5e88694a' WHERE barber_id = 'ee4ea8e5-6907-4e69-9af3-3f9941bd53d5' AND NOT EXISTS (SELECT 1 FROM public.working_hours wh2 WHERE wh2.barber_id = '410042ea-a1e6-452e-9b27-dfbc5e88694a' AND wh2.day_of_week = working_hours.day_of_week);
DELETE FROM public.working_hours WHERE barber_id = 'ee4ea8e5-6907-4e69-9af3-3f9941bd53d5';
UPDATE public.reviews SET barber_id = '410042ea-a1e6-452e-9b27-dfbc5e88694a' WHERE barber_id = 'ee4ea8e5-6907-4e69-9af3-3f9941bd53d5';

-- Remover barbeiro duplicado
DELETE FROM public.barbers WHERE id = 'ee4ea8e5-6907-4e69-9af3-3f9941bd53d5';

-- Renomear o barbeiro restante para "João Imperial"
UPDATE public.barbers SET display_name = 'João Imperial' WHERE id = '410042ea-a1e6-452e-9b27-dfbc5e88694a';