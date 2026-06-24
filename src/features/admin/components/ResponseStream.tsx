import { Link } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import {
  formatClock,
  interventionLabel,
  type SimUser,
  type SurveyResponse,
} from "@/features/retention";
import { FrictionPill } from "./MetricCards";

export function ResponseStream({
  responses, users, ignoreMode,
}: { responses: SurveyResponse[]; users: SimUser[]; ignoreMode: boolean }) {
  return (
    <div className="rounded-sm border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Response stream</h2>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {ignoreMode ? "feed suppressed" : `${responses.length} total`}
        </span>
      </div>
      {ignoreMode ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-rose-500/40 bg-rose-500/10 text-rose-300">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            No actionable feedback captured
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
            100% of simulated users have ignored or actively closed the intervention widget.
            Turn off Ignore Mode in the simulator above to resume live tagging.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
            <AlertOctagon className="h-3 w-3" /> Kill switch triggered
          </div>
        </div>
      ) : responses.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          No responses yet. Open the <Link to="/dashboard" className="text-emerald-400 underline">user dashboard</Link> at Day 14 or Day 45.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {responses.slice(0, 25).map((r) => {
            const u = users.find((x) => x.id === r.userId);
            const sim = r.q1 === "[simulated session]";
            return (
              <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{u?.name ?? r.userId}</span>
                    {u?.role && <span className="text-xs text-muted-foreground">· {u.role}, {u.company}</span>}
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{r.cohort === "day14" ? "Day 14" : "Day 45"}</span>
                    <FrictionPill friction={r.friction} />
                    {sim && <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">sim</span>}
                  </div>
                  <span suppressHydrationWarning className="text-[10px] uppercase tracking-wider text-muted-foreground">{formatClock(r.createdAt)}</span>
                </div>
                {!sim && (
                  <p className="mt-2 text-sm text-foreground">{r.q1} → <span className="text-muted-foreground">{r.q2}</span> · {r.q3}</p>
                )}
                {r.freeText && (
                  <p className="mt-1 border-l-2 border-emerald-500/40 pl-2.5 text-sm italic text-muted-foreground">
                    "{r.freeText}"
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="rounded-sm border border-border bg-muted/40 px-2 py-0.5 font-medium text-foreground">
                    {interventionLabel(r.intervention)}
                  </span>
                  {r.interventionAccepted === true && <span className="font-semibold uppercase tracking-wider text-emerald-400">accepted</span>}
                  {r.interventionAccepted === false && <span className="font-semibold uppercase tracking-wider text-rose-400">declined</span>}
                  {r.interventionAccepted === null && <span className="uppercase tracking-wider text-muted-foreground">pending</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}