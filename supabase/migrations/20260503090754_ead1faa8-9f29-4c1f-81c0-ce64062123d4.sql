
CREATE TABLE public.boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('property','contractor','broker')),
  item_id uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('day','week','month','quarter')),
  audience text NOT NULL DEFAULT 'diaspora' CHECK (audience IN ('local','national','diaspora')),
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  terracoins_used integer NOT NULL DEFAULT 0,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{"views":0,"saves":0,"contacts":0,"views_before":0}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX boosts_item_idx ON public.boosts (item_type, item_id, status);
CREATE INDEX boosts_ends_at_idx ON public.boosts (ends_at) WHERE status = 'active';
CREATE INDEX boosts_user_idx ON public.boosts (user_id, created_at DESC);

ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boosts owner read" ON public.boosts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "boosts owner insert" ON public.boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boosts admin manage" ON public.boosts
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_boosts_updated_at
BEFORE UPDATE ON public.boosts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
