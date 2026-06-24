import type { Cohort, FrictionType, InterventionAction, InterventionRule } from "./types";

export function interventionFor(friction: FrictionType, cohort: Cohort): InterventionAction {
  if (friction === "usability") return cohort === "day14" ? "book_cs_call" : "send_tutorial";
  if (friction === "admin") return "unlock_team_discount";
  return "send_roi_report";
}

/**
 * DB-aware resolver. Looks up the matching row in `intervention_rules`; falls
 * back to the hardcoded mapping above when the table doesn't have one.
 */
export function resolveInterventionFromRules(
  rules: InterventionRule[],
  friction: FrictionType,
  cohort: Cohort,
): InterventionAction {
  const hit = rules.find((r) => r.cohort === cohort && r.friction === friction && r.active);
  return hit ? hit.action : interventionFor(friction, cohort);
}

export function resolveInterventionLabel(
  rules: InterventionRule[],
  friction: FrictionType,
  cohort: Cohort,
): string {
  const hit = rules.find((r) => r.cohort === cohort && r.friction === friction && r.active);
  return hit ? hit.label : interventionLabel(interventionFor(friction, cohort));
}

export function interventionLabel(a: InterventionAction): string {
  switch (a) {
    case "book_cs_call": return "Book a 15-min setup call";
    case "unlock_team_discount": return "Unlock 20% team seat discount";
    case "send_tutorial": return "Open the 4-min fast-track tutorial";
    case "send_roi_report": return "Generate your ROI snapshot";
    case "no_action": return "No follow-up";
  }
}

export function frictionLabel(f: FrictionType): string {
  return f === "usability" ? "Usability" : f === "value" ? "Value" : "Admin";
}