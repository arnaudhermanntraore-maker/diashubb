CREATE POLICY "roles self insert agent"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'agent'::app_role);