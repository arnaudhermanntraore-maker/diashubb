-- Partner applications table for contractor / broker / agent / surveyor signups
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  kind TEXT NOT NULL CHECK (kind IN ('contractor','broker','agent','surveyor')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialty TEXT,
  city TEXT,
  region TEXT,
  experience_years INT,
  license_number TEXT,
  bio TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can submit an application
CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications FOR INSERT
  WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.partner_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all applications
CREATE POLICY "Admins can view all applications"
  ON public.partner_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update applications"
  ON public.partner_applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_partner_apps_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_partner_apps_kind_status ON public.partner_applications(kind, status);

-- Storage bucket for partner application documents (licenses, certificates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-docs', 'partner-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to a public/anonymous prefix for application documents
CREATE POLICY "Anyone can upload partner documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'partner-docs');

CREATE POLICY "Admins can read all partner documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-docs' AND public.is_admin(auth.uid()));

CREATE POLICY "Users can read own partner documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
