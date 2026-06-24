# Integration Plan — The Retention Engine

## Section 1: M4 Status Check

| Item | Status | Notes |
|---|---|---|
| Number of screens | **6 routes** | `/` (LandingPage), `/dashboard` (WorkspacePage), `/dashboard/academy` (FastTrackAcademyPage), `/dashboard/team` (TeamWorkspacePage), `/admin` (AdminAnalyticsPage), plus the `__root` shell + `dashboard.tsx` layout. Major in-app surfaces also include the CheckInWidget modal + PostSubmissionIntervention overlay. |
| Living PRD | ✅ Present | `PRD.md` + `README.md` + `HANDOFF.md` at repo root. |
| Clean naming | ✅ Yes | Descriptive: `deriveAnalytics`, `cohortFor`, `interventionFor`, `classifyFreeText`, `useRetentionStore`, `simulateSessions`. Feature folders mirror domain language. |
| GitHub connected | ✅ Yes | Repo under version control via the Lovable GitHub integration. |
| Database backend | ✅ Connected | Lovable Cloud (Supabase) wired. 4 live tables: `sim_users`, `survey_responses`, `invites`, `academy_progress`. Sync layer in `src/features/retention/supabase-sync.ts`. |

---

## Section 2: Data Audit — What's Still Hardcoded?

| Screen / Component | Hardcoded Value | What It Should Query |
|---|---|---|
| `src/features/retention/seed.ts` | 4 personas (Mara Chen / Devon Park / Riya Shah / Theo Kade) with companies, roles, day-in-journey | `profiles` table joined to `auth.users`; remove seed once real signups exist |
| `src/features/retention/seed.ts` | 4 verbatim survey quotes used as initial responses | `survey_responses` only; do not auto-seed in prod |
| `src/features/retention/seed.ts` | `modalImpressions: 6`, `modalDismissals: 2` defaults | New `modal_events` table; `COUNT(*) WHERE event_type IN ('impression','dismissal')` |
| `src/features/check-in/questions.ts` | `Q1_OPTIONS` (4 friction prompts) + `Q2_BY_FRICTION` (12 follow-ups) | New `survey_questions` table with `cohort`, `order`, `friction_tag`, `options jsonb` |
| `src/features/check-in/questions.ts` | `ANALYZE_LATENCY_MS = 800` | New `experiment_config` table or env-backed feature flag |
| `src/features/retention/intervention.ts` | Cohort × friction → intervention mapping (4 rules) | New `intervention_rules` table (`cohort`, `friction`, `action`, `copy`) |
| `src/features/retention/intervention.ts` | Intervention button labels ("Book a 15-min setup call", etc.) | `intervention_rules.label` column |
| `src/features/retention/metrics.ts` | `BASELINE.ninetyDayChurn = 0.30`, `activationRate = 0.22`, `seatsPerAccount = 1.4`, `timeToFirstValueDays = 6.2` | New `org_baselines` table keyed by account/org |
| `src/features/retention/metrics.ts` | `KILL_SWITCH_THRESHOLD = 0.10`, `ENGAGEMENT_TARGET = 0.25` | `experiment_config` table |
| `src/features/retention/metrics.ts` | Cohort trigger windows (Day 13–16, Day 44–47) | New `cohort_config` table (`name`, `min_day`, `max_day`) |
| `src/features/academy/steps.ts` | 5 onboarding steps with labels, sub-copy, and `failing: true` flag for Salesforce | New `academy_steps` table (`step_id`, `label`, `sub`, `order`, `is_failing`) |
| `AdminAnalyticsPage.tsx` / `Charts.tsx` | Baseline + treatment retention curve generated from constants | Derived live from `survey_responses` + `org_baselines` |
| `WorkspaceWidgets.tsx` | Static dashboard widget copy/numbers | Real product metrics (out of scope — this is the simulated host app) |
| `store.ts` (localStorage `retention-engine-ui-v3`) | `teamDiscountActivated`, `ignoreMode`, `currentUserId` | `user_entitlements` + `experiment_config`; `currentUserId` replaced by `auth.uid()` |
| `LandingPage.tsx` | Static marketing copy | OK to remain static |

---

## Section 3: Schema Design

### Existing tables (from M4)

**`sim_users`** *(existing — will be deprecated in favor of `profiles` once auth lands)*
- `id text PK`, `name text`, `company text`, `role text`
- `day_in_journey int`, `seats_active int`
- `activated bool`, `surveyed bool`, `churned bool`
- `created_at timestamptz`, `updated_at timestamptz`

**`survey_responses`** *(existing)*
- `id uuid PK`, `user_id text` → will become `uuid` referencing `profiles.id`
- `cohort enum('day14','day45')`, `friction enum('usability','value','admin')`
- `q1 text`, `q2 text`, `q3 text`, `free_text text`
- `intervention enum`, `intervention_accepted bool`
- `created_at timestamptz`

**`invites`** *(existing)*
- `id uuid PK`, `inviter_user_id text`, `email text`, `status enum('pending','accepted')`, `created_at timestamptz`

**`academy_progress`** *(existing)*
- `id uuid PK`, `user_id text`, `step_id text`, `done bool`, `updated_at timestamptz`

### New tables (to add)

**`profiles`** *(NEW — required for real auth)*
- `id uuid PK` references `auth.users(id) ON DELETE CASCADE`
- `display_name text`, `company text`, `product_role text` (Ops Lead / VP / etc.)
- `day_in_journey int default 0`, `seats_active int default 1`
- `activated bool default false`, `churned bool default false`
- `created_at timestamptz`, `updated_at timestamptz`

**`user_roles`** *(NEW — separate from profiles for security)*
- `id uuid PK`, `user_id uuid` references `auth.users(id)`
- `role app_role enum('end_user','admin')`
- `UNIQUE(user_id, role)`

**`survey_questions`** *(NEW)*
- `id uuid PK`, `cohort enum`, `order int`, `prompt text`
- `options jsonb` (array of `{id, label, friction}`), `active bool`

**`intervention_rules`** *(NEW)*
- `id uuid PK`, `cohort enum`, `friction enum`
- `action enum` (book_cs_call, unlock_team_discount, send_tutorial, send_roi_report)
- `label text`, `active bool`
- `UNIQUE(cohort, friction)`

**`cohort_config`** *(NEW)*
- `id uuid PK`, `name text` (day14/day45), `min_day int`, `max_day int`, `active bool`

**`org_baselines`** *(NEW)*
- `id uuid PK`, `org_id uuid` (future), `ninety_day_churn numeric`, `activation_rate numeric`
- `seats_per_account numeric`, `time_to_first_value_days numeric`, `updated_at timestamptz`

**`experiment_config`** *(NEW)*
- `id uuid PK`, `key text UNIQUE`, `value jsonb`, `updated_at timestamptz`
- (kill_switch_threshold, engagement_target, analyze_latency_ms, ignore_mode)

**`academy_steps`** *(NEW)*
- `id uuid PK`, `step_id text UNIQUE`, `label text`, `sub text`, `order int`, `is_failing bool`

**`modal_events`** *(NEW)*
- `id uuid PK`, `user_id uuid`, `event_type enum('impression','dismissal','submit')`, `cohort enum`, `created_at timestamptz`

**`user_entitlements`** *(NEW)*
- `id uuid PK`, `user_id uuid` references `auth.users(id)`
- `team_discount_activated bool`, `discount_activated_at timestamptz`

---

## Section 4: Auth Model & Permissions

### Roles

| Role | Description |
|---|---|
| `end_user` | A SaaS customer being studied — sees their own dashboard, academy, team page, and the check-in modal. |
| `admin` | Internal PM/Growth operator — sees `/admin` analytics, response stream, simulator, ignore-mode toggle, reset. |

Stored in `user_roles` (NEVER on `profiles`) to prevent privilege escalation. Checked via `has_role(auth.uid(), 'admin')` security-definer function.

### What each role can see/do

| Capability | `end_user` | `admin` |
|---|:---:|:---:|
| View own `/dashboard`, `/dashboard/academy`, `/dashboard/team` | ✅ | ✅ |
| See Check-In modal | ✅ | ❌ |
| Submit own `survey_responses` | ✅ | ❌ |
| Accept/decline intervention on own response | ✅ | ❌ |
| Send/remove own `invites` | ✅ | ❌ |
| Update own `academy_progress` | ✅ | ❌ |
| View `/admin` (all responses, metrics, simulator) | ❌ | ✅ |
| Toggle `ignore_mode` | ❌ | ✅ |
| Reset experiment | ❌ | ✅ |
| Edit `survey_questions` / `intervention_rules` / `cohort_config` | ❌ | ✅ |

### RLS policy summary

| Table | Policy |
|---|---|
| `profiles` | SELECT/UPDATE where `id = auth.uid()`; admins SELECT all |
| `user_roles` | SELECT where `user_id = auth.uid()`; admins manage all |
| `survey_responses` | INSERT/SELECT/UPDATE where `user_id = auth.uid()`; admins SELECT all |
| `invites` | SELECT/INSERT/DELETE where `inviter_user_id = auth.uid()` OR `email = auth.jwt()->>'email'` |
| `academy_progress` | ALL where `user_id = auth.uid()` |
| `modal_events` | INSERT where `user_id = auth.uid()`; admins SELECT all |
| `user_entitlements` | SELECT where `user_id = auth.uid()`; admins manage all |
| `survey_questions`, `intervention_rules`, `cohort_config`, `academy_steps`, `org_baselines`, `experiment_config` | SELECT to `authenticated`; UPDATE/INSERT/DELETE only to `admin` |

---

## Section 5: Prompts

### Prompt 1 — Schema Expansion

```
Extend the Lovable Cloud schema to remove the hardcoded values in this prototype. Create the following new tables with appropriate GRANTs, RLS, and policies:

1. survey_questions (cohort, order, prompt, options jsonb, active) — seed it from src/features/check-in/questions.ts (Q1_OPTIONS and Q2_BY_FRICTION).
2. intervention_rules (cohort, friction, action, label, active) — seed from src/features/retention/intervention.ts (interventionFor + interventionLabel).
3. cohort_config (name, min_day, max_day, active) — seed day14 (13–16) and day45 (44–47) from src/features/retention/metrics.ts::cohortFor.
4. org_baselines (ninety_day_churn, activation_rate, seats_per_account, time_to_first_value_days) — seed from BASELINE constant in metrics.ts.
5. experiment_config (key, value jsonb) — seed kill_switch_threshold=0.10, engagement_target=0.25, analyze_latency_ms=800, ignore_mode=false.
6. academy_steps (step_id, label, sub, order, is_failing) — seed from src/features/academy/steps.ts.
7. modal_events (user_id, event_type, cohort) — replace modalImpressions/modalDismissals counters in store.ts.
8. user_entitlements (user_id, team_discount_activated, discount_activated_at) — replace teamDiscountActivated in store.ts.

Then update src/features/retention/supabase-sync.ts to fetch all of the above and update store.ts so questions, intervention rules, cohort windows, baselines, academy steps, and entitlements all come from the database. Update CheckInWidget.tsx, PostSubmissionIntervention.tsx, AdminAnalyticsPage.tsx, FastTrackAcademyPage.tsx, and metrics.ts::deriveAnalytics to read from the live store instead of imported constants. Keep the friction taxonomy enum and pure classifier logic hardcoded.
```

### Prompt 2 — Auth UI + Row-Level Security

```
Add authentication and role-based access to this prototype.

1. Create a profiles table (id references auth.users, display_name, company, product_role, day_in_journey, seats_active, activated, churned) with an auto-create trigger on signup.
2. Create a user_roles table with an app_role enum ('end_user','admin') stored SEPARATELY from profiles, plus a has_role(_user_id, _role) SECURITY DEFINER function.
3. Add a public /auth route with email/password + Google sign-in (use the Lovable broker for Google and call supabase--configure_social_auth). New signups default to 'end_user'.
4. Move /dashboard, /dashboard/academy, /dashboard/team under src/routes/_authenticated/ (the integration-managed gate). Move /admin under _authenticated/_admin with a beforeLoad that checks has_role('admin') and redirects non-admins to /dashboard.
5. Replace the currentUserId dropdown / localStorage value in store.ts with auth.uid() from the active Supabase session.
6. Tighten RLS on sim_users (or migrate to profiles), survey_responses, invites, academy_progress, modal_events, and user_entitlements so end_users only see their own rows and admins see all. Update all GRANTs.
7. Add a header on every authenticated route showing the logged-in user's display_name + company, and a Logout button that calls supabase.auth.signOut(), clears the query cache, and navigates to /auth.
8. Verify: an end_user account cannot reach /admin or read another user's survey_responses; an admin account sees the full response stream.
```

### Prompt 3 — Edge Cases

```
Add resilient failure handling across the entire app.

1. Database connection failure: in src/features/retention/store.ts::ensureHydrated, surface fetch errors instead of swallowing them. Render an ErrorBoundary on /dashboard and /admin with a clear "Couldn't load your data" message and a Retry button that re-runs ensureHydrated().
2. Empty data states: when survey_responses is empty, ResponseStream.tsx and Charts.tsx should show a helpful empty-state card ("No check-ins yet — run a simulated session to populate") with a CTA button instead of a 0% chart. Same for invites in TeamWorkspacePage and academy_progress in FastTrackAcademyPage.
3. Form submission failure: in CheckInWidget.tsx and the team invite form, wrap the sync.insertResponse / sync.insertInvite calls in try/catch, show an inline toast error, and preserve the user's typed input + selected options on failure. Stop silently fire-and-forgetting.
4. Loading states: replace the empty-array first paint in store.ts with an isHydrating flag. Render skeleton screens (Skeleton component) on WorkspacePage, AdminAnalyticsPage, FastTrackAcademyPage, and TeamWorkspacePage while hydrating.
5. Session expiry: subscribe to supabase.auth.onAuthStateChange in __root.tsx; on SIGNED_OUT or token refresh failure, clear the query cache and redirect to /auth with a toast "Your session expired, please sign in again."

Add a global error toast (sonner) whenever any sync.* writer in supabase-sync.ts returns an error, so silent write failures during demos are no longer possible.
```

---

## Section 6: Edge Case Checklist

- [ ] **DB connection failure** — `ensureHydrated()` rejection shows retry UI, not blank screen.
- [ ] **Empty response stream** — `/admin` shows empty-state CTA instead of 0% metrics.
- [ ] **Form submission failure** — Check-in submit and invite send preserve input on error.
- [ ] **Loading state** — Skeleton on every route that calls Supabase.
- [ ] **Session expiry** — Redirect to `/auth` with toast on `SIGNED_OUT`.
- [ ] **Silent write failure** — Every `sync.*` error surfaces a toast (no more fire-and-forget).
- [ ] **Wrong cohort day** — Day outside 13–16 / 44–47 must not trigger CheckInWidget.
- [ ] **Double-submit survey** — `surveyed: true` flag must hide the modal for the rest of that cohort window.
- [ ] **Duplicate invite email** — Re-inviting same email shows "already invited" instead of inserting a duplicate row.
- [ ] **Admin viewing as end_user** — `/admin` redirects non-admin roles to `/dashboard`.
- [ ] **Kill switch false positive** — Don't compute engagement until ≥20 impressions and hydration is complete.
- [ ] **Ignore mode persistence** — When toggled, value persists across reload (move to `experiment_config`).
- [ ] **Academy step race** — Tapping a step before hydration completes must not lose progress.
- [ ] **Reset mid-flight** — `actions.reset()` should disable UI until delete+reseed completes.
- [ ] **Cross-device drift** — `modalImpressions` must come from DB, not localStorage, so different browsers stay in sync.
- [ ] **Cold-start race in `seedIfEmpty`** — Use a unique constraint or advisory lock to prevent duplicate seed personas.

---

## Section 7: Stress Test Plan

### Test 1 — "Pull the Plug" (Connection Failure)
**Steps:**
1. Sign in, open `/dashboard`.
2. Open DevTools → Network → set throttling to **Offline**.
3. Trigger the Check-In modal (set day to 14), fill in all 3 questions, click Submit.
4. Accept the intervention.
5. Navigate to `/admin`.

**Expected:**
- Submit shows inline error toast, form input preserved.
- No silent data loss — response is queued or user is told to retry.
- `/admin` shows "Couldn't load data" with Retry button, not a blank page or fake 0% metrics.
- Bringing network back + clicking Retry restores full state.

### Test 2 — "Fresh Account" (Empty State)
**Steps:**
1. Sign up brand new email at `/auth`.
2. Land on `/dashboard` — no academy progress, no invites, no survey history.
3. Visit `/dashboard/academy`, `/dashboard/team`, and (if admin) `/admin`.

**Expected:**
- Each screen shows an empty-state card with a clear next action ("Connect your warehouse", "Invite your first teammate", "No check-ins yet").
- No nulls / "undefined" / `NaN%` rendered.
- Check-in modal does NOT fire on Day 0 (outside cohort window).
- Header shows the new user's display_name and company.

### Test 3 — "Spam the Simulator" (Rapid Repeated Actions)
**Steps:**
1. Sign in as admin, open `/admin`.
2. Click "Simulate 10 sessions" 20 times in 5 seconds.
3. Toggle Ignore Mode on/off 10 times rapidly.
4. Click the "Reset experiment" button twice in quick succession.
5. As an end_user in another tab: spam-click Submit on the Check-In modal.

**Expected:**
- All simulator clicks land as separate rows in `survey_responses` (no duplicates with same `id`).
- Ignore-mode value matches whatever the user clicked last; no flickering kill-switch.
- Reset disables its own button until the delete+reseed transaction completes; double-click does not duplicate seed personas.
- Check-in Submit disables after first click; only one row per cohort per user.
- Page stays responsive throughout (no frozen UI).

---

## Section 8: Handoff Note

### What's Real vs. What's Mocked

| Feature | Real | Mocked |
|---|:---:|:---:|
| `sim_users` / `survey_responses` / `invites` / `academy_progress` CRUD | ✅ | |
| Supabase hydration on load | ✅ | |
| Friction classifier (`classifyFreeText`) | ✅ (regex stand-in for LLM) | |
| Cohort detection (`cohortFor`) | ✅ | |
| Intervention assignment (`interventionFor`) | | ✅ hardcoded mapping |
| Survey questions | | ✅ hardcoded in `questions.ts` |
| Academy steps | | ✅ hardcoded in `steps.ts` |
| Baseline retention curve | | ✅ constants in `metrics.ts` |
| Authentication / roles | | ✅ no auth — `currentUserId` is a dropdown |
| RLS | | ✅ open `USING true` policies |
| `modalImpressions` / `modalDismissals` | | ✅ localStorage |
| `teamDiscountActivated` / `ignoreMode` | | ✅ localStorage |
| Workspace widget data | | ✅ static UI |
| Landing page copy | | ✅ static |

### Database Schema Summary

- **`sim_users`** — simulated personas (id, name, company, role, day_in_journey, seats_active, activated, surveyed, churned).
- **`survey_responses`** — every check-in submission (user_id, cohort, friction, q1/q2/q3, free_text, intervention, intervention_accepted).
- **`invites`** — teammate invites (inviter_user_id, email, status).
- **`academy_progress`** — per-user onboarding checklist (user_id, step_id, done).

### Auth & RLS Model

- **Today:** No auth. RLS policies are `USING true` for anon + authenticated — anyone reaching the project can read/write any row.
- **Target:** `end_user` vs. `admin` roles in a separate `user_roles` table, `has_role()` security-definer, per-user scoping on response/invite/academy/modal tables, admin-only `/admin` route.

### Edge Cases Handled

_To be filled after the lab._

### Known Gaps

_To be filled after stress testing._

### Live URL

_To be filled after deployment._
