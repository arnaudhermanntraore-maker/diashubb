CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove previous schedule if any
DO $$
BEGIN
  PERFORM cron.unschedule('sync-hud-foreclosures-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'sync-hud-foreclosures-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--f204870e-2dc1-4b89-b3f9-329af453a4e3.lovable.app/api/public/hooks/sync-hud',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscnhhaHJvbHJyZ3VoYWlhcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Njg2MjMsImV4cCI6MjA5MzM0NDYyM30.ePfABJpY4pPASeKqt8lb5Pxqd_toBc3txEbtH_IMHN0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);