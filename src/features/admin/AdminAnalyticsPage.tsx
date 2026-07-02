import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, RotateCcw, Layers, MessageSquare, TrendingDown, AlertOctagon, Zap, RefreshCw, LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  actions,
  deriveAnalytics,
  retryHydration,
  sparkFor,
  useRetentionStore,
  type FrictionType,
} from "@/features/retention";
import { LegendDot, RetentionChart } from "./components/Charts";
import { BaselineCell, FrictionBucketCard, KpiCard } from "./components/MetricCards";
import { UserSimulator } from "./components/UserSimulator";
import { ResponseStream } from "./components/ResponseStream";

// PM analytics view (not a user-facing screen) — surfaces every signal
// the retention store collects.
export function AdminAnalyticsPage() {
  // Select raw store slices, then derive — keeps useSyncExternalStore snapshots stable.
  const responsesRaw = useRetentionStore((s) => s.responses);
  const impressionsRaw = useRetentionStore((s) => s.modalImpressions);
  const dismissalsRaw = useRetentionStore((s) => s.modalDismissals);
  const ignoreModeRaw = useRetentionStore((s) => s.ignoreMode);
  const users = useRetentionStore((s) => s.users);
  const baseline = useRetentionStore((s) => s.baseline);
  const experimentConfig = useRetentionStore((s) => s.experimentConfig);
  const isHydrating = useRetentionStore((s) => s.isHydrating);
  const hydrationError = useRetentionStore((s) => s.hydrationError);

  if (hydrationError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-md border border-rose-500/30 bg-card p-6">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertOctagon className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Analytics offline</span>
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight">Couldn't load your data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The PM analytics feed couldn't hydrate from the retention backend.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-sm border border-border bg-background/40 p-3 text-[11px] text-rose-200">{hydrationError}</pre>
          <Button size="sm" className="mt-4 h-8 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
            onClick={() => retryHydration()}>
            <RefreshCw className="mr-1.5 h-3 w-3" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isHydrating) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  const snap = useMemo(
    () => deriveAnalytics({
      responses: responsesRaw,
      modalImpressions: impressionsRaw,
      modalDismissals: dismissalsRaw,
      ignoreMode: ignoreModeRaw,
      baseline,
      experimentConfig,
    }),
    [responsesRaw, impressionsRaw, dismissalsRaw, ignoreModeRaw, baseline, experimentConfig],
  );
  const {
    responses, impressions, dismissals, ignoreMode,
    engagementRate, acceptedCount, actionability,
    counts, totalFriction, baseline: baselineCurve, treatment, lift, killSwitch,
  } = snap;
  const { killSwitchThreshold, engagementTarget } = experimentConfig;

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
              Live tagging against the discovery baseline. Kill-switch fires below {Math.round(killSwitchThreshold * 100)}% engagement.
            </p>
          </div>
          {killSwitch && (
            <div className="flex items-center gap-2 rounded-sm border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300">
              <AlertOctagon className="h-3.5 w-3.5" />
              Kill switch triggered
            </div>
          )}
        </div>

        <div className="rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Discovery baseline · what we're trying to move
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Source: validation brief</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
            <BaselineCell label="90-day churn"           value={`${Math.round(baseline.ninetyDayChurn * 100)}%`}      tone="bad"  />
            <BaselineCell label="Activation rate"        value={`${Math.round(baseline.activationRate * 100)}%`}      tone="warn" />
            <BaselineCell label="Active seats / account" value={baseline.seatsPerAccount.toFixed(1)}                  tone="warn" />
            <BaselineCell label="Time-to-first-value"    value={`${baseline.timeToFirstValueDays.toFixed(1)} days`}   tone="warn" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Engagement rate"
            value={`${Math.round(engagementRate * 100)}%`}
            sub={`${responses.length} responses · ${impressions} impressions`}
            status={killSwitch ? "fail" : engagementRate >= engagementTarget ? "pass" : engagementRate >= 0.15 ? "watch" : "fail"}
            target={`Pass ≥ ${Math.round(engagementTarget * 100)}% · Kill < ${Math.round(killSwitchThreshold * 100)}%`}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Actionability"
            value={`${Math.round(actionability * 100)}%`}
            sub={`${acceptedCount} of ${responses.length} accepted intervention`}
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

        <UserSimulator
          ignoreMode={ignoreMode}
          killSwitch={killSwitch}
          engagementRate={engagementRate}
          killSwitchThreshold={killSwitchThreshold}
        />

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Simulated 90-day retention</h2>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                <LegendDot className="bg-muted-foreground/50" /> Baseline (30% churn)
                <LegendDot className="bg-emerald-400" /> Treatment
              </div>
            </div>
            {responses.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-background/30 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground">
                  <LineChart className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">No check-ins yet</h3>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  Run a simulated session below to populate the friction feed and start the retention curve.
                </p>
              </div>
            ) : (
              <RetentionChart baseline={baselineCurve} treatment={treatment} />
            )}
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

        <ResponseStream responses={responses} users={users} ignoreMode={ignoreMode} />
      </div>
    </div>
  );
}