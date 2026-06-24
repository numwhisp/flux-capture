# Engineering Handoff — The Retention Engine

A validation prototype testing whether a 3-question contextual check-in at
Day 14 / Day 45 inside a B2B SaaS dashboard can cut 90-day churn by 15%.
No backend. Client-only React + TanStack Start. All state in
`localStorage`.

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