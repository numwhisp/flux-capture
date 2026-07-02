import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, AlertOctagon, Sparkles, RefreshCw, PlayCircle } from "lucide-react";
import { actions, useRetentionStore } from "@/features/retention";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademyStepRow } from "./AcademyStepRow";

// Screen 5 — Fast-Track Interactive Academy.
export function FastTrackAcademyPage() {
  const progress = useRetentionStore((s) => s.academyProgress);
  const steps = useRetentionStore((s) => s.academySteps);
  const isHydrating = useRetentionStore((s) => s.isHydrating);
  const done = steps.filter((s) => progress[s.id]).length;
  const pct = steps.length ? (done / steps.length) * 100 : 0;

  if (isHydrating) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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

            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className={`h-full transition-all ${pct === 100 ? "bg-emerald-400" : pct >= 50 ? "bg-emerald-400" : "bg-amber-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                {done} / {steps.length}
              </span>
            </div>

            <ul className="mt-6 divide-y divide-border rounded-sm border border-border bg-background/30">
              {steps.map((s) => (
                <AcademyStepRow key={s.id} step={s} done={!!progress[s.id]} />
              ))}
            </ul>

            {done === 0 && steps.length > 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-sm border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500/20 text-emerald-300">
                  <PlayCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">You haven't started yet</div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Tick the first step above to log activation and start the fast-track path.
                  </p>
                </div>
              </div>
            )}

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
                disabled={done < steps.length}
                asChild
              >
                <Link to="/dashboard">
                  {done === steps.length && steps.length > 0 ? "Finish · back to workspace" : "Complete steps to continue"}
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

export function FastTrackAcademyError({ error, reset }: { error: Error; reset: () => void }) {
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
            <Button size="sm" className="h-8 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
              onClick={() => { router.invalidate(); reset(); }}>
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