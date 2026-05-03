
-- Agencies table for real-estate agency registrations
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  legal_name text,
  registration_number text,
  country text NOT NULL,
  city text,
  address text,
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  description text,
  logo_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | verified | rejected
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies public read verified"
  ON public.agencies FOR SELECT
  USING (status = 'verified' OR owner_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "agencies owner insert"
  ON public.agencies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "agencies owner update"
  ON public.agencies FOR UPDATE
  USING (auth.uid() = owner_id OR is_admin(auth.uid()));

CREATE POLICY "agencies admin manage"
  ON public.agencies FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER agencies_set_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX idx_agencies_country ON public.agencies(country);
CREATE INDEX idx_agencies_status ON public.agencies(status);
