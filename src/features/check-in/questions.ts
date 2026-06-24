import type { FrictionType, RetentionState, SurveyQuestion } from "@/features/retention";

export type Q1 = "setup" | "value" | "team" | "price";

export interface Q1Option { id: string; label: string; friction: FrictionType }

export const Q1_OPTIONS: Q1Option[] = [
  { id: "setup", label: "Stuck getting it configured", friction: "usability" },
  { id: "value", label: "Can't tell what changed for my team", friction: "value" },
  { id: "team", label: "My team hasn't adopted it", friction: "admin" },
  { id: "price", label: "Hard to justify the cost internally", friction: "admin" },
];

export const Q2_BY_FRICTION: Record<FrictionType, string[]> = {
  usability: ["Onboarding checklist", "Connecting our data sources", "Inviting teammates", "Finding the right report"],
  value: ["Need ROI numbers", "Need a baseline comparison", "Need exec-ready summary", "Need usage trends"],
  admin: ["Need more seats", "Need procurement help", "Need a discount", "Need an SSO/security review"],
};

/** UX latency for the 0.8s skeleton between Submit and the intervention. */
export const ANALYZE_LATENCY_MS = 800;

/**
 * Pull Q1 (friction-pick) options from the DB-backed survey_questions table.
 * Falls back to the hardcoded constant above when nothing is hydrated yet.
 */
export function getQ1Options(qs: SurveyQuestion[]): Q1Option[] {
  const q = qs.find((x) => x.questionType === "friction_pick" && x.active);
  if (!q) return Q1_OPTIONS;
  const opts = q.options as Q1Option[] | undefined;
  return Array.isArray(opts) && opts.length ? opts : Q1_OPTIONS;
}

/** Pull Q2 drill-down options for the chosen friction bucket. */
export function getQ2Options(qs: SurveyQuestion[], friction: FrictionType): string[] {
  const q = qs.find(
    (x) => x.questionType === "friction_drilldown" && x.friction === friction && x.active,
  );
  if (!q) return Q2_BY_FRICTION[friction];
  const opts = q.options as string[] | undefined;
  return Array.isArray(opts) && opts.length ? opts : Q2_BY_FRICTION[friction];
}

export function getAnalyzeLatencyMs(s: RetentionState): number {
  return s.experimentConfig?.analyzeLatencyMs ?? ANALYZE_LATENCY_MS;
}