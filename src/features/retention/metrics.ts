import type { FrictionType, RetentionState, SurveyResponse } from "./types";

// Hardcoded baseline targets from the validation brief — these never change at runtime.
export const BASELINE = {
  ninetyDayChurn: 0.30,
  activationRate: 0.22,
  seatsPerAccount: 1.4,
  timeToFirstValueDays: 6.2,
};

export const KILL_SWITCH_THRESHOLD = 0.10;
export const ENGAGEMENT_TARGET = 0.25;

export interface AnalyticsSnapshot {
  responses: SurveyResponse[];
  impressions: number;
  dismissals: number;
  ignoreMode: boolean;
  engagementRate: number;
  rawEngagementRate: number;
  acceptedCount: number;
  actionability: number;
  counts: Record<FrictionType, number>;
  totalFriction: number;
  baseline: number[];
  treatment: number[];
  lift: number;
  killSwitch: boolean;
}

/**
 * Pure analytics derivation from the live store. Pulled out of the admin
 * component so the calculation can be tested + reused independently of UI.
 */
export function deriveAnalytics(s: RetentionState): AnalyticsSnapshot {
  const totalTargeted = s.modalImpressions || 1;
  const rawEngagementRate = s.responses.length / totalTargeted;
  // When the PM flips Ignore Mode to 100% we treat the live feed as void:
  // engagement is force-clamped below the kill threshold and the response
  // stream is suppressed in the UI (the underlying store is preserved).
  const engagementRate = s.ignoreMode ? Math.min(rawEngagementRate, 0.08) : rawEngagementRate;
  const acceptedCount = s.responses.filter((r) => r.interventionAccepted === true).length;
  const actionability = s.responses.length ? acceptedCount / s.responses.length : 0;

  const counts: Record<FrictionType, number> = { usability: 0, value: 0, admin: 0 };
  s.responses.forEach((r) => { counts[r.friction]++; });
  const totalFriction = s.responses.length || 1;

  const baseline = Array.from({ length: 13 }, (_, i) => 100 - (BASELINE.ninetyDayChurn * 100 * i) / 12);
  const lift = Math.min(15, acceptedCount * 0.4);
  const treatment = baseline.map((v, i) => v + (lift * i) / 12);

  const killSwitch = s.ignoreMode || (s.modalImpressions >= 20 && engagementRate < KILL_SWITCH_THRESHOLD);

  return {
    responses: s.responses,
    impressions: s.modalImpressions,
    dismissals: s.modalDismissals,
    ignoreMode: s.ignoreMode,
    engagementRate,
    rawEngagementRate,
    acceptedCount,
    actionability,
    counts,
    totalFriction,
    baseline,
    treatment,
    lift,
    killSwitch,
  };
}

/** Trigger window: Day 13–16 (cohort day14) and Day 44–47 (cohort day45). */
export function cohortFor(day: number): "day14" | "day45" | null {
  if (day >= 13 && day <= 16) return "day14";
  if (day >= 44 && day <= 47) return "day45";
  return null;
}

// Deterministic 12-point hourly sentiment sparkline seeded off the live count
// so each bucket gets a stable, distinct micro-trend that still reacts to volume.
export function sparkFor(friction: FrictionType, count: number): number[] {
  const seed = friction === "usability" ? 7 : friction === "value" ? 13 : 19;
  const base = 0.45 + Math.min(count, 30) / 60;
  return Array.from({ length: 12 }, (_, i) => {
    const n = Math.sin((i + seed) * 1.3) * 0.5 + Math.cos((i + seed) * 0.7) * 0.3;
    return Math.max(0.05, Math.min(1, base + n * 0.25));
  });
}

// Locale-free clock formatter so SSR and client hydrate the same string.
export function formatClock(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s} UTC`;
}