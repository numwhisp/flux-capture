
-- =========================================================
-- 1. profiles + user_roles + has_role
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  product_role TEXT NOT NULL DEFAULT '',
  day_in_journey INTEGER NOT NULL DEFAULT 1,
  seats_active INTEGER NOT NULL DEFAULT 1,
  activated BOOLEAN NOT NULL DEFAULT false,
  surveyed BOOLEAN NOT NULL DEFAULT false,
  churned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.app_role AS ENUM ('end_user','admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies
CREATE POLICY "profiles: users read own, admins read all"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: admins update all"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles: users read own, admins read all"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Signup trigger: create profile + default end_user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, company, product_role, day_in_journey)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'product_role', 'Member'),
    1
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'end_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 2. Tighten RLS on domain tables
-- =========================================================

-- Drop existing open policies. Names vary; use dynamic drop.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN (
      'sim_users','survey_responses','invites','academy_progress',
      'modal_events','user_entitlements','survey_questions',
      'intervention_rules','cohort_config','org_baselines',
      'experiment_config','academy_steps'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- sim_users: legacy demo personas. Signed-in users can SELECT (needed for admin lookup + seed display). Only admins mutate.
CREATE POLICY "sim_users read for authenticated" ON public.sim_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "sim_users admin write" ON public.sim_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- survey_responses: own rows or admin all.
CREATE POLICY "survey_responses read own or admin" ON public.survey_responses FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "survey_responses insert own" ON public.survey_responses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "survey_responses update own or admin" ON public.survey_responses FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "survey_responses delete admin" ON public.survey_responses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- invites
CREATE POLICY "invites read own or admin" ON public.invites FOR SELECT TO authenticated
  USING (inviter_user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "invites insert own" ON public.invites FOR INSERT TO authenticated
  WITH CHECK (inviter_user_id = auth.uid()::text);
CREATE POLICY "invites delete own or admin" ON public.invites FOR DELETE TO authenticated
  USING (inviter_user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));

-- academy_progress
CREATE POLICY "academy_progress read own or admin" ON public.academy_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "academy_progress upsert own" ON public.academy_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "academy_progress update own" ON public.academy_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "academy_progress delete own or admin" ON public.academy_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));

-- modal_events
CREATE POLICY "modal_events read own or admin" ON public.modal_events FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "modal_events insert own" ON public.modal_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));

-- user_entitlements
CREATE POLICY "user_entitlements read own or admin" ON public.user_entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_entitlements upsert own" ON public.user_entitlements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_entitlements update own" ON public.user_entitlements FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Config tables: everyone signed-in can read; only admins write.
CREATE POLICY "survey_questions read auth" ON public.survey_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "survey_questions admin write" ON public.survey_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "intervention_rules read auth" ON public.intervention_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "intervention_rules admin write" ON public.intervention_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "cohort_config read auth" ON public.cohort_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "cohort_config admin write" ON public.cohort_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "org_baselines read auth" ON public.org_baselines FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_baselines admin write" ON public.org_baselines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "experiment_config read auth" ON public.experiment_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "experiment_config admin write" ON public.experiment_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "academy_steps read auth" ON public.academy_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_steps admin write" ON public.academy_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Revoke anon; ensure authenticated has needed grants (idempotent).
REVOKE ALL ON public.sim_users, public.survey_responses, public.invites,
  public.academy_progress, public.modal_events, public.user_entitlements,
  public.survey_questions, public.intervention_rules, public.cohort_config,
  public.org_baselines, public.experiment_config, public.academy_steps FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sim_users, public.survey_responses,
  public.invites, public.academy_progress, public.modal_events, public.user_entitlements,
  public.survey_questions, public.intervention_rules, public.cohort_config,
  public.org_baselines, public.experiment_config, public.academy_steps TO authenticated;
