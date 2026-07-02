export type FrictionType = "usability" | "value" | "admin";
export type Cohort = "day14" | "day45";
export type InterventionAction =
  | "book_cs_call"
  | "unlock_team_discount"
  | "send_tutorial"
  | "send_roi_report"
  | "no_action";

export interface SurveyResponse {
  id: string;
  userId: string;
  cohort: Cohort;
  friction: FrictionType;
  q1: string;
  q2: string;
  q3: string;
  freeText: string;
  intervention: InterventionAction;
  interventionAccepted: boolean | null;
  createdAt: number;
}

export interface SimUser {
  id: string;
  name: string;
  company: string;
  role: string;
  dayInJourney: number;
  seatsActive: number;
  activated: boolean;
  surveyed: boolean;
  churned: boolean;
}

export interface RetentionState {
  users: SimUser[];
  responses: SurveyResponse[];
  currentUserId: string;
  modalDismissals: number;
  modalImpressions: number;
  ignoreMode: boolean;
  invites: { email: string; status: "pending" | "accepted" }[];
  teamDiscountActivated: boolean;
  academyProgress: Record<string, boolean>;
  /** True while the first Supabase fetch is in flight. */
  isHydrating: boolean;
  /** Non-null when the last hydration attempt threw. UI shows Retry. */
  hydrationError: string | null;
  // ---- DB-driven config (hydrated from Supabase) ----
  surveyQuestions: SurveyQuestion[];
  interventionRules: InterventionRule[];
  cohortConfig: CohortConfigEntry[];
  baseline: Baseline;
  experimentConfig: ExperimentConfig;
  academySteps: AcademyStepRecord[];
  /** userId → teamDiscountActivated */
  entitlements: Record<string, boolean>;
}

export interface SurveyQuestion {
  id: string;
  cohort: Cohort | null;
  questionType: "friction_pick" | "friction_drilldown";
  friction: FrictionType | null;
  order: number;
  prompt: string;
  /** For friction_pick: Array<{id,label,friction}>. For friction_drilldown: string[]. */
  options: unknown;
  active: boolean;
}

export interface InterventionRule {
  cohort: Cohort;
  friction: FrictionType;
  action: InterventionAction;
  label: string;
  active: boolean;
}

export interface CohortConfigEntry {
  name: Cohort;
  minDay: number;
  maxDay: number;
  active: boolean;
}

export interface Baseline {
  ninetyDayChurn: number;
  activationRate: number;
  seatsPerAccount: number;
  timeToFirstValueDays: number;
}

export interface ExperimentConfig {
  killSwitchThreshold: number;
  engagementTarget: number;
  analyzeLatencyMs: number;
  ignoreMode: boolean;
}

export interface AcademyStepRecord {
  id: string;
  label: string;
  sub: string;
  order: number;
  failing: boolean;
}