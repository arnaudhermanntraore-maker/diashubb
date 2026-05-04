
CREATE TABLE IF NOT EXISTS public.foreclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_reference TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  zip_code TEXT,
  country_code CHAR(2) DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  property_type TEXT,
  bedrooms SMALLINT,
  bathrooms NUMERIC(3,1),
  surface_sqft INTEGER,
  year_built SMALLINT,
  listing_price NUMERIC(12,2),
  estimated_market_value NUMERIC(12,2),
  discount_percent NUMERIC(5,2),
  outstanding_loan NUMERIC(12,2),
  opening_bid NUMERIC(12,2),
  foreclosure_type TEXT NOT NULL,
  foreclosure_stage TEXT,
  lender_name TEXT,
  case_number TEXT,
  default_date DATE,
  auction_date DATE,
  listing_date DATE,
  photos JSONB NOT NULL DEFAULT '[]',
  ai_renovation_estimate NUMERIC(10,2),
  ai_investment_score SMALLINT,
  ai_analysis JSONB NOT NULL DEFAULT '{}',
  ai_analyzed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  boosted_until TIMESTAMPTZ,
  fha_eligible BOOLEAN NOT NULL DEFAULT false,
  va_eligible BOOLEAN NOT NULL DEFAULT false,
  financing_available TEXT[] NOT NULL DEFAULT '{}',
  views_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foreclosures_type ON public.foreclosures(foreclosure_type);
CREATE INDEX IF NOT EXISTS idx_foreclosures_state ON public.foreclosures(state);
CREATE INDEX IF NOT EXISTS idx_foreclosures_status ON public.foreclosures(status);
CREATE INDEX IF NOT EXISTS idx_foreclosures_price ON public.foreclosures(listing_price);
CREATE INDEX IF NOT EXISTS idx_foreclosures_auction_date ON public.foreclosures(auction_date) WHERE auction_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foreclosures_discount ON public.foreclosures(discount_percent DESC);
CREATE INDEX IF NOT EXISTS idx_foreclosures_score ON public.foreclosures(ai_investment_score DESC);

ALTER TABLE public.foreclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foreclosures public read active" ON public.foreclosures
  FOR SELECT USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "foreclosures admin manage" ON public.foreclosures
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.calc_foreclosure_discount()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.estimated_market_value IS NOT NULL AND NEW.estimated_market_value > 0
     AND NEW.listing_price IS NOT NULL AND NEW.listing_price > 0 THEN
    NEW.discount_percent := ROUND((1 - NEW.listing_price / NEW.estimated_market_value) * 100, 1);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_discount
  BEFORE INSERT OR UPDATE ON public.foreclosures
  FOR EACH ROW EXECUTE FUNCTION public.calc_foreclosure_discount();

INSERT INTO public.feature_flags (key, label_fr, label_en, description_fr, description_en, category, enabled)
VALUES (
  'foreclosures',
  'Biens en saisie (Foreclosures)',
  'Foreclosure listings',
  'Afficher les biens saisis — HUD, REO, enchères et pré-saisies. Jusqu''à -50% du marché.',
  'Show foreclosed properties — HUD, REO, auctions and pre-foreclosures. Up to -50% below market.',
  'features',
  true
)
ON CONFLICT (key) DO UPDATE SET
  label_fr = EXCLUDED.label_fr,
  label_en = EXCLUDED.label_en,
  description_fr = EXCLUDED.description_fr,
  description_en = EXCLUDED.description_en;
