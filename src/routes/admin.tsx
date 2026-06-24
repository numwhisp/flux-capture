import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  actions,
  frictionLabel,
  interventionLabel,
  useRetentionStore,
  type FrictionType,
} from "@/lib/retention-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Layers, MessageSquare, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "PM analytics — Retention Engine" },
      { name: "description", content: "Live friction tagging, intervention conversion, and simulated 90-day retention curve." },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const responses = useRetentionStore((s) => s.responses);
  const users = useRetentionStore((s) => s.users);
  const impressions = useRetentionStore((s) => s.modalImpressions);
  const dismissals = useRetentionStore((s) => s.modalDismissals);

  const totalTargeted = impressions || 1;
  const engagementRate = responses.length / totalTargeted;
  const accepted = responses.filter((r) => r.interventionAccepted === true).length;
  const actionability = responses.length ? accepted / responses.length : 0;

  const counts: Record<FrictionType, number> = { usability: 0, value: 0, admin: 0 };
  responses.forEach((r) => { counts[r.friction]++; });
  const totalFriction = responses.length || 1;

  // Simulated retention lift: baseline 70%, each accepted intervention adds 0.6% up to 85%
  const baseline = Array.from({ length: 13 }, (_, i) => 100 - (30 * i) / 12);
  const lift = Math.min(15, accepted * 0.6);
  const treatment = baseline.map((v, i) => v + (lift * i) / 12);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-semibold tracking-tight">Retention Engine · PM analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">User view</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.reset()}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset data
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Validation dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time tagging of incoming responses against pass/fail thresholds.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Engagement rate"
            value={`${Math.round(engagementRate * 100)}%`}
            sub={`${responses.length} of ${impressions} impressions`}
            status={engagementRate >= 0.25 ? "pass" : engagementRate >= 0.15 ? "watch" : "fail"}
            target="Pass ≥ 25% · Fail < 15%"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <KpiCard
            label="Actionability"
            value={`${Math.round(actionability * 100)}%`}
            sub={`${accepted} of ${responses.length} accepted intervention`}
            status={actionability >= 0.7 ? "pass" : actionability >= 0.4 ? "watch" : "fail"}
            target="Pass ≥ 70%"
            icon={<Layers className="h-4 w-4" />}
          />
          <KpiCard
            label="Retention lift (sim)"
            value={`+${lift.toFixed(1)}%`}
            sub="90-day cohort vs baseline"
            status={lift >= 5 ? "pass" : lift >= 2 ? "watch" : "fail"}
            target="Pass ≥ 5%"
            icon={<TrendingDown className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Simulated 90-day retention curve</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <LegendDot className="bg-muted-foreground/40" /> Baseline
                <LegendDot className="bg-foreground" /> Treatment
              </div>
            </div>
            <RetentionChart baseline={baseline} treatment={treatment} />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold">Friction mix</h2>
            <div className="mt-4 space-y-3">
              {(Object.keys(counts) as FrictionType[]).map((f) => {
                const pct = (counts[f] / totalFriction) * 100;
                return (
                  <div key={f}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{frictionLabel(f)}</span>
                      <span className="text-muted-foreground">{counts[f]} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${barColor(f)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Impressions</span><span className="font-medium text-foreground">{impressions}</span></div>
              <div className="mt-1 flex justify-between"><span>Dismissals</span><span className="font-medium text-foreground">{dismissals}</span></div>
              <div className="mt-1 flex justify-between"><span>Users in pool</span><span className="font-medium text-foreground">{users.length}</span></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Response stream</h2>
            <span className="text-xs text-muted-foreground">{responses.length} total</span>
          </div>
          {responses.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No responses yet. Open the <Link to="/dashboard" className="underline">user dashboard</Link>, pick a user at Day 14 or Day 45, and complete the check-in.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {responses.map((r) => {
                const u = users.find((x) => x.id === r.userId);
                return (
                  <li key={r.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">{u?.name ?? r.userId}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{r.cohort === "day14" ? "Day 14" : "Day 45"}</span>
                        <FrictionPill friction={r.friction} />
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{r.q1} → <span className="text-muted-foreground">{r.q2}</span> · {r.q3}</p>
                    {r.freeText && <p className="mt-1 text-sm italic text-muted-foreground">"{r.freeText}"</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">{interventionLabel(r.intervention)}</span>
                      {r.interventionAccepted === true && <span className="text-emerald-600">accepted</span>}
                      {r.interventionAccepted === false && <span className="text-muted-foreground">declined</span>}
                      {r.interventionAccepted === null && <span className="text-muted-foreground">pending</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, status, target, icon }: {
  label: string; value: string; sub: string; target: string;
  status: "pass" | "watch" | "fail"; icon: React.ReactNode;
}) {
  const statusClasses =
    status === "pass" ? "bg-emerald-500/10 text-emerald-700"
    : status === "watch" ? "bg-amber-500/10 text-amber-700"
    : "bg-rose-500/10 text-rose-700";
  const statusLabel = status === "pass" ? "Pass" : status === "watch" ? "Watch" : "Below";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses}`}>{statusLabel}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
      <p className="mt-1 text-xs text-muted-foreground/80">{target}</p>
    </div>
  );
}

function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${className}`} />;
}

function barColor(f: FrictionType) {
  if (f === "usability") return "bg-indigo-500";
  if (f === "value") return "bg-emerald-500";
  return "bg-amber-500";
}

function FrictionPill({ friction }: { friction: FrictionType }) {
  const cls = friction === "usability" ? "bg-indigo-500/10 text-indigo-700"
    : friction === "value" ? "bg-emerald-500/10 text-emerald-700"
    : "bg-amber-500/10 text-amber-700";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{frictionLabel(friction)}</span>;
}

function RetentionChart({ baseline, treatment }: { baseline: number[]; treatment: number[] }) {
  const W = 600, H = 200, P = 24;
  const max = 100, min = 60;
  const x = (i: number) => P + (i * (W - P * 2)) / (baseline.length - 1);
  const y = (v: number) => H - P - ((v - min) * (H - P * 2)) / (max - min);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  return (
    <div className="mt-4 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        {[60, 70, 80, 90, 100].map((g) => (
          <g key={g}>
            <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-border" strokeWidth={1} />
            <text x={4} y={y(g) + 3} className="fill-muted-foreground text-[10px]">{g}%</text>
          </g>
        ))}
        <path d={path(baseline)} fill="none" stroke="currentColor" className="text-muted-foreground/50" strokeWidth={2} strokeDasharray="4 4" />
        <path d={path(treatment)} fill="none" stroke="currentColor" className="text-foreground" strokeWidth={2.5} />
        {baseline.map((_, i) => i % 2 === 0 && (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">D{i * 7}</text>
        ))}
      </svg>
    </div>
  );
}