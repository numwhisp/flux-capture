
-- === 1. Roles + has_role helper ===
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('end_user','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins read all roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- === 2. Profiles table + updated_at helper + auto-create trigger ===
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  product_role text NOT NULL DEFAULT 'Member',
  day_in_journey int NOT NULL DEFAULT 1,
  seats_active int NOT NULL DEFAULT 1,
  activated boolean NOT NULL DEFAULT false,
  surveyed boolean NOT NULL DEFAULT false,
  churned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "admin profiles all" ON public.profiles;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "admin profiles all" ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default end_user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, company, product_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'product_role', 'Member')
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'end_user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- === 3. Tighten RLS on all domain tables ===
-- Drop every existing policy on each and rewrite.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN ('sim_users','survey_responses','invites','academy_progress','modal_events','user_entitlements')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- sim_users: admin-only (legacy seed personas visible to admins in dashboards)
ALTER TABLE public.sim_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sim_users FROM anon;
GRANT SELECT ON public.sim_users TO authenticated;
GRANT ALL ON public.sim_users TO service_role;
CREATE POLICY "admin sim_users read" ON public.sim_users FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin sim_users write" ON public.sim_users FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- survey_responses
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.survey_responses FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;
CREATE POLICY "own or admin responses select" ON public.survey_responses FOR SELECT
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own responses insert" ON public.survey_responses FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own or admin responses update" ON public.survey_responses FOR UPDATE
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin responses delete" ON public.survey_responses FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

-- invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invites FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;
CREATE POLICY "own or admin invites select" ON public.invites FOR SELECT
  USING (inviter_user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own invites insert" ON public.invites FOR INSERT
  WITH CHECK (inviter_user_id = auth.uid()::text);
CREATE POLICY "own invites delete" ON public.invites FOR DELETE
  USING (inviter_user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));

-- academy_progress
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academy_progress FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_progress TO authenticated;
GRANT ALL ON public.academy_progress TO service_role;
CREATE POLICY "own or admin academy select" ON public.academy_progress FOR SELECT
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own academy write" ON public.academy_progress FOR ALL
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));

-- modal_events
ALTER TABLE public.modal_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.modal_events FROM anon;
GRANT SELECT, INSERT ON public.modal_events TO authenticated;
GRANT ALL ON public.modal_events TO service_role;
CREATE POLICY "own or admin modal events select" ON public.modal_events FOR SELECT
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own or admin modal events insert" ON public.modal_events FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));

-- user_entitlements
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_entitlements FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
CREATE POLICY "own or admin entitlements select" ON public.user_entitlements FOR SELECT
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own entitlements write" ON public.user_entitlements FOR ALL
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid()::text OR public.has_role(auth.uid(),'admin'));
