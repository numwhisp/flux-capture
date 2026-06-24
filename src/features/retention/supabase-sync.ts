import { supabase } from "@/integrations/supabase/client";
import type {
  Cohort,
  FrictionType,
  InterventionAction,
  SimUser,
  SurveyResponse,
} from "./types";
import { seedUsers, seedResponses } from "./seed";

// ---------- mappers ----------

type DbSimUser = {
  id: string;
  name: string;
  company: string;
  role: string;
  day_in_journey: number;
  seats_active: number;
  activated: boolean;
  surveyed: boolean;
  churned: boolean;
};

type DbSurveyResponse = {
  id: string;
  user_id: string;
  cohort: Cohort;
  friction: FrictionType;
  q1: string;
  q2: string;
  q3: string;
  free_text: string;
  intervention: InterventionAction;
  intervention_accepted: boolean | null;
  created_at: string;
};

type DbInvite = {
  id: string;
  inviter_user_id: string;
  email: string;
  status: "pending" | "accepted";
};

type DbAcademyProgress = {
  user_id: string;
  step_id: string;
  done: boolean;
};

export function dbToSimUser(r: DbSimUser): SimUser {
  return {
    id: r.id, name: r.name, company: r.company, role: r.role,
    dayInJourney: r.day_in_journey, seatsActive: r.seats_active,
    activated: r.activated, surveyed: r.surveyed, churned: r.churned,
  };
}

export function simUserToDb(u: SimUser): DbSimUser {
  return {
    id: u.id, name: u.name, company: u.company, role: u.role,
    day_in_journey: u.dayInJourney, seats_active: u.seatsActive,
    activated: u.activated, surveyed: u.surveyed, churned: u.churned,
  };
}

export function dbToResponse(r: DbSurveyResponse): SurveyResponse {
  return {
    id: r.id, userId: r.user_id, cohort: r.cohort, friction: r.friction,
    q1: r.q1, q2: r.q2, q3: r.q3, freeText: r.free_text,
    intervention: r.intervention, interventionAccepted: r.intervention_accepted,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function responseToDb(r: SurveyResponse) {
  return {
    id: r.id, user_id: r.userId, cohort: r.cohort, friction: r.friction,
    q1: r.q1, q2: r.q2, q3: r.q3, free_text: r.freeText,
    intervention: r.intervention, intervention_accepted: r.interventionAccepted,
    created_at: new Date(r.createdAt).toISOString(),
  };
}

// ---------- fetchers ----------

export async function fetchAll() {
  const [usersRes, respRes, invRes, acadRes] = await Promise.all([
    supabase.from("sim_users").select("*"),
    supabase.from("survey_responses").select("*").order("created_at", { ascending: false }),
    supabase.from("invites").select("*").order("created_at", { ascending: false }),
    supabase.from("academy_progress").select("*"),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (respRes.error) throw respRes.error;
  if (invRes.error) throw invRes.error;
  if (acadRes.error) throw acadRes.error;
  return {
    users: (usersRes.data as DbSimUser[]).map(dbToSimUser),
    responses: (respRes.data as DbSurveyResponse[]).map(dbToResponse),
    invites: (invRes.data as DbInvite[]).map((i) => ({ email: i.email, status: i.status })),
    academyProgress: (acadRes.data as DbAcademyProgress[]).reduce<Record<string, boolean>>(
      (acc, row) => { acc[row.step_id] = row.done; return acc; }, {},
    ),
  };
}

export async function seedIfEmpty() {
  const { count, error } = await supabase
    .from("sim_users")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return false;
  const { error: uErr } = await supabase.from("sim_users").insert(seedUsers.map(simUserToDb));
  if (uErr) throw uErr;
  const { error: rErr } = await supabase.from("survey_responses").insert(seedResponses.map(responseToDb));
  if (rErr) throw rErr;
  return true;
}

// ---------- writers (fire-and-forget; log on error) ----------

function logErr(label: string) {
  return (err: unknown) => {
    if (err) console.error(`[retention-sync] ${label}`, err);
  };
}

export const sync = {
  upsertUser(u: SimUser) {
    supabase.from("sim_users").upsert(simUserToDb(u)).then(({ error }) => logErr("upsertUser")(error));
  },
  insertResponse(r: SurveyResponse) {
    supabase.from("survey_responses").insert(responseToDb(r)).then(({ error }) => logErr("insertResponse")(error));
  },
  insertResponses(rs: SurveyResponse[]) {
    if (rs.length === 0) return;
    supabase.from("survey_responses").insert(rs.map(responseToDb)).then(({ error }) => logErr("insertResponses")(error));
  },
  updateResponseAccepted(id: string, accepted: boolean | null) {
    supabase.from("survey_responses").update({ intervention_accepted: accepted }).eq("id", id)
      .then(({ error }) => logErr("updateResponseAccepted")(error));
  },
  insertInvite(inviterUserId: string, email: string) {
    supabase.from("invites").insert({ inviter_user_id: inviterUserId, email, status: "pending" })
      .then(({ error }) => logErr("insertInvite")(error));
  },
  deleteInvite(email: string) {
    supabase.from("invites").delete().eq("email", email)
      .then(({ error }) => logErr("deleteInvite")(error));
  },
  upsertAcademy(userId: string, stepId: string, done: boolean) {
    supabase.from("academy_progress").upsert(
      { user_id: userId, step_id: stepId, done },
      { onConflict: "user_id,step_id" },
    ).then(({ error }) => logErr("upsertAcademy")(error));
  },
  clearAcademyForUser(userId: string) {
    supabase.from("academy_progress").delete().eq("user_id", userId)
      .then(({ error }) => logErr("clearAcademyForUser")(error));
  },
  async resetAll() {
    // Wipe everything; FK cascades delete responses/invites/academy.
    const del = await supabase.from("sim_users").delete().not("id", "is", null);
    if (del.error) console.error("[retention-sync] resetAll delete", del.error);
    await seedIfEmpty();
  },
};