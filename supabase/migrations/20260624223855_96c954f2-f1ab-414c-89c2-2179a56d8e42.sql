
-- New enums
CREATE TYPE public.modal_event_type AS ENUM ('impression', 'dismissal', 'submit');
CREATE TYPE public.survey_question_type AS ENUM ('friction_pick', 'friction_drilldown');

-- 1. survey_questions
CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort cohort_type NULL,
  question_type survey_question_type NOT NULL,
  friction friction_type NULL,
  "order" int NOT NULL,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.survey_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_questions TO authenticated;
GRANT ALL ON public.survey_questions TO service_role;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on survey_questions" ON public.survey_questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_survey_questions_updated_at BEFORE UPDATE ON public.survey_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. intervention_rules
CREATE TABLE public.intervention_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort cohort_type NOT NULL,
  friction friction_type NOT NULL,
  action intervention_action NOT NULL,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cohort, friction)
);
GRANT SELECT ON public.intervention_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intervention_rules TO authenticated;
GRANT ALL ON public.intervention_rules TO service_role;
ALTER TABLE public.intervention_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on intervention_rules" ON public.intervention_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_intervention_rules_updated_at BEFORE UPDATE ON public.intervention_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. cohort_config
CREATE TABLE public.cohort_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name cohort_type NOT NULL UNIQUE,
  min_day int NOT NULL,
  max_day int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cohort_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohort_config TO authenticated;
GRANT ALL ON public.cohort_config TO service_role;
ALTER TABLE public.cohort_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on cohort_config" ON public.cohort_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cohort_config_updated_at BEFORE UPDATE ON public.cohort_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. org_baselines
CREATE TABLE public.org_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ninety_day_churn numeric NOT NULL,
  activation_rate numeric NOT NULL,
  seats_per_account numeric NOT NULL,
  time_to_first_value_days numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_baselines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_baselines TO authenticated;
GRANT ALL ON public.org_baselines TO service_role;
ALTER TABLE public.org_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on org_baselines" ON public.org_baselines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_org_baselines_updated_at BEFORE UPDATE ON public.org_baselines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. experiment_config
CREATE TABLE public.experiment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.experiment_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiment_config TO authenticated;
GRANT ALL ON public.experiment_config TO service_role;
ALTER TABLE public.experiment_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on experiment_config" ON public.experiment_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_experiment_config_updated_at BEFORE UPDATE ON public.experiment_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. academy_steps
CREATE TABLE public.academy_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id text NOT NULL UNIQUE,
  label text NOT NULL,
  sub text NOT NULL DEFAULT '',
  "order" int NOT NULL,
  is_failing boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_steps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_steps TO authenticated;
GRANT ALL ON public.academy_steps TO service_role;
ALTER TABLE public.academy_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on academy_steps" ON public.academy_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_academy_steps_updated_at BEFORE UPDATE ON public.academy_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. modal_events  (user_id is text to match existing sim_users.id; nullable until auth lands)
CREATE TABLE public.modal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NULL,
  event_type modal_event_type NOT NULL,
  cohort cohort_type NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_modal_events_event_type ON public.modal_events (event_type);
CREATE INDEX idx_modal_events_user_id ON public.modal_events (user_id);
GRANT SELECT ON public.modal_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modal_events TO authenticated;
GRANT ALL ON public.modal_events TO service_role;
ALTER TABLE public.modal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on modal_events" ON public.modal_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. user_entitlements
CREATE TABLE public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  team_discount_activated boolean NOT NULL DEFAULT false,
  discount_activated_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_entitlements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prototype open access on user_entitlements" ON public.user_entitlements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_user_entitlements_updated_at BEFORE UPDATE ON public.user_entitlements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SEED DATA ============

-- survey_questions: Q1 (friction pick), then Q2 drill-downs per friction
INSERT INTO public.survey_questions (cohort, question_type, friction, "order", prompt, options) VALUES
(NULL, 'friction_pick', NULL, 1, 'Biggest friction', '[
  {"id":"setup","label":"Stuck getting it configured","friction":"usability"},
  {"id":"value","label":"Can''t tell what changed for my team","friction":"value"},
  {"id":"team","label":"My team hasn''t adopted it","friction":"admin"},
  {"id":"price","label":"Hard to justify the cost internally","friction":"admin"}
]'::jsonb),
(NULL, 'friction_drilldown', 'usability', 2, 'What specifically?', '["Onboarding checklist","Connecting our data sources","Inviting teammates","Finding the right report"]'::jsonb),
(NULL, 'friction_drilldown', 'value', 2, 'What specifically?', '["Need ROI numbers","Need a baseline comparison","Need exec-ready summary","Need usage trends"]'::jsonb),
(NULL, 'friction_drilldown', 'admin', 2, 'What specifically?', '["Need more seats","Need procurement help","Need a discount","Need an SSO/security review"]'::jsonb);

-- intervention_rules (cohort × friction → action + label)
INSERT INTO public.intervention_rules (cohort, friction, action, label) VALUES
('day14', 'usability', 'book_cs_call', 'Book a 15-min setup call'),
('day45', 'usability', 'send_tutorial', 'Open the 4-min fast-track tutorial'),
('day14', 'admin', 'unlock_team_discount', 'Unlock 20% team seat discount'),
('day45', 'admin', 'unlock_team_discount', 'Unlock 20% team seat discount'),
('day14', 'value', 'send_roi_report', 'Generate your ROI snapshot'),
('day45', 'value', 'send_roi_report', 'Generate your ROI snapshot');

-- cohort_config
INSERT INTO public.cohort_config (name, min_day, max_day) VALUES
('day14', 13, 16),
('day45', 44, 47);

-- org_baselines (single row — global baseline for prototype)
INSERT INTO public.org_baselines (ninety_day_churn, activation_rate, seats_per_account, time_to_first_value_days)
VALUES (0.30, 0.22, 1.4, 6.2);

-- experiment_config
INSERT INTO public.experiment_config (key, value) VALUES
('kill_switch_threshold', '0.10'::jsonb),
('engagement_target', '0.25'::jsonb),
('analyze_latency_ms', '800'::jsonb),
('ignore_mode', 'false'::jsonb);

-- academy_steps
INSERT INTO public.academy_steps (step_id, label, sub, "order", is_failing) VALUES
('workspace',  'Create your workspace',              'Auto-completed when you signed up.',                            1, false),
('warehouse',  'Connect your data warehouse',        'Snowflake, BigQuery, Postgres — 90s avg.',                      2, false),
('salesforce', 'Connect Salesforce integration',     'Required for the revenue attribution model.',                   3, true),
('report',     'Build your first report',            'Pick a template — the wizard fills the rest.',                  4, false),
('invite',     'Invite one teammate',                'Accounts with 2+ seats activate 3× faster.',                    5, false);
