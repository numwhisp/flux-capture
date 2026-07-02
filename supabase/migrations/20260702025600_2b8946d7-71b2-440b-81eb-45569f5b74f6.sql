
CREATE POLICY "users manage own sim_users row"
  ON public.sim_users
  FOR ALL
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

INSERT INTO public.sim_users (id, name, company, role, day_in_journey, seats_active, activated, surveyed, churned)
SELECT p.id::text,
       COALESCE(p.display_name, 'User'),
       COALESCE(p.company, ''),
       COALESCE(p.product_role, ''),
       COALESCE(p.day_in_journey, 1),
       COALESCE(p.seats_active, 1),
       COALESCE(p.activated, false),
       COALESCE(p.surveyed, false),
       COALESCE(p.churned, false)
FROM public.profiles p
LEFT JOIN public.sim_users s ON s.id = p.id::text
WHERE s.id IS NULL;

CREATE OR REPLACE FUNCTION public.mirror_profile_to_sim_users()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.sim_users (id, name, company, role, day_in_journey, seats_active, activated, surveyed, churned)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.display_name, 'User'),
    COALESCE(NEW.company, ''),
    COALESCE(NEW.product_role, ''),
    COALESCE(NEW.day_in_journey, 1),
    COALESCE(NEW.seats_active, 1),
    COALESCE(NEW.activated, false),
    COALESCE(NEW.surveyed, false),
    COALESCE(NEW.churned, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mirror_profile_to_sim_users_trg ON public.profiles;
CREATE TRIGGER mirror_profile_to_sim_users_trg
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.mirror_profile_to_sim_users();
