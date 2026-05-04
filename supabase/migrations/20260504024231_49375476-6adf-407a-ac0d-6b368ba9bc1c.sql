
CREATE TABLE IF NOT EXISTS public.rate_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code CHAR(3) UNIQUE NOT NULL,
  rate_from_usd NUMERIC(14,6) NOT NULL CHECK (rate_from_usd > 0),
  trend_24h NUMERIC(8,5) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_config public read"
  ON public.rate_config FOR SELECT
  USING (true);

CREATE POLICY "rate_config super manage"
  ON public.rate_config FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER rate_config_set_updated_at
  BEFORE UPDATE ON public.rate_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.rate_config (currency_code, rate_from_usd, trend_24h) VALUES
  ('XOF', 655.42, 0.001),
  ('XAF', 655.96, 0.001),
  ('GHS', 15.82, -0.003),
  ('NGN', 1587.50, 0.012),
  ('MAD', 10.12, 0.000),
  ('TND', 3.12, -0.001),
  ('DZD', 134.75, 0.002),
  ('KES', 129.50, -0.005),
  ('RWF', 1318.00, 0.000),
  ('MUR', 45.80, 0.001),
  ('MRU', 39.20, 0.000),
  ('MGA', 4512.00, 0.003),
  ('ZAR', 18.45, 0.008),
  ('TZS', 2648.00, 0.002),
  ('GNF', 8620.00, 0.000),
  ('ETB', 113.50, 0.000)
ON CONFLICT (currency_code) DO NOTHING;
