
-- 1) Move has_role out of the public/API-exposed schema into a private schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Recreate every policy that referenced public.has_role using private.has_role

-- survey_questions
DROP POLICY IF EXISTS "survey_questions admin write" ON public.survey_questions;
CREATE POLICY "survey_questions admin write" ON public.survey_questions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "admin profiles all" ON public.profiles;
CREATE POLICY "admin profiles all" ON public.profiles
  FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
CREATE POLICY "own profile select" ON public.profiles
  FOR SELECT
  USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "profiles: admins update all" ON public.profiles;
CREATE POLICY "profiles: admins update all" ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "profiles: users read own, admins read all" ON public.profiles;
CREATE POLICY "profiles: users read own, admins read all" ON public.profiles
  FOR SELECT TO authenticated
  USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::app_role));

-- sim_users
DROP POLICY IF EXISTS "admin sim_users read" ON public.sim_users;
CREATE POLICY "admin sim_users read" ON public.sim_users
  FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "admin sim_users write" ON public.sim_users;
CREATE POLICY "admin sim_users write" ON public.sim_users
  FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "user_roles: users read own, admins read all" ON public.user_roles;
CREATE POLICY "user_roles: users read own, admins read all" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::app_role));

-- invites
DROP POLICY IF EXISTS "own invites delete" ON public.invites;
CREATE POLICY "own invites delete" ON public.invites
  FOR DELETE
  USING ((inviter_user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin invites select" ON public.invites;
CREATE POLICY "own or admin invites select" ON public.invites
  FOR SELECT
  USING ((inviter_user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

-- intervention_rules
DROP POLICY IF EXISTS "intervention_rules admin write" ON public.intervention_rules;
CREATE POLICY "intervention_rules admin write" ON public.intervention_rules
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- survey_responses
DROP POLICY IF EXISTS "admin responses delete" ON public.survey_responses;
CREATE POLICY "admin responses delete" ON public.survey_responses
  FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin responses select" ON public.survey_responses;
CREATE POLICY "own or admin responses select" ON public.survey_responses
  FOR SELECT
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin responses update" ON public.survey_responses;
CREATE POLICY "own or admin responses update" ON public.survey_responses
  FOR UPDATE
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own responses insert" ON public.survey_responses;
CREATE POLICY "own responses insert" ON public.survey_responses
  FOR INSERT
  WITH CHECK ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

-- academy_progress
DROP POLICY IF EXISTS "own academy write" ON public.academy_progress;
CREATE POLICY "own academy write" ON public.academy_progress
  FOR ALL
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin academy select" ON public.academy_progress;
CREATE POLICY "own or admin academy select" ON public.academy_progress
  FOR SELECT
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

-- experiment_config
DROP POLICY IF EXISTS "experiment_config admin write" ON public.experiment_config;
CREATE POLICY "experiment_config admin write" ON public.experiment_config
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- cohort_config
DROP POLICY IF EXISTS "cohort_config admin write" ON public.cohort_config;
CREATE POLICY "cohort_config admin write" ON public.cohort_config
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- org_baselines: admin-only WRITE + admin-only READ (removes authenticated read)
DROP POLICY IF EXISTS "org_baselines admin write" ON public.org_baselines;
CREATE POLICY "org_baselines admin write" ON public.org_baselines
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "org_baselines read auth" ON public.org_baselines;
CREATE POLICY "org_baselines admin read" ON public.org_baselines
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- academy_steps
DROP POLICY IF EXISTS "academy_steps admin write" ON public.academy_steps;
CREATE POLICY "academy_steps admin write" ON public.academy_steps
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- modal_events
DROP POLICY IF EXISTS "own or admin modal events insert" ON public.modal_events;
CREATE POLICY "own or admin modal events insert" ON public.modal_events
  FOR INSERT
  WITH CHECK ((user_id IS NULL) OR (user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin modal events select" ON public.modal_events;
CREATE POLICY "own or admin modal events select" ON public.modal_events
  FOR SELECT
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

-- user_entitlements: admin-only write (no self-write), owner/admin read
DROP POLICY IF EXISTS "own entitlements write" ON public.user_entitlements;
CREATE POLICY "admin entitlements write" ON public.user_entitlements
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "own or admin entitlements select" ON public.user_entitlements;
CREATE POLICY "own or admin entitlements select" ON public.user_entitlements
  FOR SELECT
  USING ((user_id = (auth.uid())::text) OR private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Drop the public.has_role function (no longer referenced by any policy)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4) Invite hardening: format check + self-invite block + per-inviter cap
CREATE OR REPLACE FUNCTION public.validate_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inviter_email text;
  pending_count int;
BEGIN
  -- Basic format + length validation
  IF NEW.email IS NULL OR length(NEW.email) < 5 OR length(NEW.email) > 254 THEN
    RAISE EXCEPTION 'Invalid invite email';
  END IF;
  IF NEW.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Invalid invite email format';
  END IF;

  -- Prevent inviting your own account email
  SELECT email INTO inviter_email FROM auth.users WHERE id::text = NEW.inviter_user_id;
  IF inviter_email IS NOT NULL AND lower(inviter_email) = lower(NEW.email) THEN
    RAISE EXCEPTION 'Cannot invite your own account';
  END IF;

  -- Rate cap: max 25 pending invites per inviter
  SELECT count(*) INTO pending_count
  FROM public.invites
  WHERE inviter_user_id = NEW.inviter_user_id AND status = 'pending';
  IF pending_count >= 25 THEN
    RAISE EXCEPTION 'Invite limit reached (25 pending)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_invite_trg ON public.invites;
CREATE TRIGGER validate_invite_trg
  BEFORE INSERT ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.validate_invite();
