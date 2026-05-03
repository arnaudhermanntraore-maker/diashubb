-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('property-photos', 'property-photos', true),
  ('property-videos', 'property-videos', true),
  ('property-tours', 'property-tours', true),
  ('property-docs', 'property-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Property assets public read"
ON storage.objects FOR SELECT
USING (bucket_id IN ('property-photos','property-videos','property-tours','property-docs'));

-- Authenticated insert into own folder (first path segment must equal auth.uid())
CREATE POLICY "Users upload own property assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('property-photos','property-videos','property-tours','property-docs')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own property assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('property-photos','property-videos','property-tours','property-docs')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own property assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('property-photos','property-videos','property-tours','property-docs')
  AND auth.uid()::text = (storage.foldername(name))[1]
);