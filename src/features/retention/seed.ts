import type { SimUser, SurveyResponse, RetentionState } from "./types";

export const seedUsers: SimUser[] = [
  { id: "u1", name: "Mara Chen", company: "Northwind Ops", role: "Ops Lead", dayInJourney: 14, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u2", name: "Devon Park", company: "Vector Eng", role: "VP of Product", dayInJourney: 45, seatsActive: 2, activated: true, surveyed: false, churned: false },
  { id: "u3", name: "Riya Shah", company: "Lumen Labs", role: "Head of RevOps", dayInJourney: 8, seatsActive: 1, activated: false, surveyed: false, churned: false },
  { id: "u4", name: "Theo Kade", company: "Outpost.io", role: "Director of CS", dayInJourney: 62, seatsActive: 3, activated: true, surveyed: false, churned: false },
];

// Real verbatim user quotes from the discovery brief — hardcoded so the admin
// view never shows empty/filler data on first load.
export const seedResponses: SurveyResponse[] = [
  {
    id: "seed-1", userId: "u1", cohort: "day14", friction: "value",
    q1: "I can't tell what changed for my team", q2: "Need a baseline comparison", q3: "2/10 likely to renew",
    freeText: "Honestly, I churned on Day 12. I didn't know what it did for me day-to-day.",
    intervention: "send_roi_report", interventionAccepted: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "seed-2", userId: "u2", cohort: "day45", friction: "value",
    q1: "I can't tell what changed for my team", q2: "Need exec-ready summary", q3: "4/10 likely to renew",
    freeText: "I sat in my QBR and couldn't point to a single number that changed because of this tool.",
    intervention: "send_roi_report", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "seed-3", userId: "u3", cohort: "day14", friction: "usability",
    q1: "I'm stuck getting it configured", q2: "Connecting our data sources", q3: "3/10 likely to renew",
    freeText: "Spent two hours trying to wire up our warehouse and gave up. Docs assume I'm already an admin.",
    intervention: "book_cs_call", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "seed-4", userId: "u4", cohort: "day45", friction: "admin",
    q1: "My team hasn't adopted it", q2: "Need more seats", q3: "6/10 likely to renew",
    freeText: "I'm the only seat using it. Finance won't approve more until I prove adoption.",
    intervention: "unlock_team_discount", interventionAccepted: true,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
];

export const initialState: RetentionState = {
  users: seedUsers,
  responses: seedResponses,
  currentUserId: "u1",
  modalDismissals: 2,
  modalImpressions: 6,
  ignoreMode: false,
  invites: [],
  teamDiscountActivated: false,
  academyProgress: {},
};