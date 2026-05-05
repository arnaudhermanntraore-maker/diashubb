UPDATE public.feature_flags
SET category = 'content',
    description_fr = COALESCE(description_fr, 'Affiche un bandeau bleu informatif en haut des pages publiques pour signaler que les annonces affichées sont des données de démonstration. Masqué automatiquement pour les utilisateurs connectés et lorsque l''utilisateur clique sur la croix (mémorisé pour la session).'),
    description_en = COALESCE(description_en, 'Shows an informational blue banner at the top of public pages indicating listings are demo sample data. Hidden automatically for signed-in users and once dismissed (remembered for the session).')
WHERE key = 'demo_data_banner';