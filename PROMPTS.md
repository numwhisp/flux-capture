# Prompts & Results Log

This document captures the three iterative prompts used to evolve the
**Retention Engine** prototype past the initial 3-screen build, along with
the concrete results that landed in the codebase for each one.

---

## 1. Expand — Post-Submission Intervention + 3 new screens

### Prompt

> We are expanding our "Retention Engine" application. Execute the following
> sequential multi-screen build in a strict, dependent order to avoid breaking
> our existing state management logic.
>
> Add a 4th screen: **The Post-Submission Intervention State**. This screen
> acts as the immediate mitigation bridge inside the slide-out widget. Instead
> of closing the widget when a user submits their 3-question survey, dynamically
> show this state. If their friction was *Usability*, display a CTA to launch
> the Fast-Track Academy. If *Value*, surface a "Book a strategy call" CTA.
> If *Admin*, surface a "Talk to billing" CTA.
>
> Add a 5th screen: the **Fast-Track Interactive Academy** checklist overlay.
> Add a 6th screen: the **Team Workspace** view that proves activation rolled
> up to the cohort.
>
> Match the premium, post-hog/mixpanel aesthetic with neon accents (emerald
> for pass, amber/crimson for warnings). Build client-side routing and
> seamless navigation logic between all 6 screens using our existing
> centralized state management. Ensure that user actions on these three new
> screens immediately update the metric cards, friction tags, and the
> simulated 90-day retention curve on the `/admin` analytics dashboard.

### Result

- **Screen count:** went from 3 → 6.
- New files: `src/routes/dashboard.index.tsx`, `src/routes/dashboard.academy.tsx`,
  `src/routes/dashboard.team.tsx`.
- `src/components/CheckInWidget.tsx` was rewritten to keep the slide-out open
  after submit and branch into the intervention screen, routing each friction
  type to its dedicated CTA (Academy / strategy call / billing).
- `src/lib/retention-store.ts` gained `academyProgress`, cohort rollups, and
  derived selectors so the `/admin` metric cards, friction tags, and the
  90-day retention curve react live to actions taken on the new screens.
- Navigation between all 6 screens runs through TanStack Router `<Link>` —
  no hash anchors, no full reloads.

---

## 2. Behavior — Edge cases, loading, and integration failure

### Prompt

> We are hardening our "Retention Engine" application to move past the
> happy-path demo and ensure it handles real-world edge cases resiliently.
> Implement the following structural behaviors, maintaining our premium
> dark-mode post-hog/mixpanel design language throughout.
>
> 1. Add a loading state with **skeleton screens** for the User Text
>    Categorization Latency inside the slide-out widget. When a user submits
>    free-text, simulate ~900ms of inference latency before the categorized
>    friction tag resolves.
> 2. Within the Fast-Track Interactive Academy checklist overlay, if a user
>    clicks the *Connect Salesforce Integration* row, immediately halt the
>    progress tracker and display an inline error alert state stating:
>    *"API Connection Time-out — Live pipeline sync failed. We have
>    automatically opened a high-priority support ticket to complete your
>    setup manually."* Maintain a high-contrast crimson warning token for
>    the text border while keeping the rest of the checklist functional.

### Result

- `CheckInWidget` now shows a shimmering skeleton row for the categorized
  friction tag during the simulated ~900ms inference window before the
  resolved tag swaps in.
- `dashboard.academy.tsx` flags the Salesforce row as `failing: true`.
  Clicking it does **not** increment the progress bar — instead the row
  inlines a crimson-bordered alert with the API time-out copy and a
  `Ticket #SF-4827` pill. The other rows remain fully interactive.
- A dedicated `AcademyError` boundary was added to `dashboard.academy.tsx`
  so any thrown connector error degrades gracefully with a retry that calls
  both `router.invalidate()` and `reset()`.
- `/admin` got a matching incident strip so the failure is observable from
  the PM view, not just the end-user overlay.

---

## 3. Refine — Friction-Type Sentiment Breakdown Card

### Prompt

> Focus only on the **Friction-Type Sentiment Breakdown Card** on the
> `/admin` dashboard view.
>
> Start by listing the 3 biggest gaps in our current UI styling, layout
> spacing, and high-contrast color tokens compared to a premium PostHog or
> Mixpanel analytics platform standard. Specifically evaluate why our
> deterministic regex text tag rendering feels flat and looks like a rigid
> placeholder demo.
>
> Once these gaps are identified, execute a surgical edit to fix them by:
>
> 1. Splitting the flat single card into a per-friction-type card grid.
> 2. Embedding high-contrast color-coded text tokens (crisp emerald green
>    for pass thresholds, amber/crimson for critical churn signals) directly
>    next to the tags.
> 3. Adding inline custom micro-sparklines next to each friction type
>    bucket to visually track simulated hourly sentiment changes over time.
>
> Do not touch, refactor, or change any other foundational components,
> client-side routes, or centralized state management logic elsewhere in
> this project.

### Result

**Gaps identified before editing:**

1. The breakdown was a single flat card with one shared border, so each
   friction type read as a row in a table rather than its own surface —
   PostHog/Mixpanel use a per-metric card grid with independent borders
   and tone-tinted backgrounds.
2. Severity was communicated only by percentage text. There were no
   color-coded status tokens (emerald = within tolerance, amber = watch,
   crimson = critical) sitting next to the tags.
3. The card was static. No trend signal, no micro-sparkline — so
   deterministic regex output read as a rigid placeholder rather than a
   live analytics surface.

**Surgical edit applied to `src/routes/admin.tsx`:**

- New `FrictionBucketCard` component renders one card per friction type
  (Usability / Value / Admin) with its own bordered, tone-tinted surface.
- New `FrictionPill` component renders each label with a color-coded
  background (sky / emerald / amber) and a status token
  (emerald · amber · crimson) derived from severity thresholds.
- New `Sparkline` SVG component (64×18) renders a filled area + stroke
  path with a trailing dot per bucket, seeded from the live count via
  `sparkFor()` so the trend stays deterministic but updates as new
  check-ins land.
- A small follow-up fix replaced `toLocaleTimeString()` with a
  locale-free UTC `formatClock()` (and added `suppressHydrationWarning`
  on the timestamp span) to eliminate an SSR/CSR hydration mismatch
  surfaced by the new card.

No other routes, components, or store logic were touched.

---

## Screen inventory after all three prompts

| # | Route | Purpose |
|---|-------|---------|
| 1 | `/` | Landing / hypothesis pitch |
| 2 | `/dashboard` | Workspace shell with slide-out check-in widget |
| 3 | `/dashboard` (widget open) | 3-question check-in survey |
| 4 | `/dashboard` (widget post-submit) | Post-submission intervention state |
| 5 | `/dashboard/academy` | Fast-Track Interactive Academy overlay |
| 6 | `/dashboard/team` | Team Workspace cohort rollup |
| + | `/admin` | PM analytics view (metric cards, friction breakdown, 90-day curve) |

All six user-facing screens share the centralized `retention-store` so every
action — submit, intervene, complete a step, hit the Salesforce failure —
propagates to the `/admin` analytics surface in real time.
