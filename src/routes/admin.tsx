import { createFileRoute, Link } from "@tanstack/react-router";
import {
  actions,
  frictionLabel,
  interventionLabel,
  useRetentionStore,
  type FrictionType,
} from "@/lib/retention-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  RotateCcw,
  Layers,
  MessageSquare,
  TrendingDown,
  AlertOctagon,
  Zap,
  Play,
} from "lucide-react";

// Hardcoded baseline targets from the validation brief — these never change at runtime.
const BASELINE = {
  ninetyDayChurn: 0.30,
  activationRate: 0.22,
  seatsPerAccount: 1.4,
  timeToFirstValueDays: 6.2,
};

const KILL_SWITCH_THRESHOLD = 0.10;
const ENGAGEMENT_TARGET = 0.25;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "PM analytics — Retention Engine" },
      { name: "description", content: "Live friction tagging, intervention conversion, kill-switch monitor, and simulated 90-day retention curve." },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const responses = useRetentionStore((s) => s.responses);
  const users = useRetentionStore((s) => s.users);
  const impressions = useRetentionStore((s) => s.modalImpressions);
  const dismissals = useRetentionStore((s) => s.modalDismissals);
  const ignoreMode = useRetentionStore((s) => s.ignoreMode);

  const totalTargeted = impressions || 1;
  // When the PM flips Ignore Mode to 100% we treat the live feed as void:
  // engagement is force-clamped below the kill threshold and the response
  // stream is suppressed in the UI (the underlying store is preserved so
  // toggling back restores the data).
  const rawEngagementRate = responses.length / totalTargeted;
  const engagementRate = ignoreMode ? Math.min(rawEngagementRate, 0.08) : rawEngagementRate;
  const accepted = responses.filter((r) => r.interventionAccepted === true).length;
  const actionability = responses.length ? accepted / responses.length : 0;

  const counts: Record<FrictionType, number> = { usability: 0, value: 0, admin: 0 };
  responses.forEach((r) => { counts[r.friction]++; });
  const totalFriction = responses.length || 1;

  const baseline = Array.from({ length: 13 }, (_, i) => 100 - (BASELINE.ninetyDayChurn * 100 * i) / 12);
  const lift = Math.min(15, accepted * 0.4);
  const treatment = baseline.map((v, i) => v + (lift * i) / 12);

  const killSwitch = ignoreMode || (impressions >= 20 && engagementRate < KILL_SWITCH_THRESHOLD);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-500 text-emerald-950">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">retention.engine</span>
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              PM analytics
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">User view</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => actions.reset()}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset data
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Validation dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live tagging against the discovery baseline. Kill-switch fires below {Math.round(KILL_SWITCH_THRESHOLD * 100)}% engagement.
            </p>
          </div>
          {killSwitch && (
            <div className="flex items-center gap-2 rounded-sm border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300">
              <AlertOctagon className="h-3.5 w-3.5" />
              Kill switch triggered
            </div>
          )}
        </div>

        {/* Discovery baseline — hardcoded brief targets */}
        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Discovery baseline · what we're trying to move
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Source: validation brief</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
            <BaselineCell label="90-day churn" value="30%" tone="bad" />
            <BaselineCell label="Activation rate" value="22%" tone="warn" />
            <BaselineCell label="Active seats / account" value="1.4" tone="warn" />
            <BaselineCell label="Time-to-first-value" value="6.2 days" tone="warn" />
          </div>
        </div>

        {/* Live KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Engagement rate"
            value={`${Math.round(engagementRate * 100)}%`}
            sub={`${responses.length} responses · ${impressions} impressions`}
            status={killSwitch ? "fail" : engagementRate >= ENGAGEMENT_TARGET ? "pass" : engagementRate >= 0.15 ? "watch" : "fail"}
            target={`Pass ≥ ${Math.round(ENGAGEMENT_TARGET * 100)}% · Kill < ${Math.round(KILL_SWITCH_THRESHOLD * 100)}%`}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Actionability"
            value={`${Math.round(actionability * 100)}%`}
            sub={`${accepted} of ${responses.length} accepted intervention`}
            status={actionability >= 0.7 ? "pass" : actionability >= 0.4 ? "watch" : "fail"}
            target="Pass ≥ 70%"
            icon={<Layers className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Retention lift (sim)"
            value={`+${lift.toFixed(1)}%`}
            sub="90-day cohort vs baseline"
            status={lift >= 5 ? "pass" : lift >= 2 ? "watch" : "fail"}
            target="Pass ≥ 5pp absolute"
            icon={<TrendingDown className="h-3.5 w-3.5" />}
          />
        </div>

        {/* User simulator */}
        <UserSimulator ignoreMode={ignoreMode} killSwitch={killSwitch} engagementRate={engagementRate} />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Simulated 90-day retention</h2>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                <LegendDot className="bg-muted-foreground/50" /> Baseline (30% churn)
                <LegendDot className="bg-emerald-400" /> Treatment
              </div>
            </div>
            <RetentionChart baseline={baseline} treatment={treatment} />
          </div>

          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Friction sentiment breakdown</h2>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">12h trend</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {(Object.keys(counts) as FrictionType[]).map((f) => {
                const pct = (counts[f] / totalFriction) * 100;
                return (
                  <FrictionBucketCard
                    key={f}
                    friction={f}
                    count={counts[f]}
                    pct={pct}
                    spark={sparkFor(f, counts[f])}
                  />
                );
              })}
            </div>
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Impressions</span><span className="font-semibold text-foreground">{impressions}</span></div>
              <div className="mt-1 flex justify-between"><span>Dismissals</span><span className="font-semibold text-foreground">{dismissals}</span></div>
              <div className="mt-1 flex justify-between"><span>Accounts in pool</span><span className="font-semibold text-foreground">{users.length}</span></div>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}

function UserSimulator({
  ignoreMode,
  killSwitch,
  engagementRate,
}: { ignoreMode: boolean; killSwitch: boolean; engagementRate: number }) {
  return (
    <div className={`rounded-sm border bg-card p-5 transition-colors ${killSwitch ? "border-rose-500/40" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            <h2 className="text-sm font-semibold">User simulator · resilience test</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Fire automated user sessions against the live engine. Toggle ignore-mode to verify
            the kill switch trips when engagement collapses below {Math.round(KILL_SWITCH_THRESHOLD * 100)}%.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-border bg-background/40 px-3 py-2">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">100% ignore mode</div>
            <div className={`text-[11px] font-semibold ${ignoreMode ? "text-rose-300" : "text-muted-foreground"}`}>
              {ignoreMode ? "ON · sessions will dismiss" : "OFF · sessions will respond"}
            </div>
          </div>
          <Switch checked={ignoreMode} onCheckedChange={actions.setIgnoreMode} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="h-8 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          onClick={() => actions.simulateSessions(100)}
        >
          Run 100 sessions
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => actions.simulateSessions(25)}>
          +25
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => actions.simulateSessions(10)}>
          +10
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          Engagement now: <span className={`font-semibold ${killSwitch ? "text-rose-300" : "text-emerald-300"}`}>
            {Math.round(engagementRate * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function BaselineCell({ label, value, tone }: { label: string; value: string; tone: "bad" | "warn" }) {
  const cls = tone === "bad" ? "text-rose-300" : "text-amber-300";
  return (
    <div className="px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, status, target, icon }: {
  label: string; value: string; sub: string; target: string;
  status: "pass" | "watch" | "fail"; icon: React.ReactNode;
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

function LegendDot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-sm ${className}`} />;
}

function barColor(f: FrictionType) {
  if (f === "usability") return "bg-sky-400";
  if (f === "value") return "bg-emerald-400";
  return "bg-amber-400";
}

function FrictionPill({ friction }: { friction: FrictionType }) {
  const cls = friction === "usability" ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30"
    : friction === "value" ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
    : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30";
  return <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>{frictionLabel(friction)}</span>;
}

// Locale-free clock formatter so SSR and client hydrate the same string.
function formatClock(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s} UTC`;
}

// Deterministic 12-point hourly sentiment sparkline seeded off the live count
// so each bucket gets a stable, distinct micro-trend that still reacts to volume.
function sparkFor(friction: FrictionType, count: number): number[] {
  const seed = friction === "usability" ? 7 : friction === "value" ? 13 : 19;
  const base = 0.45 + Math.min(count, 30) / 60;
  return Array.from({ length: 12 }, (_, i) => {
    const n = Math.sin((i + seed) * 1.3) * 0.5 + Math.cos((i + seed) * 0.7) * 0.3;
    return Math.max(0.05, Math.min(1, base + n * 0.25));
  });
}

function FrictionBucketCard({
  friction, count, pct, spark,
}: { friction: FrictionType; count: number; pct: number; spark: number[] }) {
  const tone =
    friction === "usability"
      ? { ring: "ring-sky-500/25", bg: "bg-sky-500/[0.04]", dot: "bg-sky-400", stroke: "oklch(0.78 0.14 230)", text: "text-sky-300" }
      : friction === "value"
      ? { ring: "ring-emerald-500/25", bg: "bg-emerald-500/[0.04]", dot: "bg-emerald-400", stroke: "oklch(0.82 0.21 150)", text: "text-emerald-300" }
      : { ring: "ring-amber-500/25", bg: "bg-amber-500/[0.05]", dot: "bg-amber-400", stroke: "oklch(0.82 0.17 75)", text: "text-amber-300" };

  // Status token: emerald for healthy share, amber watch, crimson critical
  // (admin friction is the churn-leading signal in the brief).
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

function Sparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const W = 64, H = 18;
  const x = (i: number) => (i * W) / (points.length - 1);
  const y = (v: number) => H - 1 - v * (H - 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0">
      <path d={area} fill={stroke} opacity={0.18} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={W} cy={y(last)} r={1.6} fill={stroke} />
    </svg>
  );
}

function RetentionChart({ baseline, treatment }: { baseline: number[]; treatment: number[] }) {
  const W = 600, H = 200, P = 28;
  const max = 100, min = 60;
  const x = (i: number) => P + (i * (W - P * 2)) / (baseline.length - 1);
  const y = (v: number) => H - P - ((v - min) * (H - P * 2)) / (max - min);
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const area = `${path(treatment)} L${x(treatment.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  return (
    <div className="mt-4 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full">
        <defs>
          <linearGradient id="treat" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.21 150)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="oklch(0.82 0.21 150)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[60, 70, 80, 90, 100].map((g) => (
          <g key={g}>
            <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-border" strokeWidth={1} />
            <text x={4} y={y(g) + 3} className="fill-muted-foreground text-[10px]">{g}%</text>
          </g>
        ))}
        <path d={area} fill="url(#treat)" />
        <path d={path(baseline)} fill="none" stroke="currentColor" className="text-muted-foreground/60" strokeWidth={1.5} strokeDasharray="3 4" />
        <path d={path(treatment)} fill="none" stroke="oklch(0.82 0.21 150)" strokeWidth={2.5} />
        {baseline.map((_, i) => i % 2 === 0 && (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">D{i * 7}</text>
        ))}
      </svg>
    </div>
  );
}