import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  AcademyStepRecord,
  Baseline,
  Cohort,
  CohortConfigEntry,
  ExperimentConfig,
  FrictionType,
  InterventionAction,
  InterventionRule,
  SimUser,
  SurveyQuestion,
  SurveyResponse,
} from "./types";
import {
  FALLBACK_ACADEMY_STEPS,
  FALLBACK_BASELINE,
  FALLBACK_COHORT_CONFIG,
  FALLBACK_EXPERIMENT_CONFIG,
  FALLBACK_INTERVENTION_RULES,
  FALLBACK_SURVEY_QUESTIONS,
  seedResponses,
  seedUsers,
} from "./seed";

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

type DbSurveyQuestion = {
  id: string;
  cohort: Cohort | null;
  question_type: "friction_pick" | "friction_drilldown";
  friction: FrictionType | null;
  order: number;
  prompt: string;
  options: unknown;
  active: boolean;
};

type DbInterventionRule = {
  cohort: Cohort;
  friction: FrictionType;
  action: InterventionAction;
  label: string;
  active: boolean;
};

type DbCohortConfig = {
  name: Cohort;
  min_day: number;
  max_day: number;
  active: boolean;
};

type DbOrgBaseline = {
  ninety_day_churn: number;
  activation_rate: number;
  seats_per_account: number;
  time_to_first_value_days: number;
};

type DbExperimentConfigRow = { key: string; value: unknown };

type DbAcademyStep = {
  step_id: string;
  label: string;
  sub: string;
  order: number;
  is_failing: boolean;
  active: boolean;
};

type DbUserEntitlement = {
  user_id: string;
  team_discount_activated: boolean;
};

type DbProfile = {
  id: string;
  display_name: string;
  company: string;
  product_role: string;
  day_in_journey: number;
  seats_active: number;
  activated: boolean;
  surveyed: boolean;
  churned: boolean;
};

export function dbProfileToSimUser(p: DbProfile): SimUser {
  return {
    id: p.id,
    name: p.display_name || "Member",
    company: p.company || "",
    role: p.product_role || "Member",
    dayInJourney: p.day_in_journey,
    seatsActive: p.seats_active,
    activated: p.activated,
    surveyed: p.surveyed,
    churned: p.churned,
  };
}

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
  const [
    usersRes, profilesRes, respRes, invRes, acadRes,
    questionsRes, rulesRes, cohortRes, baselineRes,
    cfgRes, stepsRes, entRes, modalRes,
  ] = await Promise.all([
    supabase.from("sim_users").select("*"),
    supabase.from("profiles").select("*"),
    supabase.from("survey_responses").select("*").order("created_at", { ascending: false }),
    supabase.from("invites").select("*").order("created_at", { ascending: false }),
    supabase.from("academy_progress").select("*"),
    supabase.from("survey_questions").select("*").eq("active", true).order("order", { ascending: true }),
    supabase.from("intervention_rules").select("*").eq("active", true),
    supabase.from("cohort_config").select("*").eq("active", true),
    supabase.from("org_baselines").select("*").order("updated_at", { ascending: false }).limit(1),
    supabase.from("experiment_config").select("*"),
    supabase.from("academy_steps").select("*").eq("active", true).order("order", { ascending: true }),
    supabase.from("user_entitlements").select("*"),
    supabase.from("modal_events").select("event_type"),
  ]);
  for (const r of [usersRes, respRes, invRes, acadRes, questionsRes, rulesRes, cohortRes, baselineRes, cfgRes, stepsRes, entRes, modalRes]) {
    if (r.error) throw r.error;
  }

  // Aggregate modal events into impression / dismissal counts.
  const modalCounts = { impressions: 0, dismissals: 0 };
  for (const ev of (modalRes.data as { event_type: string }[])) {
    if (ev.event_type === "impression") modalCounts.impressions++;
    else if (ev.event_type === "dismissal") modalCounts.dismissals++;
  }

  // Build experiment_config object with fallbacks for any missing keys.
  const cfgMap = new Map<string, unknown>((cfgRes.data as DbExperimentConfigRow[]).map((r) => [r.key, r.value]));
  const num = (k: string, fallback: number) => {
    const v = cfgMap.get(k);
    return typeof v === "number" ? v : fallback;
  };
  const experimentConfig: ExperimentConfig = {
    killSwitchThreshold: num("kill_switch_threshold", FALLBACK_EXPERIMENT_CONFIG.killSwitchThreshold),
    engagementTarget:    num("engagement_target",    FALLBACK_EXPERIMENT_CONFIG.engagementTarget),
    analyzeLatencyMs:    num("analyze_latency_ms",   FALLBACK_EXPERIMENT_CONFIG.analyzeLatencyMs),
    ignoreMode: cfgMap.get("ignore_mode") === true,
  };

  const baselineRow = (baselineRes.data as DbOrgBaseline[])[0];
  const baseline: Baseline = baselineRow
    ? {
        ninetyDayChurn: Number(baselineRow.ninety_day_churn),
        activationRate: Number(baselineRow.activation_rate),
        seatsPerAccount: Number(baselineRow.seats_per_account),
        timeToFirstValueDays: Number(baselineRow.time_to_first_value_days),
      }
    : FALLBACK_BASELINE;

  const surveyQuestions: SurveyQuestion[] = (questionsRes.data as DbSurveyQuestion[]).map((q) => ({
    id: q.id, cohort: q.cohort, questionType: q.question_type, friction: q.friction,
    order: q.order, prompt: q.prompt, options: q.options, active: q.active,
  }));

  const interventionRules: InterventionRule[] = (rulesRes.data as DbInterventionRule[]).map((r) => ({
    cohort: r.cohort, friction: r.friction, action: r.action, label: r.label, active: r.active,
  }));

  const cohortConfig: CohortConfigEntry[] = (cohortRes.data as DbCohortConfig[]).map((c) => ({
    name: c.name, minDay: c.min_day, maxDay: c.max_day, active: c.active,
  }));

  const academySteps: AcademyStepRecord[] = (stepsRes.data as DbAcademyStep[]).map((s) => ({
    id: s.step_id, label: s.label, sub: s.sub, order: s.order, failing: s.is_failing,
  }));

  const entitlements: Record<string, boolean> = {};
  for (const e of (entRes.data as DbUserEntitlement[])) {
    entitlements[e.user_id] = e.team_discount_activated;
  }

  // Merge profile rows + legacy sim_users. Profiles win on id collisions.
  const profilesList: SimUser[] = ((profilesRes.data as DbProfile[] | null) ?? []).map(dbProfileToSimUser);
  const simList: SimUser[] = ((usersRes.data as DbSimUser[] | null) ?? []).map(dbToSimUser);
  const seen = new Set(profilesList.map((p) => p.id));
  const mergedUsers = [...profilesList, ...simList.filter((s) => !seen.has(s.id))];

  return {
    users: mergedUsers,
    responses: (respRes.data as DbSurveyResponse[]).map(dbToResponse),
    invites: (invRes.data as DbInvite[]).map((i) => ({ email: i.email, status: i.status })),
    academyProgress: (acadRes.data as DbAcademyProgress[]).reduce<Record<string, boolean>>(
      (acc, row) => { acc[row.step_id] = row.done; return acc; }, {},
    ),
    surveyQuestions: surveyQuestions.length ? surveyQuestions : FALLBACK_SURVEY_QUESTIONS,
    interventionRules: interventionRules.length ? interventionRules : FALLBACK_INTERVENTION_RULES,
    cohortConfig: cohortConfig.length ? cohortConfig : FALLBACK_COHORT_CONFIG,
    baseline,
    experimentConfig,
    academySteps: academySteps.length ? academySteps : FALLBACK_ACADEMY_STEPS,
    entitlements,
    modalImpressions: modalCounts.impressions,
    modalDismissals: modalCounts.dismissals,
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

// ---------- writers (awaitable; global toast on error) ----------
//
// Every writer awaits the Supabase response, surfaces a Sonner toast if the
// query returns an error, and re-throws so callers can roll back optimistic
// state and preserve the user's input. Silent write failures during demos
// are no longer possible.
async function run<T extends { error: unknown }>(label: string, p: PromiseLike<T>): Promise<T> {
  const res = await p;
  const error = (res as { error: { message?: string } | null }).error;
  if (error) {
    console.error(`[retention-sync] ${label}`, error);
    toast.error("Sync failed", { description: `${label}: ${error.message ?? "unknown error"}` });
    throw error;
  }
  return res;
}

export const sync = {
  upsertUser(u: SimUser) {
    return run("upsertUser", supabase.from("sim_users").upsert(simUserToDb(u)));
  },
  upsertOwnProfile(u: SimUser) {
    return run("upsertOwnProfile", supabase.from("profiles")
      .update({
        display_name: u.name,
        company: u.company,
        product_role: u.role,
        day_in_journey: u.dayInJourney,
        seats_active: u.seatsActive,
        activated: u.activated,
        surveyed: u.surveyed,
        churned: u.churned,
      })
      .eq("id", u.id));
  },
  insertResponse(r: SurveyResponse) {
    return run("insertResponse", supabase.from("survey_responses").insert(responseToDb(r)));
  },
  insertResponses(rs: SurveyResponse[]) {
    if (rs.length === 0) return Promise.resolve();
    return run("insertResponses", supabase.from("survey_responses").insert(rs.map(responseToDb)));
  },
  updateResponseAccepted(id: string, accepted: boolean | null) {
    return run("updateResponseAccepted",
      supabase.from("survey_responses").update({ intervention_accepted: accepted }).eq("id", id));
  },
  insertInvite(inviterUserId: string, email: string) {
    return run("insertInvite",
      supabase.from("invites").insert({ inviter_user_id: inviterUserId, email, status: "pending" }));
  },
  deleteInvite(email: string) {
    return run("deleteInvite", supabase.from("invites").delete().eq("email", email));
  },
  upsertAcademy(userId: string, stepId: string, done: boolean) {
    return run("upsertAcademy", supabase.from("academy_progress").upsert(
      { user_id: userId, step_id: stepId, done },
      { onConflict: "user_id,step_id" },
    ));
  },
  clearAcademyForUser(userId: string) {
    return run("clearAcademyForUser",
      supabase.from("academy_progress").delete().eq("user_id", userId));
  },
  recordModalEvent(userId: string | null, eventType: "impression" | "dismissal" | "submit", cohort: Cohort | null) {
    return run("recordModalEvent",
      supabase.from("modal_events").insert({ user_id: userId, event_type: eventType, cohort }));
  },
  setIgnoreMode(value: boolean) {
    return run("setIgnoreMode", supabase.from("experiment_config")
      .upsert({ key: "ignore_mode", value: value as unknown as never }, { onConflict: "key" }));
  },
  setTeamDiscountActivated(userId: string, value: boolean) {
    return run("setTeamDiscountActivated", supabase.from("user_entitlements")
      .upsert(
        {
          user_id: userId,
          team_discount_activated: value,
          discount_activated_at: value ? new Date().toISOString() : null,
        },
        { onConflict: "user_id" },
      ));
  },
  async resetAll() {
    // Wipe everything; FK cascades delete responses/invites/academy.
    const tasks = await Promise.all([
      supabase.from("modal_events").delete().not("id", "is", null),
      supabase.from("user_entitlements").delete().not("id", "is", null),
      supabase.from("sim_users").delete().not("id", "is", null),
    ]);
    for (const t of tasks) if (t.error) console.error("[retention-sync] resetAll delete", t.error);
    // Reset ignore_mode back to false in experiment_config (best-effort).
    await supabase.from("experiment_config")
      .upsert({ key: "ignore_mode", value: false as unknown as never }, { onConflict: "key" });
    await seedIfEmpty();
  },
};