DELETE FROM public.properties
WHERE agent_id IN (
  'ec00b7f3-a111-42a4-adf6-3240e549665a',
  '32f9f2be-bf3b-477c-b66c-d60c116e3d4c'
)
AND title_fr IS NULL;