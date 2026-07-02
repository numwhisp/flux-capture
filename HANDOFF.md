# Engineering Handoff — The Retention Engine

A validation prototype testing whether a 3-question contextual check-in at
Day 14 / Day 45 inside a B2B SaaS dashboard can cut 90-day churn by 15%.
React + TanStack Start on the client, Lovable Cloud (Supabase) for
persistence, auth, and RBAC. UI-only state still lives in `localStorage`;
all domain data (users, responses, invites, academy progress, survey
config, intervention rules, baselines) reads/writes through
`src/features/retention/supabase-sync.ts`.

---

## Start Here (read in this order)

1. **`README.md`** — hypothesis, pass/kill thresholds, scenario, screen
   list. Read first to understand *why* this exists.
2. **`PRD.md`** — product spec, user flows, what's mocked vs real.
3. **`src/features/retention/`** — the entire data layer. If you understand
   this folder you understand the app. Start at `types.ts` → `seed.ts` →
   `store.ts` → `classifier.ts` → `intervention.ts` → `metrics.ts`.
4. **`src/routes/`** — every route is a ~12-line wrapper that delegates to
   a feature page. Use this as the site map.
5. **`src/features/<screen>/`** — one folder per screen. UI only. They
   import from `@/features/retention` and never touch storage directly.

### Where data lives vs. where UI lives

| Concern | Lives in | Notes |
| --- | --- | --- |
| Types & schema | `src/features/retention/types.ts` | Single source of truth for `SurveyResponse`, `SimUser`, `RetentionState`. |
| Seed data | `src/features/retention/seed.ts` | Verbatim discovery quotes + initial users. |
| State store | `src/features/retention/store.ts` | `useSyncExternalStore` + `localStorage` persistence. All mutations go through `actions`. |
| Business logic | `src/features/retention/classifier.ts`, `intervention.ts` | Pure functions, no React. |
| Derived analytics | `src/features/retention/metrics.ts` | `deriveAnalytics`, `cohortFor`, `sparkFor`. Pure. |
| Routing | `src/routes/*.tsx` | Thin file-based wrappers. No logic. |
| Screen UI | `src/features/<feature>/*.tsx` | Reads via `useRetentionStore`, writes via `actions`. **Never** touches `localStorage` or seed data directly. |
| Design primitives | `src/components/ui/*` | shadcn — do not modify. |
| Tokens | `src/styles.css` | All colors/gradients. No hardcoded color utilities in components. |

If you need to change behavior, edit `features/retention/`. If you need to
change how something looks, edit the matching `features/<screen>/` folder.

---

## Project structure

```
src/
├── routes/                      # TanStack file-based routes (thin wrappers)
│   ├── __root.tsx               # html/head shell + <Outlet />
│   ├── index.tsx                → LandingPage
│   ├── dashboard.tsx            # layout: <Outlet />
│   ├── dashboard.index.tsx      → WorkspacePage
│   ├── dashboard.academy.tsx    → FastTrackAcademyPage
│   ├── dashboard.team.tsx       → TeamWorkspacePage
│   └── admin.tsx                → AdminAnalyticsPage
│
├── features/
│   ├── retention/               # 🧠 DATA LAYER — single source of truth
│   ├── landing/                 # Screen 1
│   ├── workspace/               # Screen 2 (simulated SaaS dashboard)
│   ├── check-in/                # Screens 3 + 4 (widget + intervention)
│   ├── academy/                 # Screen 5
│   ├── team/                    # Screen 6
│   └── admin/                   # PM analytics view
│
├── components/ui/               # shadcn primitives
├── lib/                         # error reporting, cn() helper
└── styles.css                   # design tokens
```

---

## Component inventory

### Routes (`src/routes/`)

| File | URL | Renders |
| --- | --- | --- |
| `__root.tsx` | — | App shell, head metadata, global `<Outlet />`. |
| `index.tsx` | `/` | `LandingPage` |
| `dashboard.tsx` | `/dashboard` | Layout — `<Outlet />` only. |
| `dashboard.index.tsx` | `/dashboard` | `WorkspacePage` |
| `dashboard.academy.tsx` | `/dashboard/academy` | `FastTrackAcademyPage` |
| `dashboard.team.tsx` | `/dashboard/team` | `TeamWorkspacePage` |
| `admin.tsx` | `/admin` | `AdminAnalyticsPage` |

### Landing (`src/features/landing/`)

| Component | Purpose |
| --- | --- |
| `LandingPage` | Marketing/spec entry. Shows hypothesis, baseline churn metrics, links to user view and admin view. |

### Workspace (`src/features/workspace/`)

| Component | Purpose |
| --- | --- |
| `WorkspacePage` | Simulated SaaS workspace shell. Hosts sim controls + auto-opens `CheckInWidget` when current user enters Day 13–16 or Day 44–47. |
| `WorkspaceWidgets.tsx` → `SimControls` | Persona switcher + day slider for jumping to Day 7 / 14 / 30 / 45 / 60. |
| `WorkspaceWidgets.tsx` → `StatCard`, `SparkBars` | Decorative dashboard tiles (mocked metrics). |

### Check-in (`src/features/check-in/`)

| Component | Purpose |
| --- | --- |
| `CheckInWidget` | Slide-out widget (bottom-right). Owns the 3-question flow, fires `actions.recordImpression()`, runs `classifyFreeText`, calls `actions.submitResponse`. |
| `PostSubmissionIntervention` | Branch router post-submit. 800ms generation skeleton, then mounts one of the three stages. |
| `stages/UsabilityStage` | Offers Day-14 CS call or Day-45 fast-track tutorial. Navigates to `/dashboard/academy`. |
| `stages/AdminStage` | Unlocks 20% team-seat discount. Calls `actions.acceptTeamDiscount()`, navigates to `/dashboard/team`. |
| `stages/ValueStage` | Generates in-widget ROI snapshot. |
| `questions.ts` | `Q1_OPTIONS`, `Q2_BY_FRICTION`, `ANALYZE_LATENCY_MS = 800`. |

### Academy (`src/features/academy/`)

| Component | Purpose |
| --- | --- |
| `FastTrackAcademyPage` | 4-min tutorial checklist. Reads/writes `academyProgress` in the store. Also exports `FastTrackAcademyError`. |
| `AcademyStepRow` | Single tutorial step row with checkbox. |
| `steps.ts` | `ACADEMY_STEPS` data. |

### Team (`src/features/team/`)

| Component | Purpose |
| --- | --- |
| `TeamWorkspacePage` | Invite teammates (writes to `invites[]`), shows discount banner if `teamDiscountActivated`. |

### Admin (`src/features/admin/`)

| Component | Purpose |
| --- | --- |
| `AdminAnalyticsPage` | PM dashboard. Memoizes `deriveAnalytics(state)` and feeds it to child cards. |
| `components/MetricCards` → `KpiCard`, `BaselineCell`, `FrictionBucketCard`, `FrictionPill` | KPI tiles vs. pass/kill thresholds; friction breakdown. |
| `components/Charts` → `Sparkline`, `RetentionChart`, `LegendDot` | 12-point sparklines + simulated 90-day retention curve (baseline vs treatment). |
| `components/ResponseStream` | Live feed of `SurveyResponse[]`. Suppressed when Ignore Mode is on. |
| `components/UserSimulator` | +10 / +25 / +100 session buttons + Ignore Mode toggle. Calls `actions.simulateSessions(n)`. |

---

## Data model

All types in `src/features/retention/types.ts`.

```ts
type FrictionType = "usability" | "value" | "admin";
type Cohort = "day14" | "day45";
type InterventionAction =
  | "book_cs_call"
  | "unlock_team_discount"
  | "send_tutorial"
  | "send_roi_report"
  | "no_action";

interface SurveyResponse {
  id: string;            // crypto.randomUUID()
  userId: string;
  cohort: Cohort;
  friction: FrictionType;
  q1: string;            // selected option label
  q2: string;            // sub-topic label
  q3: string;            // NPS-style answer
  freeText: string;      // free-text (fed to classifier)
  intervention: InterventionAction;
  interventionAccepted: boolean | null;
  createdAt: number;     // Date.now()
}

interface SimUser {
  id, name, company, role: string;
  dayInJourney: number;  // drives cohort trigger window
  seatsActive: number;
  activated, surveyed, churned: boolean;
}

interface RetentionState {
  users: SimUser[];
  responses: SurveyResponse[];
  currentUserId: string;
  modalImpressions: number;
  modalDismissals: number;
  ignoreMode: boolean;            // kill-switch stress test
  invites: { email; status: "pending" | "accepted" }[];
  teamDiscountActivated: boolean;
  academyProgress: Record<string, boolean>;
}
```

Persisted to `localStorage` under key `retention-engine-state-v2`.

### Store API (`src/features/retention/store.ts`)

- `useRetentionStore(selector)` — React subscription hook.
- `actions.*` — only legal way to mutate. Notable actions:
  - `setCurrentUser(id)`, `setDay(id, day)`
  - `recordImpression()`, `recordDismissal()`
  - `submitResponse(r)` → returns hydrated `SurveyResponse`
  - `acceptIntervention(id, accepted)`
  - `simulateSessions(n)` — bulk-generate responses; under Ignore Mode it only inflates impressions+dismissals to crash engagement %.
  - `setIgnoreMode(v)`, `acceptTeamDiscount()`, `inviteTeammate(email)`, `setAcademyStep(id, done)`, `resetAcademy()`, `reset()`.

### Pure logic

- `classifier.ts` → `classifyFreeText(text): FrictionType` — keyword regex. Overrides Q1 when it disagrees with the free-text.
- `intervention.ts` → `interventionFor(friction, cohort)`, `interventionLabel`, `frictionLabel`.
- `metrics.ts` → `deriveAnalytics(state)`, `cohortFor(day)`, `sparkFor(friction, count)`, `formatClock(ts)`. Constants: `BASELINE`, `KILL_SWITCH_THRESHOLD = 0.10`, `ENGAGEMENT_TARGET = 0.25`.

---

## Mocked vs. real

| Area | Status | Notes |
| --- | --- | --- |
| Friction classification | **Mock** | Deterministic keyword regex in `classifier.ts`. Chosen over an LLM call for instant, free, reproducible demos. Swap point: replace `classifyFreeText` body with a Lovable AI Gateway call. |
| State persistence | **Mock-ish** | Real client persistence via `localStorage`. No server, no multi-device sync, no auth. |
| Survey responses | **Real** in-session | Every submit writes a real `SurveyResponse` to the store and streams to admin view. |
| Simulated sessions | **Real** behavior on **mock** data | `actions.simulateSessions(n)` generates synthetic responses with `Math.random()` acceptance ~65%. |
| KPI tiles, friction breakdown | **Real** | Computed from live store via `deriveAnalytics`. |
| 90-day retention curve | **Mock formula** | `lift = min(15, acceptedCount * 0.4)`. Not derived from real time-series data — there is none. |
| Sparklines | **Mock** | Deterministic sine/cosine seeded by friction type + live count (`sparkFor`). |
| Ignore Mode / kill switch | **Real** | Real state flag; engagement clamps below threshold; admin view + simulator react correctly. |
| Team-seat discount, invites, academy progress | **Real** in-session | Persisted to `localStorage`; no email/payment integration. |
| Cohort trigger | **Real** | `cohortFor(day)` returns `day14` for Day 13–16, `day45` for Day 44–47. The widget auto-opens after a 600ms delay when in window. |
| Backend / auth / DB | **Not present** | Lovable Cloud is intentionally not enabled. No `src/integrations/`, no server functions, no `/api` routes. |
| Analytics / telemetry | **Not present** | All counters live only in the local store. |

---

## Where to start as an engineer

- **"Wire up the real classifier"** → replace the body of `classifyFreeText` in `src/features/retention/classifier.ts` with a server function that hits the Lovable AI Gateway. Keep the signature `(text: string) => FrictionType` so `CheckInWidget` doesn't change.
- **"Make it multi-user / persist server-side"** → enable Lovable Cloud, create `survey_responses`, `sim_users`, `invites`, `academy_progress` tables, replace `store.ts` internals with a TanStack Query layer fronting server functions. The component layer should be unchanged because it only ever calls `useRetentionStore` and `actions`.
- **"Real retention math"** → `metrics.ts::deriveAnalytics`. The baseline/treatment curve is currently a closed-form mock; swap for a real cohort SQL query.
- **"Change a screen's look"** → edit the matching `src/features/<feature>/` folder + tokens in `src/styles.css`. Do not touch `retention/`.
- **"Add a new screen"** → add `src/routes/<name>.tsx` (thin wrapper) + `src/features/<name>/<Name>Page.tsx`.

---

## Local dev

```bash
bun install
bun dev
```

Open `/dashboard` for the user view, `/admin` for the PM view. Use the
sim controls to jump to Day 14 or Day 45 to trigger the check-in widget.
To reset state: `localStorage.removeItem("retention-engine-state-v2")` or
call `actions.reset()` from devtools.

---

## Known Gaps

Documented issues surfaced during resilience testing. Each item lists the
observed behavior, current mitigation in the prototype, and what a
production build should do instead.

### 1. Salesforce integration is intentionally flaky
- **What fails:** the Salesforce connector in `FastTrackAcademyPage` is
  hardcoded to fail (`FastTrackAcademyError`) to exercise the error state.
- **Current behavior:** step is labeled `flaky · optional`; on failure a
  crimson inline alert renders a **Skip for now** button that marks the
  step complete. Academy completion gates on required steps only
  (`X / Y required`) so users can finish without ever connecting.
- **Production fix:** replace the simulated failure with a real OAuth
  handshake + retry/backoff, and drop `optional` once the integration is
  reliable. Move the failure toggle behind an experiment flag in
  `experiment_config`.

### 2. Friction classifier is a keyword regex, not an LLM
- **What fails:** `classifyFreeText` misclassifies nuanced free-text (e.g.
  sarcasm, mixed friction signals) and can silently override a correct
  Q1 selection.
- **Current behavior:** deterministic regex in
  `src/features/retention/classifier.ts`; fast and free, but shallow.
- **Production fix:** call the Lovable AI Gateway from a server function
  and keep the `(text) => FrictionType` signature so no UI changes.

### 3. 90-day retention curve is a closed-form mock
- **What fails:** the treatment curve in `metrics.ts` uses
  `lift = min(15, acceptedCount * 0.4)` — it responds to accepted
  interventions but is not derived from real cohort data.
- **Current behavior:** labeled as "simulated" in the admin view.
- **Production fix:** replace with a real cohort SQL query once we have
  ≥ 60 days of `survey_responses` + activity data.

### 4. Email auto-confirm is enabled
- **What fails:** new signups are auto-confirmed to avoid blocking demo
  flows on inbox delivery. This is unsafe for production.
- **Current behavior:** `auto_confirm_email: true` in the Cloud auth
  config; anyone with an email string can sign in immediately.
- **Production fix:** disable auto-confirm, wire a real transactional
  email sender, and gate protected routes on `email_confirmed_at`.

### 5. `sim_users` is mirrored from `profiles` via trigger
- **What fails:** `survey_responses.user_id` has a FK to `sim_users`, but
  authenticated users only get a `profiles` row on signup. Early builds
  hit a FK violation on the first check-in submit.
- **Current behavior:** `mirror_profile_to_sim_users` trigger inserts a
  matching `sim_users` row on profile create/update; existing profiles
  were backfilled.
- **Production fix:** collapse `profiles` and `sim_users` into one table
  (or make `sim_users` a view over profiles) so the trigger goes away.

### 6. Spam-click protection is client-side only
- **What fails:** rapid submits on the check-in widget could theoretically
  race React state and insert duplicates.
- **Current behavior:** synchronous `submittingRef` guard in
  `CheckInWidget` short-circuits clicks 2–N in the same tick;
  `disabled={analyzing}` handles subsequent renders.
- **Production fix:** add a DB-level idempotency key
  (`unique(user_id, cohort, created_at::date)`) so a compromised or
  scripted client cannot bypass the guard.

### 7. Offline handling is display-only
- **What fails:** writes made while offline are lost — we surface the
  offline banner but do not queue mutations.
- **Current behavior:** `OfflineBanner` in `__root.tsx` pins to the top
  on `navigator.onLine === false` with a probe-based retry.
- **Production fix:** wrap `supabase-sync` writers in an outbox
  (IndexedDB) that flushes on reconnect, or migrate to TanStack Query
  mutations with `networkMode: "offlineFirst"` and retry.

### 8. Hardcoded config still shadows the DB in a few places
- **What fails:** `questions.ts`, `steps.ts`, and the `BASELINE`
  constants in `metrics.ts` still exist as fallbacks, so PM edits to
  `survey_questions` / `academy_steps` / `org_baselines` won't take
  effect if the sync fetch fails.
- **Current behavior:** the store prefers DB rows and falls back to the
  hardcoded arrays on hydration error.
- **Production fix:** remove the fallbacks once hydration is reliable
  and surface a hard error instead of silently reverting to seed data.

### 9. No server-side rate limiting on writes
- **What fails:** RLS lets any authenticated user insert unlimited
  `survey_responses` / `invites` / `modal_events` rows.
- **Current behavior:** relies on UI throttling only.
- **Production fix:** add a Postgres function + per-user rate table, or
  put writes behind an edge function that enforces a token bucket.