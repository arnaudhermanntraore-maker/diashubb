CREATE TABLE public.currency_rates (
  country text PRIMARY KEY,
  code text NOT NULL,
  symbol text NOT NULL,
  rate numeric(14,4) NOT NULL CHECK (rate > 0),
  locale text NOT NULL DEFAULT 'fr-FR',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rates public read" ON public.currency_rates FOR SELECT USING (true);
CREATE POLICY "rates admin manage" ON public.currency_rates FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER currency_rates_updated_at BEFORE UPDATE ON public.currency_rates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.currency_rates (country, code, symbol, rate, locale) VALUES
  ('SN','XOF','FCFA',605,'fr-FR'),('CI','XOF','FCFA',605,'fr-FR'),('ML','XOF','FCFA',605,'fr-FR'),
  ('BF','XOF','FCFA',605,'fr-FR'),('BJ','XOF','FCFA',605,'fr-FR'),('TG','XOF','FCFA',605,'fr-FR'),
  ('NE','XOF','FCFA',605,'fr-FR'),('GW','XOF','FCFA',605,'fr-FR'),
  ('CM','XAF','FCFA',605,'fr-FR'),('GA','XAF','FCFA',605,'fr-FR'),('CG','XAF','FCFA',605,'fr-FR'),
  ('TD','XAF','FCFA',605,'fr-FR'),('CF','XAF','FCFA',605,'fr-FR'),('GQ','XAF','FCFA',605,'fr-FR'),
  ('NG','NGN','₦',1550,'en-NG'),('GH','GHS','₵',15,'en-GH'),('KE','KES','KSh',129,'en-KE'),
  ('ZA','ZAR','R',18,'en-ZA'),('MA','MAD','DH',10,'fr-MA'),('EG','EGP','E£',49,'en-EG'),
  ('TN','TND','DT',3.1,'fr-TN'),('DZ','DZD','DA',134,'fr-DZ'),('RW','RWF','FRw',1380,'en-RW'),
  ('UG','UGX','USh',3700,'en-UG'),('TZ','TZS','TSh',2600,'en-TZ'),('ET','ETB','Br',124,'en-ET');