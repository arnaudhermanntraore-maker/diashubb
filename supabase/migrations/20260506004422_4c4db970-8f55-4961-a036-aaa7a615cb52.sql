-- Required extension for slug generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =======================================================
-- 1. subscription_plans
-- =======================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  price_monthly NUMERIC(8,2) DEFAULT 0,
  price_yearly NUMERIC(8,2) DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  max_listings INTEGER DEFAULT 3,
  max_agents INTEGER DEFAULT 1,
  boosts_included INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  badge_color TEXT DEFAULT '#6B7280',
  badge_label_fr TEXT,
  badge_label_en TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans public read" ON public.subscription_plans;
CREATE POLICY "plans public read" ON public.subscription_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "plans admin manage" ON public.subscription_plans;
CREATE POLICY "plans admin manage" ON public.subscription_plans
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =======================================================
-- 2. agency_reviews
-- =======================================================
CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  transaction_id UUID,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, reviewer_id)
);

ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews public read" ON public.agency_reviews;
CREATE POLICY "reviews public read" ON public.agency_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews owner insert" ON public.agency_reviews;
CREATE POLICY "reviews owner insert" ON public.agency_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews owner update" ON public.agency_reviews;
CREATE POLICY "reviews owner update" ON public.agency_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews owner delete" ON public.agency_reviews;
CREATE POLICY "reviews owner delete" ON public.agency_reviews
  FOR DELETE USING (auth.uid() = reviewer_id OR public.is_admin(auth.uid()));

-- =======================================================
-- 3. Extend agencies
-- =======================================================
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS plan_key TEXT DEFAULT 'starter' REFERENCES public.subscription_plans(key),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS total_listings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_listings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS team_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS office_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS founded_year SMALLINT,
  ADD COLUMN IF NOT EXISTS team_size SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS countries_operating TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- whatsapp / website / verified_at / verified_by may already exist; add safely
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Backfill slug
UPDATE public.agencies SET
  slug = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(unaccent(name), '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  ) || '-' || SUBSTR(id::TEXT, 1, 6)
WHERE slug IS NULL;

-- Enforce NOT NULL + UNIQUE on slug
ALTER TABLE public.agencies ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agencies_slug_key'
  ) THEN
    ALTER TABLE public.agencies ADD CONSTRAINT agencies_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add agency_reviews FK to agencies (deferred so column exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agency_reviews_agency_id_fkey'
  ) THEN
    ALTER TABLE public.agency_reviews
      ADD CONSTRAINT agency_reviews_agency_id_fkey
      FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =======================================================
-- 4. Indexes
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_plan ON public.agencies(plan_key);
CREATE INDEX IF NOT EXISTS idx_agencies_featured ON public.agencies(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_agencies_verified ON public.agencies(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_agency_reviews_agency ON public.agency_reviews(agency_id);

-- =======================================================
-- 5. Triggers
-- =======================================================
CREATE OR REPLACE FUNCTION public.update_agency_listing_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  target_agent UUID;
BEGIN
  target_agent := COALESCE(NEW.agent_id, OLD.agent_id);
  UPDATE public.agencies SET
    active_listings = (
      SELECT COUNT(*) FROM public.properties
      WHERE agent_id = target_agent AND status = 'active'
    ),
    total_listings = (
      SELECT COUNT(*) FROM public.properties WHERE agent_id = target_agent
    )
  WHERE owner_id = target_agent;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_agency_listing_count ON public.properties;
CREATE TRIGGER trg_agency_listing_count
AFTER INSERT OR UPDATE OF status OR DELETE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_agency_listing_count();

CREATE OR REPLACE FUNCTION public.update_agency_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  target_agency UUID;
BEGIN
  target_agency := COALESCE(NEW.agency_id, OLD.agency_id);
  UPDATE public.agencies SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.agency_reviews WHERE agency_id = target_agency
    ), 0),
    reviews_count = (
      SELECT COUNT(*) FROM public.agency_reviews WHERE agency_id = target_agency
    )
  WHERE id = target_agency;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_agency_rating ON public.agency_reviews;
CREATE TRIGGER trg_agency_rating
AFTER INSERT OR UPDATE OR DELETE ON public.agency_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_agency_rating();

-- =======================================================
-- 6. Seed plans
-- =======================================================
INSERT INTO public.subscription_plans (
  key, name_fr, name_en, description_fr, description_en,
  price_monthly, price_yearly, max_listings, max_agents, boosts_included,
  badge_color, badge_label_fr, badge_label_en, sort_order, features
) VALUES
('starter','Starter','Starter','Testez TerraFrique gratuitement','Try TerraFrique for free',
  0,0,3,1,0,'#6B7280','Agence TerraFrique','TerraFrique Agency',1,
  '["3 annonces","Profil basique","Messagerie sécurisée","Badge Agence TerraFrique","Statistiques basiques"]'::jsonb),
('pro','Pro','Pro','Pour agents et petites agences','For agents and small agencies',
  49,470,20,1,3,'#185FA5','Agent Pro Certifié','Pro Agent',2,
  '["20 annonces actives","Badge Agent Pro Certifié","3 boosts inclus/mois","Traduction auto FR/EN","Analytics complets","Priorité dans les résultats","Profil featured sur /agents","Accès leads diaspora","Support email 48h"]'::jsonb),
('business','Business','Business','Pour agences moyennes 5-20 agents','For mid-size agencies 5-20 agents',
  149,1430,-1,5,10,'#1D9E75','Agence Certifiée','Certified Agency',3,
  '["Annonces illimitées","Badge Agence Certifiée Premium","10 boosts inclus/mois","Page agence dédiée branded","Logo sur toutes les annonces","Featured newsletter 1x/mois","Accès API TerraFrique","5 comptes agents liés","CRM leads intégré","Support chat dédié 24h","Rapport mensuel performance"]'::jsonb),
('enterprise','Enterprise','Enterprise','Pour grands réseaux multi-pays','For large multi-country networks',
  499,4790,-1,-1,-1,'#EF9F27','Partenaire Officiel','Official Partner',4,
  '["Tout Business inclus","Badge Partenaire Officiel Or","Boosts illimités","Page agence premium avec équipe","Featured homepage rotation","Newsletter diaspora 1x/trimestre","Account manager dédié","Agents illimités","White-label sous-domaine","Données marché exclusives","Co-marketing réseaux sociaux","Intégration CRM externe","Rapport hebdomadaire","Support téléphonique direct"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_listings = EXCLUDED.max_listings,
  max_agents = EXCLUDED.max_agents,
  boosts_included = EXCLUDED.boosts_included;