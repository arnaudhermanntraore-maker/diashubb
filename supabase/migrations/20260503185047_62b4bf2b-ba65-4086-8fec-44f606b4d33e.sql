
-- Add bilingual labels & descriptions to feature_flags
ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS label_fr TEXT,
  ADD COLUMN IF NOT EXISTS label_en TEXT,
  ADD COLUMN IF NOT EXISTS description_fr TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Backfill labels for existing rows
UPDATE public.feature_flags SET label_fr = COALESCE(label_fr, key), label_en = COALESCE(label_en, key) WHERE label_fr IS NULL OR label_en IS NULL;

-- Seed all 40 flags (idempotent)
INSERT INTO public.feature_flags (key, label_fr, label_en, description_fr, description_en, enabled, category) VALUES
('secure_messaging','Messagerie sécurisée','Secure messaging','Chat chiffré entre acheteurs et vendeurs','Encrypted chat between buyers and sellers',true,'core'),
('property_alerts','Alertes personnalisées','Property alerts','Notifications quand un bien correspond aux critères','Notifications when a property matches criteria',true,'core'),
('favorites','Biens favoris','Favorite listings','Sauvegarder des biens','Save properties',true,'core'),
('property_comparison','Comparateur de biens','Property comparison','Comparer jusqu''à 4 biens','Compare up to 4 properties',true,'core'),
('virtual_tour_360','Visite virtuelle 360°','Virtual 360° tour','Visite immersive depuis le navigateur','Immersive tour from the browser',true,'core'),
('ai_chatbot','Assistant IA','AI assistant','Chatbot IA 24h/24','AI chatbot 24/7',true,'ai'),
('ai_score_summary','Score IA résumé','AI score summary','Score 0-100 sur chaque annonce','0-100 score on every listing',true,'ai'),
('ai_score_full','Rapport IA complet','Full AI score report','Rapport détaillé — $8','Detailed report — $8',false,'ai'),
('ai_property_estimation','Estimation IA','AI property estimation','Estimation prix par IA','AI price estimation',true,'ai'),
('ai_document_verification','Vérification IA documents','AI document verification','Analyse automatique des titres fonciers','Automatic title-deed analysis',true,'ai'),
('ai_antiscam','Anti-arnaque IA','AI anti-scam','Détection automatique des fraudes','Automatic fraud detection',true,'ai'),
('ai_translation','Traduction auto FR/EN','Auto FR/EN translation','Traduction des annonces','Listing translation',true,'ai'),
('payments_stripe','Paiements Stripe','Stripe payments','Cartes USA','US cards',true,'payments'),
('payments_cinetpay','Paiements CinetPay','CinetPay payments','Wave, Orange Money, MTN','Wave, Orange Money, MTN',false,'payments'),
('escrow_system','Système escrow','Escrow system','Fonds bloqués','Funds held',true,'payments'),
('usd_africa_transfer','Transferts USD→Afrique','USD to Africa transfers','Envoi vers 24 devises','Send to 24 currencies',false,'payments'),
('boost_properties','Boost annonces','Property boost','Mettre en avant — $4 à $180','Feature listings — $4 to $180',true,'boost'),
('boost_contractors','Boost artisans','Contractor boost','Mettre en avant artisans','Feature contractors',false,'boost'),
('boost_brokers','Boost démarcheurs','Broker boost','Mettre en avant démarcheurs','Feature brokers',false,'boost'),
('diaspora_portal','Portail diaspora','Diaspora portal','Dashboard bi-continental','Bi-continental dashboard',true,'diaspora'),
('diaspora_community','Communauté diaspora','Diaspora community','Membres et événements','Members and events',false,'diaspora'),
('market_intelligence','Market Intelligence','Market Intelligence','Graphiques et tendances','Charts and trends',false,'market'),
('local_currencies','Devises locales','Local currencies','Prix en devise locale','Prices in local currency',true,'market'),
('remote_property_mgmt','Gestion locative distante','Remote property mgmt','Gérer biens depuis l''étranger','Manage properties from abroad',false,'property'),
('blockchain_title','Titre blockchain','Blockchain title','Ancrage Polygon — $25','Polygon anchor — $25',false,'property'),
('insurance_embedded','Assurance embarquée','Embedded insurance','Devis en 1 clic','1-click quote',false,'property'),
('mortgage_matchmaker','Mortgage matchmaker','Mortgage matchmaker','Mise en relation prêteurs','Lender matching',false,'property'),
('terracoins','TerraCoins fidélité','TerraCoins loyalty','Points fidélité','Loyalty points',true,'gamification'),
('referral_program','Programme parrainage','Referral program','Lien unique parrainage','Unique referral link',false,'gamification'),
('security_banner','Bannière sécurité','Security banner','Rappel anti-arnaque','Anti-scam reminder',true,'safety'),
('safety_guide','Guide anti-arnaque','Anti-scam guide','Page arnaques courantes','Common scams page',true,'safety'),
('property_publication','Publication annonces','Property publication','Formulaire 5 étapes','5-step form',true,'content'),
('agent_registration','Inscription agences','Agency registration','Formulaire agences','Agency form',true,'content'),
('contractor_registration','Inscription artisans','Contractor registration','Formulaire artisans','Contractor form',true,'content'),
('surveyor_registration','Inscription géomètres','Surveyor registration','Formulaire géomètres','Surveyor form',true,'content'),
('reviews_ratings','Avis et notes','Reviews & ratings','Notation agents/artisans','Ratings system',false,'content'),
('document_export_pdf','Export PDF certifié','Certified PDF export','Export transaction PDF','PDF transaction export',true,'content'),
('dispute_system','Système litiges','Dispute system','Ouverture de litiges','Open disputes',true,'content'),
('notification_push','Notifications push','Push notifications','Notifications navigateur','Browser notifications',true,'notif'),
('notification_email','Notifications email','Email notifications','Emails transactionnels','Transactional emails',false,'notif')
ON CONFLICT (key) DO UPDATE SET
  label_fr = COALESCE(public.feature_flags.label_fr, EXCLUDED.label_fr),
  label_en = COALESCE(public.feature_flags.label_en, EXCLUDED.label_en),
  description_fr = COALESCE(public.feature_flags.description_fr, EXCLUDED.description_fr),
  description_en = COALESCE(public.feature_flags.description_en, EXCLUDED.description_en),
  category = COALESCE(public.feature_flags.category, EXCLUDED.category);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites self all" ON public.favorites;
CREATE POLICY "favorites self all" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  opened_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes participant read" ON public.disputes;
CREATE POLICY "disputes participant read" ON public.disputes FOR SELECT USING (
  opened_by = auth.uid() OR is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
  )
);
DROP POLICY IF EXISTS "disputes opener insert" ON public.disputes;
CREATE POLICY "disputes opener insert" ON public.disputes FOR INSERT WITH CHECK (opened_by = auth.uid());
DROP POLICY IF EXISTS "disputes admin manage" ON public.disputes;
CREATE POLICY "disputes admin manage" ON public.disputes FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
