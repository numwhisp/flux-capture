# The Retention Engine

A validation prototype that tests whether a hyper-targeted, 3-question
contextual check-in at **Day 14** and **Day 45** inside a B2B SaaS dashboard
can cut 90-day churn by 15%.

## Hypothesis

> Implementing a 3-question contextual check-in directly inside the app
> dashboard at Day 14 and Day 45 — triggering tailored micro-interventions
> (instant CS call, team-seat discount, fast-track tutorial, ROI snapshot)
> based on the user's friction type — will produce an immediate 15%
> reduction in 90-day churn.

**Pass / kill thresholds**

| Metric | Pass | Kill |
| --- | --- | --- |
| Check-in engagement rate | ≥ 25% | < 10% |
| Intervention acceptance | ≥ 40% | < 15% |
| Projected 90-day churn lift | ≥ 15% | ≤ 5% |

## Scenario

The target SaaS is bleeding accounts inside the first quarter:

- **30%** 90-day churn
- **22%** activation rate
- **1.4** active seats per account
- **6.2 days** time-to-first-value

Two verbatim quotes from discovery anchor the problem:

- *Ops Lead, churned Day 12* — "Honestly, I didn't know what it did for me day-to-day."
- *VP of Product, Day 45* — "I sat in my QBR and couldn't point to a single number that changed because of this tool."

## Key screens

- **`/` Landing** — Hypothesis, baseline metrics, entry points to both views.
- **`/dashboard` User view** — Simulated SaaS workspace with a sim-control bar to switch users and jump to Day 7/14/30/45/60. Entering a trigger window (Day 13–16 or 44–47) slides out the check-in widget from the bottom-right corner.
- **`/admin` PM analytics view** — Live KPI tiles vs. pass/kill thresholds, friction-type breakdown (Usability / Value / Admin), intervention conversion, raw feedback feed, simulated 90-day retention curve, and a user simulator (10 / 25 / 100 sessions) with an **Ignore Mode** toggle to stress-test the kill switch.

## User flow

1. User lands on `/`, opens **User view**.
2. Sim controls select a persona and trial day. At Day 14 / Day 45 the check-in widget auto-opens after a short delay.
3. User answers three questions; free-text is classified into Usability, Value, or Admin friction in real time.
4. The widget offers the matched micro-intervention (book a CS call, unlock team discount, open fast-track tutorial, or generate an ROI snapshot). User accepts or dismisses.
5. PM switches to **Analytics view** to see the response land, friction tags update, intervention acceptance shift, and the simulated retention curve respond.

## Build decisions

- **TanStack Start + Vite + React 19** per the project template; file-based routes under `src/routes/`.
- **Client-only state** in `src/features/retention/store.ts` using a tiny `useSyncExternalStore` store persisted to `localStorage`. No backend — this is a feasibility prototype, not production. Lovable Cloud was intentionally not enabled.
- **Deterministic friction classifier** (`classifyFreeText` in `src/features/retention/classifier.ts`) uses keyword regex instead of an LLM call so tagging is instant, free, and reproducible during demos.
- **Seeded with real quotes and baseline metrics** so the admin view never shows empty/filler data on first load.
- **Slide-out widget, not a modal** (`src/features/check-in/CheckInWidget.tsx`) to match a premium B2B SaaS aesthetic (PostHog / Mixpanel-style) and avoid intrusive center-screen pop-ups.
- **Dark-mode-first design system** in `src/styles.css`: slate surfaces, emerald for pass thresholds, amber/crimson for churn alerts. No hardcoded color utilities in components — all tokens.
- **Stress-test affordances** built into `/admin`: session simulator and Ignore Mode so the kill switch can be triggered on demand.

## Project structure

The codebase is grouped **by feature**, not by file type. Each feature owns its
screens, sub-components, and any feature-local data. The shared data layer
lives once under `src/features/retention/` and is consumed by every feature.

```
src/
├── routes/                            # TanStack file-based routes — thin wrappers only
│   ├── __root.tsx                     # root layout + head metadata
│   ├── index.tsx                      → LandingPage
│   ├── dashboard.tsx                  # /dashboard layout (renders <Outlet />)
│   ├── dashboard.index.tsx            → WorkspacePage
│   ├── dashboard.academy.tsx          → FastTrackAcademyPage
│   ├── dashboard.team.tsx             → TeamWorkspacePage
│   └── admin.tsx                      → AdminAnalyticsPage
│
├── features/
│   ├── retention/                     # 🧠 data layer — single source of truth
│   │   ├── types.ts                   # FrictionType, Cohort, SurveyResponse, SimUser…
│   │   ├── seed.ts                    # seed users + verbatim quote responses + initialState
│   │   ├── classifier.ts              # classifyFreeText() — deterministic regex
│   │   ├── intervention.ts            # interventionFor / interventionLabel / frictionLabel
│   │   ├── store.ts                   # useSyncExternalStore + actions, localStorage persistence
│   │   ├── metrics.ts                 # deriveAnalytics, cohortFor, sparkFor, formatClock
│   │   └── index.ts                   # barrel export
│   │
│   ├── landing/
│   │   └── LandingPage.tsx            # Screen 1
│   │
│   ├── workspace/                     # Screen 2 — simulated SaaS dashboard
│   │   ├── WorkspacePage.tsx
│   │   └── WorkspaceWidgets.tsx       # SimControls, StatCard, SparkBars
│   │
│   ├── check-in/                      # Screens 3 + 4 — widget and intervention
│   │   ├── CheckInWidget.tsx          # Screen 3: 3-question slide-out
│   │   ├── PostSubmissionIntervention.tsx  # Screen 4: branched CTA
│   │   ├── questions.ts               # Q1_OPTIONS, Q2_BY_FRICTION, ANALYZE_LATENCY_MS
│   │   └── stages/                    # one file per friction branch
│   │       ├── UsabilityStage.tsx
│   │       ├── AdminStage.tsx
│   │       └── ValueStage.tsx
│   │
│   ├── academy/                       # Screen 5 — Fast-Track Interactive Academy
│   │   ├── FastTrackAcademyPage.tsx   # also exports FastTrackAcademyError
│   │   ├── AcademyStepRow.tsx
│   │   └── steps.ts                   # ACADEMY_STEPS data
│   │
│   ├── team/                          # Screen 6 — Team Workspace
│   │   └── TeamWorkspacePage.tsx
│   │
│   └── admin/                         # PM analytics view (not a user screen)
│       ├── AdminAnalyticsPage.tsx
│       └── components/
│           ├── Charts.tsx             # Sparkline, RetentionChart, LegendDot
│           ├── MetricCards.tsx        # KpiCard, BaselineCell, FrictionBucketCard, FrictionPill
│           ├── UserSimulator.tsx
│           └── ResponseStream.tsx
│
├── components/ui/                     # shadcn primitives (unchanged)
├── lib/                               # framework utilities (error reporting, cn helper)
└── styles.css                         # design tokens
```

### Why this shape

- **Routes stay tiny.** Every file in `src/routes/` only declares
  `head()` metadata + `component:` and delegates to a feature page. No
  business logic lives in routes, so URLs can be refactored without
  touching screens.
- **Data logic is separated from display.** Anything that mutates or
  derives state — store actions, the friction classifier, the
  intervention router, the admin metric snapshot — lives in
  `features/retention/`. Display components import from
  `@/features/retention` and never touch `localStorage` or seed data
  directly.
- **Each screen is one folder.** `check-in/` owns the widget, the
  post-submission stage, the three branched stages, and the question
  data file. To delete the academy you delete one folder.
- **Component names match the PRD.** `LandingPage`, `WorkspacePage`,
  `CheckInWidget`, `PostSubmissionIntervention`, `FastTrackAcademyPage`,
  `TeamWorkspacePage`, `AdminAnalyticsPage` — same vocabulary as the
  product doc.

## End-to-end flow

```text
Landing  (LandingPage)
  │  "Open dashboard"
  ▼
Workspace  (WorkspacePage)  ──────────►  Team  (TeamWorkspacePage)
  │  Day 13–16 or 44–47 → cohortFor() returns "day14" | "day45"
  │  → auto-opens after 600ms
  ▼
CheckInWidget  (3 questions: friction · detail · NPS-style + free-text)
  │  Submit → ANALYZE_LATENCY_MS (800ms) skeleton
  │  → classifyFreeText() overrides Q1 choice when it disagrees
  │  → actions.submitResponse() writes to retention store
  ▼
PostSubmissionIntervention   ← branches on friction type
  ├── usability → UsabilityStage → navigate to /dashboard/academy
  ├── admin     → AdminStage     → actions.acceptTeamDiscount() + /dashboard/team
  └── value     → ValueStage     → ROI snapshot in-widget

Every store mutation streams into AdminAnalyticsPage:
  deriveAnalytics(state) → engagement %, actionability %, lift, kill switch,
                            friction breakdown + sparklines, retention curve.
```

## Local development

```bash
bun install
bun dev
```

Then open the printed local URL and navigate to `/dashboard` or `/admin`.
