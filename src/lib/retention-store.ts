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
}

const STORAGE_KEY = "retention-engine-state-v1";

const seedUsers: SimUser[] = [
  { id: "u1", name: "Mara Chen", company: "Northwind Ops", dayInJourney: 14, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u2", name: "Devon Park", company: "Vector Eng", dayInJourney: 45, seatsActive: 2, activated: true, surveyed: false, churned: false },
  { id: "u3", name: "Riya Shah", company: "Lumen Labs", dayInJourney: 8, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u4", name: "Theo Kade", company: "Outpost.io", dayInJourney: 62, seatsActive: 3, activated: true, surveyed: false, churned: false },
];

const initialState: State = {
  users: seedUsers,
  responses: [],
  currentUserId: "u1",
  modalDismissals: 0,
  modalImpressions: 0,
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
    setState(() => ({ ...initialState, users: seedUsers.map((u) => ({ ...u })) }));
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