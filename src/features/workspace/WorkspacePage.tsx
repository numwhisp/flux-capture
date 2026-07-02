import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, BarChart3, Bell, Inbox, Users, GraduationCap, AlertOctagon, RefreshCw } from "lucide-react";
import { cohortFor, retryHydration, useRetentionStore } from "@/features/retention";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInWidget } from "@/features/check-in/CheckInWidget";
import { SimControls, SparkBars, StatCard } from "./WorkspaceWidgets";

// Screen 2 — Workspace shell. Hosts the slide-out check-in widget and links
// into the academy + team views.
export function WorkspacePage() {
  const users = useRetentionStore((s) => s.users);
  const currentUserId = useRetentionStore((s) => s.currentUserId);
  const isHydrating = useRetentionStore((s) => s.isHydrating);
  const hydrationError = useRetentionStore((s) => s.hydrationError);
  const user = users.find((u) => u.id === currentUserId) ?? users[0];
  const [open, setOpen] = useState(false);

  // Auto-open when entering a trigger window and not yet surveyed
  useEffect(() => {
    if (user && cohortFor(user.dayInJourney) && !user.surveyed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user?.id, user?.surveyed, user?.dayInJourney]);

  if (hydrationError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-md border border-rose-500/30 bg-card p-6">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertOctagon className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Data unavailable</span>
          </div>
          <h1 className="mt-3 text-lg font-semibold tracking-tight">Couldn't load your data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn't reach the retention backend. Check your connection and retry.
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

  if (isHydrating || !user) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const cohort = cohortFor(user.dayInJourney);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-7 w-7 rounded-md bg-foreground" />
            <span className="text-sm font-semibold tracking-tight">Northwind</span>
            <span className="text-xs text-muted-foreground">/ Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><BarChart3 className="mr-1.5 h-4 w-4" /> PM view</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/team"><Users className="mr-1.5 h-4 w-4" /> Team</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/academy"><GraduationCap className="mr-1.5 h-4 w-4" /> Academy</Link>
            </Button>
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {user.name.split(" ").map((s) => s[0]).join("")}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <SimControls />

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.company} · Day {user.dayInJourney} of your trial
            </p>
          </div>
          {cohort && !user.surveyed && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              Open check-in
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Activity className="h-4 w-4" />} label="Workflows run" value="142" delta="+18%" />
          <StatCard icon={<Users className="h-4 w-4" />} label="Seats active" value={`${user.seatsActive} / 5`} delta={user.seatsActive >= 3 ? "+1" : "0"} />
          <StatCard icon={<Inbox className="h-4 w-4" />} label="Pending reviews" value="7" delta="-2" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Activity</h2>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </div>
            <SparkBars />
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">Next steps</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {["Connect your data source", "Invite 2 teammates", "Build your first report", "Schedule weekly digest"].map((t, i) => (
                <li key={t} className="flex items-center gap-2">
                  <span className={`h-4 w-4 rounded-full border ${i < 1 ? "border-foreground bg-foreground" : "border-border"}`} />
                  <span className={i < 1 ? "text-muted-foreground line-through" : "text-foreground"}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {cohort && (
        <CheckInWidget open={open} onOpenChange={setOpen} user={user} cohort={cohort} />
      )}
    </div>
  );
}