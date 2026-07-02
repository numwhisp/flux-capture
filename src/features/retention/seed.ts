import type {
  AcademyStepRecord,
  Baseline,
  CohortConfigEntry,
  ExperimentConfig,
  InterventionRule,
  RetentionState,
  SimUser,
  SurveyQuestion,
  SurveyResponse,
} from "./types";

export const seedUsers: SimUser[] = [
  { id: "u1", name: "Mara Chen", company: "Northwind Ops", role: "Ops Lead", dayInJourney: 14, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u2", name: "Devon Park", company: "Vector Eng", role: "VP of Product", dayInJourney: 45, seatsActive: 2, activated: true, surveyed: false, churned: false },
  { id: "u3", name: "Riya Shah", company: "Lumen Labs", role: "Head of RevOps", dayInJourney: 8, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u4", name: "Theo Kade", company: "Outpost.io", role: "Director of CS", dayInJourney: 62, seatsActive: 3, activated: true, surveyed: false, churned: false },
];

// Real verbatim user quotes from the discovery brief — hardcoded so the admin
// view never shows empty/filler data on first load.
export const seedResponses: SurveyResponse[] = [
  {
    id: "seed-1", userId: "u1", cohort: "day14", friction: "value",
    q1: "I can't tell what changed for my team", q2: "Need a baseline comparison", q3: "2/10 likely to renew",
    freeText: "Honestly, I churned on Day 12. I didn't know what it did for me day-to-day.",
    intervention: "send_roi_report", interventionAccepted: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "seed-2", userId: "u2", cohort: "day45", friction: "value",
    q1: "I can't tell what changed for my team", q2: "Need exec-ready summary", q3: "4/10 likely to renew",
    freeText: "I sat in my QBR and couldn't point to a single number that changed because of this tool.",
    intervention: "send_roi_report", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "seed-3", userId: "u3", cohort: "day14", friction: "usability",
    q1: "I'm stuck getting it configured", q2: "Connecting our data sources", q3: "3/10 likely to renew",
    freeText: "Spent two hours trying to wire up our warehouse and gave up. Docs assume I'm already an admin.",
    intervention: "book_cs_call", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "seed-4", userId: "u4", cohort: "day45", friction: "admin",
    q1: "My team hasn't adopted it", q2: "Need more seats", q3: "6/10 likely to renew",
    freeText: "I'm the only seat using it. Finance won't approve more until I prove adoption.",
    intervention: "unlock_team_discount", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
];

/**
 * Fallback constants used until Supabase hydration completes (and as a safety
 * net if the corresponding tables are empty). Keep these in sync with the
 * seed rows inserted by the schema migration.
 */
export const FALLBACK_BASELINE: Baseline = {
  ninetyDayChurn: 0.30,
  activationRate: 0.22,
  seatsPerAccount: 1.4,
  timeToFirstValueDays: 6.2,
};

export const FALLBACK_EXPERIMENT_CONFIG: ExperimentConfig = {
  killSwitchThreshold: 0.10,
  engagementTarget: 0.25,
  analyzeLatencyMs: 800,
  ignoreMode: false,
};

export const FALLBACK_COHORT_CONFIG: CohortConfigEntry[] = [
  { name: "day14", minDay: 13, maxDay: 16, active: true },
  { name: "day45", minDay: 44, maxDay: 47, active: true },
];

export const FALLBACK_INTERVENTION_RULES: InterventionRule[] = [
  { cohort: "day14", friction: "usability", action: "book_cs_call",         label: "Book a 15-min setup call",        active: true },
  { cohort: "day45", friction: "usability", action: "send_tutorial",        label: "Open the 4-min fast-track tutorial", active: true },
  { cohort: "day14", friction: "admin",     action: "unlock_team_discount", label: "Unlock 20% team seat discount",   active: true },
  { cohort: "day45", friction: "admin",     action: "unlock_team_discount", label: "Unlock 20% team seat discount",   active: true },
  { cohort: "day14", friction: "value",     action: "send_roi_report",      label: "Generate your ROI snapshot",      active: true },
  { cohort: "day45", friction: "value",     action: "send_roi_report",      label: "Generate your ROI snapshot",      active: true },
];

export const FALLBACK_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "fallback-q1", cohort: null, questionType: "friction_pick", friction: null, order: 1,
    prompt: "Biggest friction", active: true,
    options: [
      { id: "setup", label: "Stuck getting it configured",         friction: "usability" },
      { id: "value", label: "Can't tell what changed for my team", friction: "value" },
      { id: "team",  label: "My team hasn't adopted it",           friction: "admin" },
      { id: "price", label: "Hard to justify the cost internally", friction: "admin" },
    ],
  },
  { id: "fallback-q2-u", cohort: null, questionType: "friction_drilldown", friction: "usability", order: 2, prompt: "What specifically?", active: true,
    options: ["Onboarding checklist","Connecting our data sources","Inviting teammates","Finding the right report"] },
  { id: "fallback-q2-v", cohort: null, questionType: "friction_drilldown", friction: "value", order: 2, prompt: "What specifically?", active: true,
    options: ["Need ROI numbers","Need a baseline comparison","Need exec-ready summary","Need usage trends"] },
  { id: "fallback-q2-a", cohort: null, questionType: "friction_drilldown", friction: "admin", order: 2, prompt: "What specifically?", active: true,
    options: ["Need more seats","Need procurement help","Need a discount","Need an SSO/security review"] },
];

export const FALLBACK_ACADEMY_STEPS: AcademyStepRecord[] = [
  { id: "workspace",  label: "Create your workspace",          sub: "Auto-completed when you signed up.",                       order: 1, failing: false },
  { id: "warehouse",  label: "Connect your data warehouse",    sub: "Snowflake, BigQuery, Postgres — 90s avg.",                 order: 2, failing: false },
  { id: "salesforce", label: "Connect Salesforce integration", sub: "Required for the revenue attribution model.",              order: 3, failing: true  },
  { id: "report",     label: "Build your first report",        sub: "Pick a template — the wizard fills the rest.",             order: 4, failing: false },
  { id: "invite",     label: "Invite one teammate",            sub: "Accounts with 2+ seats activate 3× faster.",               order: 5, failing: false },
];

export const initialState: RetentionState = {
  users: seedUsers,
  responses: seedResponses,
  currentUserId: "u1",
  modalDismissals: 0,
  modalImpressions: 0,
  ignoreMode: false,
  invites: [],
  teamDiscountActivated: false,
  academyProgress: {},
  surveyQuestions: FALLBACK_SURVEY_QUESTIONS,
  interventionRules: FALLBACK_INTERVENTION_RULES,
  cohortConfig: FALLBACK_COHORT_CONFIG,
  baseline: FALLBACK_BASELINE,
  experimentConfig: FALLBACK_EXPERIMENT_CONFIG,
  academySteps: FALLBACK_ACADEMY_STEPS,
  entitlements: {},
  isHydrating: true,
  hydrationError: null,
};