import { useSyncExternalStore } from "react";
import type {
  Cohort,
  FrictionType,
  RetentionState,
  SurveyResponse,
} from "./types";
import { initialState } from "./seed";
import { interventionFor } from "./intervention";
import { fetchAll, seedIfEmpty, sync } from "./supabase-sync";

// Only UI-only / device-local fields are persisted to localStorage. All
// domain data (users, responses, invites, academyProgress) lives in Supabase.
const STORAGE_KEY = "retention-engine-ui-v3";

type LocalUiState = Pick<
  RetentionState,
  "currentUserId" | "modalImpressions" | "modalDismissals" | "ignoreMode" | "teamDiscountActivated"
>;

let state: RetentionState = load();
const listeners = new Set<() => void>();

function load(): RetentionState {
  // Start from an EMPTY domain state — Supabase hydration fills it in. Only
  // UI-only fields are restored from localStorage so the experience survives
  // a page reload without races against the network round-trip.
  const empty: RetentionState = {
    ...initialState,
    users: [],
    responses: [],
    invites: [],
    academyProgress: {},
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const ui = JSON.parse(raw) as Partial<LocalUiState>;
    return { ...empty, ...ui };
  } catch {
    return empty;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const ui: LocalUiState = {
      currentUserId: state.currentUserId,
      modalImpressions: state.modalImpressions,
      modalDismissals: state.modalDismissals,
      ignoreMode: state.ignoreMode,
      teamDiscountActivated: state.teamDiscountActivated,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
  } catch {
    /* ignore */
  }
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
  try {
    await seedIfEmpty();
    const data = await fetchAll();
    setState((s) => ({
      ...s,
      users: data.users,
      responses: data.responses,
      invites: data.invites,
      academyProgress: data.academyProgress,
    }));
  } catch (err) {
    console.error("[retention-store] hydrate failed", err);
  }
}

export function ensureHydrated() {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hydratePromise) hydratePromise = hydrate();
  return hydratePromise;
}

// Kick off hydration as soon as the store module loads in the browser.
if (typeof window !== "undefined") {
  void ensureHydrated();
}

export const actions = {
  setCurrentUser(id: string) {
    setState((s) => ({ ...s, currentUserId: id }));
  },
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
    if (updated) sync.upsertUser(updated as never);
  },
  recordImpression() {
    setState((s) => ({ ...s, modalImpressions: s.modalImpressions + 1 }));
  },
  recordDismissal() {
    setState((s) => ({ ...s, modalDismissals: s.modalDismissals + 1 }));
  },
  setIgnoreMode(v: boolean) {
    setState((s) => ({ ...s, ignoreMode: v }));
  },
  inviteTeammate(email: string) {
    const inviter = state.currentUserId;
    setState((s) => ({ ...s, invites: [...s.invites, { email, status: "pending" }] }));
    sync.insertInvite(inviter, email);
  },
  removeInvite(email: string) {
    setState((s) => ({ ...s, invites: s.invites.filter((i) => i.email !== email) }));
    sync.deleteInvite(email);
  },
  acceptTeamDiscount() {
    setState((s) => ({ ...s, teamDiscountActivated: true }));
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
    setState((s) => {
      if (s.ignoreMode) {
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
        const intervention = interventionFor(friction, cohort);
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
      }
      generated.push(...newResponses);
      return {
        ...s,
        responses: [...newResponses, ...s.responses],
        modalImpressions: s.modalImpressions + n,
      };
    });
    if (generated.length > 0) sync.insertResponses(generated);
  },
  submitResponse(r: Omit<SurveyResponse, "id" | "createdAt">) {
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
    sync.insertResponse(response);
    if (updatedUser) sync.upsertUser(updatedUser as never);
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
    }));
    await sync.resetAll();
    hydratePromise = undefined;
    await ensureHydrated();
  },
};