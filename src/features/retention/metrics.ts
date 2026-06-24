import type {
  Baseline,
  CohortConfigEntry,
  ExperimentConfig,
  FrictionType,
  RetentionState,
  SurveyResponse,
} from "./types";
import {
  FALLBACK_BASELINE,
  FALLBACK_COHORT_CONFIG,
  FALLBACK_EXPERIMENT_CONFIG,
} from "./seed";

/**
 * Constants kept for backward compatibility and as the SSR fallback before
 * Supabase hydration completes. The runtime values come from `org_baselines`
 * and `experiment_config` via the store.
 */
export const BASELINE: Baseline = FALLBACK_BASELINE;
export const KILL_SWITCH_THRESHOLD = FALLBACK_EXPERIMENT_CONFIG.killSwitchThreshold;
export const ENGAGEMENT_TARGET = FALLBACK_EXPERIMENT_CONFIG.engagementTarget;

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

export interface AnalyticsInput {
  responses: SurveyResponse[];
  modalImpressions: number;
  modalDismissals: number;
  ignoreMode: boolean;
  baseline?: Baseline;
  experimentConfig?: ExperimentConfig;
}

/**
 * Pure analytics derivation. Accepts either the full RetentionState or just
 * the analytics-relevant slice, so callers don't need to fabricate a state.
 */
export function deriveAnalytics(s: AnalyticsInput | RetentionState): AnalyticsSnapshot {
  const baseline = s.baseline ?? FALLBACK_BASELINE;
  const cfg = s.experimentConfig ?? FALLBACK_EXPERIMENT_CONFIG;
  const totalTargeted = s.modalImpressions || 1;
  const rawEngagementRate = s.responses.length / totalTargeted;
  const engagementRate = s.ignoreMode ? Math.min(rawEngagementRate, 0.08) : rawEngagementRate;
  const acceptedCount = s.responses.filter((r) => r.interventionAccepted === true).length;
  const actionability = s.responses.length ? acceptedCount / s.responses.length : 0;

  const counts: Record<FrictionType, number> = { usability: 0, value: 0, admin: 0 };
  s.responses.forEach((r) => { counts[r.friction]++; });
  const totalFriction = s.responses.length || 1;

  const baselineCurve = Array.from({ length: 13 }, (_, i) => 100 - (baseline.ninetyDayChurn * 100 * i) / 12);
  const lift = Math.min(15, acceptedCount * 0.4);
  const treatment = baselineCurve.map((v, i) => v + (lift * i) / 12);

  const killSwitch = s.ignoreMode || (s.modalImpressions >= 20 && engagementRate < cfg.killSwitchThreshold);

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
    baseline: baselineCurve,
    treatment,
    lift,
    killSwitch,
  };
}

/**
 * Fallback (hardcoded) cohort resolver. Used in SSR / before hydration.
 * Prefer `cohortForState(state.cohortConfig, day)` in components reading the
 * live store so PMs can re-tune the windows from `cohort_config`.
 */
export function cohortFor(day: number): "day14" | "day45" | null {
  return cohortForConfig(FALLBACK_COHORT_CONFIG, day);
}

export function cohortForConfig(
  config: CohortConfigEntry[],
  day: number,
): "day14" | "day45" | null {
  for (const c of config) {
    if (c.active && day >= c.minDay && day <= c.maxDay) return c.name;
  }
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