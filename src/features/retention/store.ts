import { useSyncExternalStore } from "react";
import type {
  Cohort,
  FrictionType,
  RetentionState,
  SurveyResponse,
} from "./types";
import { initialState } from "./seed";
import { resolveInterventionFromRules } from "./intervention";
import { fetchAll, seedIfEmpty, sync } from "./supabase-sync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// UI-only device-local fields are no longer persisted — currentUserId comes
// from the Supabase auth session, not localStorage.

let state: RetentionState = load();
const listeners = new Set<() => void>();

function load(): RetentionState {
  // Start from an EMPTY domain state — Supabase hydration fills it in once
  // an authenticated session is available.
  const empty: RetentionState = {
    ...initialState,
    users: [],
    responses: [],
    invites: [],
    academyProgress: {},
    modalImpressions: 0,
    modalDismissals: 0,
    ignoreMode: false,
    teamDiscountActivated: false,
    entitlements: {},
    currentUserId: "",
    isHydrating: true,
    hydrationError: null,
  };
  return empty;
}

function persist() {
  // no-op: nothing persisted to localStorage in the auth model.
}

function setState(updater: (s: RetentionState) => RetentionState) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState() {
  return state;
}

export function useRetentionStore<T>(selector: (s: RetentionState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}

// ---------- Supabase hydration ----------

let hydratePromise: Promise<void> | undefined;

async function hydrate() {
  setState((s) => ({ ...s, isHydrating: true, hydrationError: null }));
  try {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? "";
    if (!uid) {
      // No session — leave the store empty. Public routes render fine.
      setState((s) => ({ ...s, isHydrating: false }));
      return;
    }
    const data = await fetchAll();
    setState((s) => ({
      ...s,
      currentUserId: uid,
      users: data.users,
      responses: data.responses,
      invites: data.invites,
      academyProgress: data.academyProgress,
      surveyQuestions: data.surveyQuestions,
      interventionRules: data.interventionRules,
      cohortConfig: data.cohortConfig,
      baseline: data.baseline,
      experimentConfig: data.experimentConfig,
      academySteps: data.academySteps,
      entitlements: data.entitlements,
      ignoreMode: data.experimentConfig.ignoreMode,
      modalImpressions: data.modalImpressions,
      modalDismissals: data.modalDismissals,
      teamDiscountActivated: data.entitlements[uid] ?? false,
      isHydrating: false,
      hydrationError: null,
    }));
  } catch (err) {
    console.error("[retention-store] hydrate failed", err);
    const msg = err instanceof Error ? err.message : String(err);
    setState((s) => ({ ...s, isHydrating: false, hydrationError: msg }));
    toast.error("Couldn't load your data", { description: msg });
    throw err;
  }
}

export function ensureHydrated() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hydratePromise) hydratePromise = hydrate().catch(() => {});
  return hydratePromise;
}

/** Re-run hydration after a failure. Used by the ErrorBoundary Retry button. */
export function retryHydration() {
  hydratePromise = undefined;
  return ensureHydrated();
}

// Kick off hydration as soon as the store module loads in the browser.
if (typeof window !== "undefined") {
  void ensureHydrated();
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "USER_UPDATED") {
      hydratePromise = undefined;
      void ensureHydrated();
    } else if (event === "SIGNED_OUT") {
      hydratePromise = undefined;
      setState((s) => ({
        ...s,
        currentUserId: "",
        users: [],
        responses: [],
        invites: [],
        academyProgress: {},
        modalImpressions: 0,
        modalDismissals: 0,
        teamDiscountActivated: false,
        entitlements: {},
      }));
    }
  });
}

export const actions = {
  setDay(id: string, day: number) {
    let updated: ReturnType<typeof Object> | undefined;
    setState((s) => ({
      ...s,
      users: s.users.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, dayInJourney: day, surveyed: false };
        updated = next;
        return next;
      }),
    }));
    if (updated) {
      // Prefer profile write for the current auth user; fall back to sim_users
      // (admin-only via RLS) for legacy seeded personas.
      if (id === state.currentUserId) sync.upsertOwnProfile(updated as never);
      else sync.upsertUser(updated as never);
    }
  },
  recordImpression() {
    const userId = state.currentUserId;
    setState((s) => ({ ...s, modalImpressions: s.modalImpressions + 1 }));
    sync.recordModalEvent(userId || null, "impression", null);
  },
  recordDismissal() {
    const userId = state.currentUserId;
    setState((s) => ({ ...s, modalDismissals: s.modalDismissals + 1 }));
    sync.recordModalEvent(userId || null, "dismissal", null);
  },
  setIgnoreMode(v: boolean) {
    setState((s) => ({
      ...s,
      ignoreMode: v,
      experimentConfig: { ...s.experimentConfig, ignoreMode: v },
    }));
    sync.setIgnoreMode(v);
  },
  inviteTeammate(email: string) {
    const inviter = state.currentUserId;
    setState((s) => ({ ...s, invites: [...s.invites, { email, status: "pending" }] }));
    return sync.insertInvite(inviter, email).catch((err) => {
      // Rollback optimistic insert so the user can retry.
      setState((s) => ({ ...s, invites: s.invites.filter((i) => i.email !== email) }));
      throw err;
    });
  },
  removeInvite(email: string) {
    setState((s) => ({ ...s, invites: s.invites.filter((i) => i.email !== email) }));
    sync.deleteInvite(email);
  },
  acceptTeamDiscount() {
    const userId = state.currentUserId;
    setState((s) => ({
      ...s,
      teamDiscountActivated: true,
      entitlements: { ...s.entitlements, [userId]: true },
    }));
    if (userId) sync.activateTeamDiscount(userId);
  },
  setAcademyStep(id: string, done: boolean) {
    const userId = state.currentUserId;
    setState((s) => ({ ...s, academyProgress: { ...s.academyProgress, [id]: done } }));
    sync.upsertAcademy(userId, id, done);
  },
  resetAcademy() {
    const userId = state.currentUserId;
    setState((s) => ({ ...s, academyProgress: {} }));
    sync.clearAcademyForUser(userId);
  },
  /**
   * Simulate N user sessions. When ignoreMode is on every session is recorded
   * as an impression+dismissal (no response) so the engagement rate collapses
   * and the kill switch fires. Otherwise responses are sampled across cohorts
   * and friction types.
   */
  simulateSessions(n: number) {
    const generated: SurveyResponse[] = [];
    const impressionEvents: { userId: string | null; cohort: Cohort | null }[] = [];
    setState((s) => {
      if (s.ignoreMode) {
        // Record ignored-session impressions+dismissals
        for (let i = 0; i < n; i++) {
          impressionEvents.push({ userId: s.users[i % Math.max(1, s.users.length)]?.id ?? null, cohort: null });
        }
        return {
          ...s,
          modalImpressions: s.modalImpressions + n,
          modalDismissals: s.modalDismissals + n,
        };
      }
      const newResponses: SurveyResponse[] = [];
      const frictions: FrictionType[] = ["usability", "value", "admin"];
      const cohorts: Cohort[] = ["day14", "day45"];
      for (let i = 0; i < n; i++) {
        const friction = frictions[i % 3];
        const cohort = cohorts[i % 2];
        const intervention = resolveInterventionFromRules(s.interventionRules, friction, cohort);
        newResponses.push({
          id: crypto.randomUUID(),
          userId: s.users[i % s.users.length].id,
          cohort,
          friction,
          q1: "[simulated session]",
          q2: "[simulated]",
          q3: `${3 + (i % 7)}/10 likely to renew`,
          freeText: "",
          intervention,
          interventionAccepted: Math.random() < 0.65,
          createdAt: Date.now() - i * 1000,
        });
        impressionEvents.push({ userId: newResponses[newResponses.length - 1].userId, cohort });
      }
      generated.push(...newResponses);
      return {
        ...s,
        responses: [...newResponses, ...s.responses],
        modalImpressions: s.modalImpressions + n,
      };
    });
    if (generated.length > 0) sync.insertResponses(generated);
    // Fire impression events for every simulated session (and dismissals when ignore mode).
    for (const e of impressionEvents) {
      sync.recordModalEvent(e.userId, "impression", e.cohort);
    }
    if (state.ignoreMode) {
      for (const e of impressionEvents) sync.recordModalEvent(e.userId, "dismissal", e.cohort);
    } else {
      for (const e of impressionEvents) sync.recordModalEvent(e.userId, "submit", e.cohort);
    }
  },
  async submitResponse(r: Omit<SurveyResponse, "id" | "createdAt">) {
    const response: SurveyResponse = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    let updatedUser: ReturnType<typeof Object> | undefined;
    setState((s) => ({
      ...s,
      responses: [response, ...s.responses],
      users: s.users.map((u) => {
        if (u.id !== r.userId) return u;
        const next = { ...u, surveyed: true };
        updatedUser = next;
        return next;
      }),
    }));
    try {
      await sync.insertResponse(response);
      if (updatedUser) {
        if (r.userId === state.currentUserId) sync.upsertOwnProfile(updatedUser as never);
        else sync.upsertUser(updatedUser as never);
      }
    } catch (err) {
      // Roll back so the user can retry with their input still on screen.
      setState((s) => ({
        ...s,
        responses: s.responses.filter((x) => x.id !== response.id),
        users: s.users.map((u) => (u.id === r.userId ? { ...u, surveyed: false } : u)),
      }));
      throw err;
    }
    return response;
  },
  acceptIntervention(id: string, accepted: boolean) {
    setState((s) => ({
      ...s,
      responses: s.responses.map((r) => (r.id === id ? { ...r, interventionAccepted: accepted } : r)),
    }));
    sync.updateResponseAccepted(id, accepted);
  },
  async reset() {
    setState((s) => ({
      ...s,
      users: [],
      responses: [],
      invites: [],
      academyProgress: {},
      modalImpressions: 0,
      modalDismissals: 0,
      ignoreMode: false,
      teamDiscountActivated: false,
      entitlements: {},
    }));
    await sync.resetAll();
    hydratePromise = undefined;
    await ensureHydrated();
  },
};