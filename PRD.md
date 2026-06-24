# Product Requirements Document — Retention Engine

**Status:** Prototype (v0.6, 6 screens)
**Owner:** Product / Growth
**Last updated:** 2026-06-24

---

## 1. What it does

Retention Engine is an in-product check-in widget plus a PM-facing analytics
console. It catches early friction signals from new users during the
critical Day 0–14 activation window, categorizes the friction
(Usability / Value / Admin), and immediately routes the user into a
mitigation flow — a guided academy, a strategy call, or a billing touch —
before they silently churn. Every interaction streams into a centralized
store that drives a live PostHog/Mixpanel-style dashboard for the PM and
CS teams.

## 2. Who it's for

| Persona | Need |
|---|---|
| **End user** (newly-onboarded SaaS account) | A low-friction way to flag confusion without filing a ticket. |
| **Product Manager** | A live read on where new-user friction is concentrated and whether interventions move the retention curve. |
| **Customer Success / Lifecycle** | A queue of at-risk accounts segmented by friction type so outreach is targeted, not generic. |

## 3. Problem it solves

SaaS products lose 40–60% of signups in the first two weeks, and the
"silent churn" majority never file a support ticket or answer an NPS email.
PMs see the lagging indicator (retention curve dropping at Day 14) without
the leading signal (which specific friction caused it). Generic onboarding
checklists treat every user identically, so the highest-intent confused
users get the same nudge as a fully-activated power user.

Retention Engine closes that loop: capture the signal at the moment of
friction, classify it, intervene immediately with a friction-specific
action, and prove the lift on a single dashboard.

## 4. Hypothesis

> If we surface a 3-question in-product check-in at Day 7 and 14, classify
> the free-text response into one of three friction buckets, and trigger a
> bucket-specific intervention inside the same widget session, we will
> measurably lift Day-30 retention versus a control cohort that only
> receives the standard onboarding email sequence.
>
> **Falsifiable expectation:** ≥ 6pt absolute lift in Day-30 retention for
> the treatment cohort, with ≥ 35% of widget submissions converting into
> the intervention step (academy launch, call booked, or billing chat
> opened).

## 5. Screens

| # | Route | Purpose |
|---|---|---|
| 1 | `/` | Landing page — hypothesis pitch, primary CTA into the workspace. |
| 2 | `/dashboard` | Workspace shell. Hosts the slide-out check-in widget and links into Academy + Team views. |
| 3 | `/dashboard` (widget open) | 3-question check-in survey: scored confidence, free-text friction, intent-to-continue. |
| 4 | `/dashboard` (post-submit) | **Post-Submission Intervention State.** Branches on classified friction: Usability → Academy CTA, Value → strategy call, Admin → billing chat. |
| 5 | `/dashboard/academy` | **Fast-Track Interactive Academy** overlay. Five-step checklist to first "aha". Surfaces a deliberate Salesforce integration failure to model real-world breakage. |
| 6 | `/dashboard/team` | **Team Workspace** cohort rollup. Proves an individual activation rolled up to the team segment. |
| + | `/admin` | PM analytics view (not a user screen). Metric cards, friction-type sentiment breakdown with sparklines, simulated 90-day retention curve, incident strip. |

## 6. User flow

```text
Landing (/)
   │  "Try the workspace"
   ▼
Workspace (/dashboard)  ──────────────► Team rollup (/dashboard/team)
   │  Day 7 / 14 trigger
   ▼
Check-in widget (3 questions)
   │  submit
   ▼
[~900ms skeleton — simulated inference latency]
   │
   ▼
Categorized friction tag (Usability | Value | Admin)
   │
   ▼
Post-Submission Intervention
   ├── Usability ─► Fast-Track Academy (/dashboard/academy)
   │                   └─ Salesforce step → inline API time-out alert
   ├── Value     ─► "Book a strategy call" CTA
   └── Admin     ─► "Talk to billing" CTA
                        │
                        ▼
            Centralized retention-store updates
                        │
                        ▼
        /admin dashboard reflects:
          • metric cards
          • friction sentiment breakdown (sparklines)
          • simulated 90-day retention curve
          • incident strip (if Salesforce failure fired)
```

## 7. Key metrics

**North-star**
- Day-30 retention rate (treatment vs. control cohort).

**Leading indicators (visible on `/admin`)**
- Check-in submission rate (% of triggered widgets that get submitted).
- Friction-type distribution (Usability / Value / Admin mix, with hourly sparklines).
- Intervention conversion rate (% of submissions that take the offered CTA).
- Academy completion rate (5/5 steps).
- Integration failure rate (Salesforce time-outs per 100 attempts).

**Quality / health**
- Categorization latency p95 (target < 1.2s; currently mocked at ~900ms).
- Hydration / runtime error rate on the widget (target 0).

## 8. What is mocked vs. real

| Area | Status | Notes |
|---|---|---|
| Client-side routing across all 6 screens | **Real** | TanStack Router, file-based, no hash anchors. |
| Centralized state (`src/lib/retention-store.ts`) | **Real** | Drives every downstream surface in-session. |
| Slide-out check-in widget + intervention branching | **Real** | Friction-type → CTA mapping is live code, not a mock. |
| Academy checklist + Salesforce failure alert | **Real (UI), simulated failure** | The failure is a hard-coded `failing: true` row, not a live API call. |
| Friction-type sentiment breakdown card (per-bucket cards, color tokens, sparklines) | **Real** | Sparkline data is deterministic, seeded from live counts. |
| Free-text → friction classification | **Mocked** | Deterministic regex tagging with a ~900ms artificial latency to mimic an LLM inference round-trip. No model call. |
| 90-day retention curve on `/admin` | **Mocked** | Curve is simulated from in-session events; no warehouse, no cohort SQL. |
| Cohort rollups on `/dashboard/team` | **Mocked** | Rollups computed in-memory from the same session store. |
| Integration connectors (Salesforce, warehouse, etc.) | **Mocked** | Surfaced as UI states (idle / flaky / pipeline failed) — no live OAuth or pipeline. |
| Authentication, multi-tenant persistence, real backend | **Not implemented** | No Lovable Cloud, no Supabase, no DB. State resets on reload. |
| Email / Slack outreach from intervention | **Not implemented** | CTAs route in-app only; no transactional send. |

## 9. Out of scope for this prototype

- Real LLM-based free-text classification.
- Persistence across sessions or users.
- Auth, RBAC, audit log.
- Webhook delivery to CRM / CS tools.
- A/B test framework for the hypothesis itself (the prototype demonstrates the loop; measurement infra is next).

## 10. Next milestones

1. Wire free-text categorization to a real model via Lovable AI Gateway; keep the skeleton latency state.
2. Add Lovable Cloud persistence so check-ins, academy progress, and cohort membership survive reload.
3. Ship the A/B harness: treatment cohort sees the widget, control cohort does not; report Day-30 lift on `/admin`.
4. Replace the mocked 90-day retention curve with a real cohort query against persisted check-in events.
