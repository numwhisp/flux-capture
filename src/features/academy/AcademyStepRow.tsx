import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertOctagon, LifeBuoy, SkipForward } from "lucide-react";
import { actions, type AcademyStepRecord } from "@/features/retention";

export function AcademyStepRow({ step, done }: { step: AcademyStepRecord; done: boolean }) {
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

  // Flaky integrations (Salesforce) are optional. The user can skip past the
  // connector failure so the checklist isn't blocked by an upstream 503.
  function skipFlaky() {
    setPipelineFailed(false);
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
              {pipelineFailed ? "pipeline failed" : "flaky · optional"}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{step.sub}</p>
        {pipelineFailed && step.failing && (
          <div role="alert" className="mt-2 rounded-sm border-2 border-rose-500/60 bg-rose-500/5 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
              <AlertOctagon className="h-3 w-3" /> API connection time-out
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-200">
              Live pipeline sync failed. We've opened a high-priority ticket to finish setup manually —
              this step is optional, so you can skip it and keep moving.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                <LifeBuoy className="h-3 w-3" /> Ticket #SF-4827 opened
              </span>
              <button
                onClick={skipFlaky}
                className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20"
              >
                <SkipForward className="h-3 w-3" /> Skip for now
              </button>
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