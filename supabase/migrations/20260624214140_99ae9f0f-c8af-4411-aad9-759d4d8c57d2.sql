
-- Enums mirroring src/features/retention/types.ts
CREATE TYPE public.friction_type AS ENUM ('usability', 'value', 'admin');
CREATE TYPE public.cohort_type AS ENUM ('day14', 'day45');
CREATE TYPE public.intervention_action AS ENUM (
  'book_cs_call',
  'unlock_team_discount',
  'send_tutorial',
  'send_roi_report',
  'no_action'
);
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted');

-- Simulated end-users driving the prototype (persona switcher)
CREATE TABLE public.sim_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  day_in_journey INT NOT NULL DEFAULT 0,
  seats_active INT NOT NULL DEFAULT 1,
  activated BOOLEAN NOT NULL DEFAULT false,
  surveyed BOOLEAN NOT NULL DEFAULT false,
  churned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sim_users TO anon, authenticated;
GRANT ALL ON public.sim_users TO service_role;
ALTER TABLE public.sim_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on sim_users"
  ON public.sim_users FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- 3-question check-in submissions (the core data of the experiment)
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.sim_users(id) ON DELETE CASCADE,
  cohort public.cohort_type NOT NULL,
  friction public.friction_type NOT NULL,
  q1 TEXT NOT NULL,
  q2 TEXT NOT NULL,
  q3 TEXT NOT NULL,
  free_text TEXT NOT NULL DEFAULT '',
  intervention public.intervention_action NOT NULL,
  intervention_accepted BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX survey_responses_user_id_idx ON public.survey_responses(user_id);
CREATE INDEX survey_responses_created_at_idx ON public.survey_responses(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO anon, authenticated;
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on survey_responses"
  ON public.survey_responses FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Team-seat invites generated on the admin-friction branch
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id TEXT NOT NULL REFERENCES public.sim_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status public.invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX invites_inviter_user_id_idx ON public.invites(inviter_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO anon, authenticated;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on invites"
  ON public.invites FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Fast-track academy step progress
CREATE TABLE public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.sim_users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_id)
);

CREATE INDEX academy_progress_user_id_idx ON public.academy_progress(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_progress TO anon, authenticated;
GRANT ALL ON public.academy_progress TO service_role;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on academy_progress"
  ON public.academy_progress FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sim_users_set_updated_at
  BEFORE UPDATE ON public.sim_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER academy_progress_set_updated_at
  BEFORE UPDATE ON public.academy_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
