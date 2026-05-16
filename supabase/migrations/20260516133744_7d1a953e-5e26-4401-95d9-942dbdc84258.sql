CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-appointment-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url:='https://project--721d15ec-8e80-4474-99fb-83ee8420347d.lovable.app/api/public/hooks/send-reminders',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);