import type { FrictionType } from "@/features/retention";

export type Q1 = "setup" | "value" | "team" | "price";

export const Q1_OPTIONS: { id: Q1; label: string; friction: FrictionType }[] = [
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