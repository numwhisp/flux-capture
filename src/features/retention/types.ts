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

export interface RetentionState {
  users: SimUser[];
  responses: SurveyResponse[];
  currentUserId: string;
  modalDismissals: number;
  modalImpressions: number;
  ignoreMode: boolean;
  invites: { email: string; status: "pending" | "accepted" }[];
  teamDiscountActivated: boolean;
  academyProgress: Record<string, boolean>;
}