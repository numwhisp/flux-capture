import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retention Engine — Prototype" },
      { name: "description", content: "In-app contextual check-ins that surface hidden churn drivers and trigger targeted interventions." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Validation prototype · Feasibility test
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          The Retention Engine
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          A B2B SaaS is losing 30% of new accounts inside 90 days. This prototype tests whether
          a 3-question contextual check-in at Day 14 and Day 45 can surface the <em>why</em>
          and trigger an intervention that bends the retention curve.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/dashboard"
            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30 hover:bg-accent"
          >
            <div>
              <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-card-foreground">User view</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Simulated SaaS dashboard. Switch between users at Day 14 and Day 45 to trigger
                the contextual check-in modal and accept the matched intervention.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground">
              Open dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            to="/admin"
            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30 hover:bg-accent"
          >
            <div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold text-card-foreground">PM analytics view</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live tagging of friction type (Usability, Value, Admin), intervention conversion,
                and a simulated 90-day retention curve responding to engagement.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground">
              Open analytics <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          {[
            ["30%", "90-day churn"],
            ["22%", "Week-one activation"],
            ["6.2d", "Time-to-first-value"],
            ["$1.1M", "ARR at risk"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{l}</dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
