-- Extend properties with bilingual titles, granular attributes, and engagement metrics
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS title_fr text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS bedrooms smallint,
  ADD COLUMN IF NOT EXISTS bathrooms numeric(3,1),
  ADD COLUMN IF NOT EXISTS surface_m2 numeric(10,2),
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS has_360_tour boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Demo data feature flag
INSERT INTO public.feature_flags (key, label_fr, label_en, description_fr, description_en, enabled)
VALUES ('demo_data_banner', 'Bannière données démo', 'Demo data banner',
        'Affiche un bandeau "données d''exemple" sur l''accueil et les annonces',
        'Show "sample data" banner on home and listings pages', true)
ON CONFLICT (key) DO NOTHING;