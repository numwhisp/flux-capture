import { useSyncExternalStore } from "react";

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

interface State {
  users: SimUser[];
  responses: SurveyResponse[];
  currentUserId: string;
  modalDismissals: number;
  modalImpressions: number;
  ignoreMode: boolean;
}

const STORAGE_KEY = "retention-engine-state-v2";

const seedUsers: SimUser[] = [
  { id: "u1", name: "Mara Chen", company: "Northwind Ops", role: "Ops Lead", dayInJourney: 14, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u2", name: "Devon Park", company: "Vector Eng", role: "VP of Product", dayInJourney: 45, seatsActive: 2, activated: true, surveyed: false, churned: false },
  { id: "u3", name: "Riya Shah", company: "Lumen Labs", role: "Head of RevOps", dayInJourney: 8, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u4", name: "Theo Kade", company: "Outpost.io", role: "Director of CS", dayInJourney: 62, seatsActive: 3, activated: true, surveyed: false, churned: false },
];

// Real verbatim user quotes from the discovery brief — hardcoded so the admin
// view never shows empty/filler data on first load.
const seedResponses: SurveyResponse[] = [
  {
    id: "seed-1",
    userId: "u1",
    cohort: "day14",
    friction: "value",
    q1: "I can't tell what changed for my team",
    q2: "Need a baseline comparison",
    q3: "2/10 likely to renew",
    freeText: "Honestly, I churned on Day 12. I didn't know what it did for me day-to-day.",
    intervention: "send_roi_report",
    interventionAccepted: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "seed-2",
    userId: "u2",
    cohort: "day45",
    friction: "value",
    q1: "I can't tell what changed for my team",
    q2: "Need exec-ready summary",
    q3: "4/10 likely to renew",
    freeText: "I sat in my QBR and couldn't point to a single number that changed because of this tool.",
    intervention: "send_roi_report",
    interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "seed-3",
    userId: "u3",
    cohort: "day14",
    friction: "usability",
    q1: "I'm stuck getting it configured",
    q2: "Connecting our data sources",
    q3: "3/10 likely to renew",
    freeText: "Spent two hours trying to wire up our warehouse and gave up. Docs assume I'm already an admin.",
    intervention: "book_cs_call",
    interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "seed-4",
    userId: "u4",
    cohort: "day45",
    friction: "admin",
    q1: "My team hasn't adopted it",
    q2: "Need more seats",
    q3: "6/10 likely to renew",
    freeText: "I'm the only seat using it. Finance won't approve more until I prove adoption.",
    intervention: "unlock_team_discount",
    interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
];

const initialState: State = {
  users: seedUsers,
  responses: seedResponses,
  currentUserId: "u1",
  modalDismissals: 2,
  modalImpressions: 6,
  ignoreMode: false,
};

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
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

function setState(updater: (s: State) => State) {
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

export function useRetentionStore<T>(selector: (s: State) => T): T {
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

export function interventionFor(friction: FrictionType, cohort: Cohort): InterventionAction {
  if (friction === "usability") return cohort === "day14" ? "book_cs_call" : "send_tutorial";
  if (friction === "admin") return "unlock_team_discount";
  return "send_roi_report";
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

/**
 * Lightweight regex/keyword classifier that buckets free-text feedback into
 * Usability / Value / Admin friction. Stand-in for an LLM call — runs
 * instantly client-side and stays deterministic. Returns null when no signal.
 */
export function classifyFreeText(text: string): FrictionType | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  const usability = /(setup|set up|configur|integrat|connect|onboard|confus|complicated|stuck|broke|broken|error|bug|can'?t find|how do i|docs?|tutorial|ux|ui|workflow)/;
  const value = /(roi|value|worth|number|metric|prove|justif|result|outcome|impact|baseline|qbr|exec|report|insight|moved the needle|what changed|didn'?t know what it did)/;
  const admin = /(seat|team|adopt|price|cost|discount|procure|invoice|sso|security|contract|budget|approval|finance|legal|renew|billing|plan)/;
  const scores: Record<FrictionType, number> = {
    usability: (t.match(usability) || []).length,
    value: (t.match(value) || []).length,
    admin: (t.match(admin) || []).length,
  };
  const top = (Object.entries(scores) as [FrictionType, number][])
    .sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : null;
}