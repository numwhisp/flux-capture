import type { ReactNode } from "react";
import { frictionLabel, type FrictionType } from "@/features/retention";
import { Sparkline } from "./Charts";

export function BaselineCell({ label, value, tone }: { label: string; value: string; tone: "bad" | "warn" }) {
  const cls = tone === "bad" ? "text-rose-300" : "text-amber-300";
  return (
    <div className="px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

export function KpiCard({ label, value, sub, status, target, icon }: {
  label: string; value: string; sub: string; target: string;
  status: "pass" | "watch" | "fail"; icon: ReactNode;
}) {
  const statusClasses =
    status === "pass" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
    : status === "watch" ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
    : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
  const statusLabel = status === "pass" ? "Pass" : status === "watch" ? "Watch" : "Below";
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
        <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">{target}</p>
    </div>
  );
}

function barColor(f: FrictionType) {
  if (f === "usability") return "bg-sky-400";
  if (f === "value") return "bg-emerald-400";
  return "bg-amber-400";
}

export function FrictionBucketCard({
  friction, count, pct, spark,
}: { friction: FrictionType; count: number; pct: number; spark: number[] }) {
  const tone =
    friction === "usability"
      ? { ring: "ring-sky-500/25", bg: "bg-sky-500/[0.04]", dot: "bg-sky-400", stroke: "oklch(0.78 0.14 230)", text: "text-sky-300" }
      : friction === "value"
      ? { ring: "ring-emerald-500/25", bg: "bg-emerald-500/[0.04]", dot: "bg-emerald-400", stroke: "oklch(0.82 0.21 150)", text: "text-emerald-300" }
      : { ring: "ring-amber-500/25", bg: "bg-amber-500/[0.05]", dot: "bg-amber-400", stroke: "oklch(0.82 0.17 75)", text: "text-amber-300" };

  // admin friction is the churn-leading signal in the brief.
  const critical = friction === "admin" && pct >= 35;
  const watch = pct >= 45 && !critical;
  const statusCls = critical
    ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
    : watch
    ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
    : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  const statusLabel = critical ? "Churn risk" : watch ? "Watch" : "Within tolerance";

  return (
    <div className={`rounded-sm border border-border ${tone.bg} ring-1 ${tone.ring} px-3 py-2.5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-sm ${tone.dot}`} />
          <span className="text-xs font-semibold tracking-tight text-foreground">{frictionLabel(friction)}</span>
          <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusCls}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className={`text-sm font-semibold ${tone.text}`}>{pct.toFixed(0)}%</span>
          <span className="text-[10px] text-muted-foreground">· {count}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2.5">
        <div className="h-1 flex-1 overflow-hidden rounded-sm bg-muted/60">
          <div className={`h-full ${barColor(friction)}`} style={{ width: `${pct}%` }} />
        </div>
        <Sparkline points={spark} stroke={tone.stroke} />
      </div>
    </div>
  );
}

export function FrictionPill({ friction }: { friction: FrictionType }) {
  const cls = friction === "usability" ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30"
    : friction === "value" ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
    : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30";
  return <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{frictionLabel(friction)}</span>;
}