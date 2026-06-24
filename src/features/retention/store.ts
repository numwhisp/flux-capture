import { useSyncExternalStore } from "react";
import type {
  Cohort,
  FrictionType,
  RetentionState,
  SurveyResponse,
} from "./types";
import { initialState, seedResponses, seedUsers } from "./seed";
import { interventionFor } from "./intervention";

const STORAGE_KEY = "retention-engine-state-v2";

let state: RetentionState = load();
const listeners = new Set<() => void>();

function load(): RetentionState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

export const actions = {
  setCurrentUser(id: string) {
    setState((s) => ({ ...s, currentUserId: id }));
  },
  setDay(id: string, day: number) {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === id ? { ...u, dayInJourney: day, surveyed: false } : u)),
    }));
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
    setState((s) => ({ ...s, invites: [...s.invites, { email, status: "pending" }] }));
  },
  removeInvite(email: string) {
    setState((s) => ({ ...s, invites: s.invites.filter((i) => i.email !== email) }));
  },
  acceptTeamDiscount() {
    setState((s) => ({ ...s, teamDiscountActivated: true }));
  },
  setAcademyStep(id: string, done: boolean) {
    setState((s) => ({ ...s, academyProgress: { ...s.academyProgress, [id]: done } }));
  },
  resetAcademy() {
    setState((s) => ({ ...s, academyProgress: {} }));
  },
  /**
   * Simulate N user sessions. When ignoreMode is on every session is recorded
   * as an impression+dismissal (no response) so the engagement rate collapses
   * and the kill switch fires. Otherwise responses are sampled across cohorts
   * and friction types.
   */
  simulateSessions(n: number) {
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
          id: `sim-${Date.now()}-${i}`,
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
      return {
        ...s,
        responses: [...newResponses, ...s.responses],
        modalImpressions: s.modalImpressions + n,
      };
    });
  },
  submitResponse(r: Omit<SurveyResponse, "id" | "createdAt">) {
    const response: SurveyResponse = {
      ...r,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setState((s) => ({
      ...s,
      responses: [response, ...s.responses],
      users: s.users.map((u) => (u.id === r.userId ? { ...u, surveyed: true } : u)),
    }));
    return response;
  },
  acceptIntervention(id: string, accepted: boolean) {
    setState((s) => ({
      ...s,
      responses: s.responses.map((r) => (r.id === id ? { ...r, interventionAccepted: accepted } : r)),
    }));
  },
  reset() {
    setState(() => ({
      ...initialState,
      users: seedUsers.map((u) => ({ ...u })),
      responses: seedResponses.map((r) => ({ ...r })),
    }));
  },
};