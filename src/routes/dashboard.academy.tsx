import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { actions, useRetentionStore } from "@/lib/retention-store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, GraduationCap, AlertOctagon, Sparkles, RefreshCw, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/dashboard/academy")({
  head: () => ({
    meta: [
      { title: "Fast-track academy — Retention Engine" },
      { name: "description", content: "Interactive setup checklist that closes the loop on Day 14 usability friction." },
    ],
  }),
  component: AcademyOverlay,
  errorComponent: AcademyError,
});

const STEPS: { id: string; label: string; sub: string; failing?: boolean }[] = [
  { id: "workspace", label: "Create your workspace", sub: "Auto-completed when you signed up." },
  { id: "warehouse", label: "Connect your data warehouse", sub: "Snowflake, BigQuery, Postgres — 90s avg." },
  { id: "salesforce", label: "Connect Salesforce integration", sub: "Required for the revenue attribution model.", failing: true },
  { id: "report", label: "Build your first report", sub: "Pick a template — the wizard fills the rest." },
  { id: "invite", label: "Invite one teammate", sub: "Accounts with 2+ seats activate 3× faster." },
];

function AcademyOverlay() {
  const progress = useRetentionStore((s) => s.academyProgress);
  const done = STEPS.filter((s) => progress[s.id]).length;
  const pct = (done / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-3xl items-start justify-center px-6 py-10">
        <div className="w-full overflow-hidden rounded-md border border-emerald-500/20 bg-card shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-5 py-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Fast-track academy · Day 14 usability path
              </span>
            </div>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="px-6 py-6">
            <h1 className="text-xl font-semibold tracking-tight">Get to your first 'aha' in 4 minutes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Skip what you've done. Check each box as you complete the step — your progress here updates the retention engine in real time.
            </p>

            {/* Progress */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className={`h-full transition-all ${pct === 100 ? "bg-emerald-400" : pct >= 50 ? "bg-emerald-400" : "bg-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                {done} / {STEPS.length}
              </span>
            </div>

            <ul className="mt-6 divide-y divide-border rounded-sm border border-border bg-background/30">
              {STEPS.map((s) => (
                <StepRow key={s.id} step={s} done={!!progress[s.id]} />
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => actions.resetAcademy()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
              <Button
                size="sm"
                className="h-8 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                disabled={done < STEPS.length}
                asChild
              >
                <Link to="/dashboard">
                  {done === STEPS.length ? "Finish · back to workspace" : "Complete steps to continue"}
                </Link>
              </Button>
            </div>

            {pct === 100 && (
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                <Sparkles className="h-3 w-3" /> Activation logged · cohort moved to "engaged"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, done }: { step: { id: string; label: string; sub: string; failing?: boolean }; done: boolean }) {
  // Salesforce row resolves to an inline integration-failure alert rather than
  // throwing to the route error boundary — the rest of the checklist must stay
  // interactive while the pipeline error is surfaced.
  const [pipelineFailed, setPipelineFailed] = useState(false);

  function attempt(next: boolean) {
    if (!next) {
      if (step.failing) setPipelineFailed(false);
      actions.setAcademyStep(step.id, false);
      return;
    }
    if (step.failing) {
      setPipelineFailed(true);
      return;
    }
    actions.setAcademyStep(step.id, true);
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Checkbox
        checked={done}
        onCheckedChange={(v) => attempt(v === true)}
        className="mt-0.5"
        aria-label={step.label}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {step.label}
          </span>
          {step.failing && (
            <span
              className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                pipelineFailed
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300"
              }`}
            >
              {pipelineFailed ? "pipeline failed" : "flaky"}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{step.sub}</p>
        {pipelineFailed && step.failing && (
          <div
            role="alert"
            className="mt-2 rounded-sm border-2 border-rose-500/60 bg-rose-500/5 p-2.5"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
              <AlertOctagon className="h-3 w-3" /> API connection time-out
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-200">
              Live pipeline sync failed. We have automatically opened a high-priority support
              ticket to complete your setup manually.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                <LifeBuoy className="h-3 w-3" /> Ticket #SF-4827 opened
              </span>
              <button
                onClick={() => setPipelineFailed(false)}
                className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function AcademyError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
        <div className="w-full rounded-md border border-rose-500/30 bg-card p-6 shadow-2xl shadow-rose-500/5">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertOctagon className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Connector error · academy paused
            </span>
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight">Salesforce integration failed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We hit a 503 from the Salesforce connector. This is the kind of friction the engine is built to catch — your check-in
            response is already logged on the PM analytics view.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-sm border border-border bg-background/40 p-3 text-[11px] text-rose-200">
{error.message}
          </pre>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
              onClick={() => { router.invalidate(); reset(); }}
            >
              Retry connector
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link to="/dashboard">Back to workspace</Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link to="/admin">See incident in PM view</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}