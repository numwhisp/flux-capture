import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckInWidget } from "@/components/CheckInWidget";
import { actions, useRetentionStore, type Cohort } from "@/lib/retention-store";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, BarChart3, Bell, Inbox, Users, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "User dashboard — Retention Engine" },
      { name: "description", content: "Simulated B2B SaaS dashboard that triggers a contextual check-in at Day 14 and Day 45." },
    ],
  }),
  component: DashboardRoute,
});

function cohortFor(day: number): Cohort | null {
  if (day >= 13 && day <= 16) return "day14";
  if (day >= 44 && day <= 47) return "day45";
  return null;
}

function DashboardRoute() {
  const users = useRetentionStore((s) => s.users);
  const currentUserId = useRetentionStore((s) => s.currentUserId);
  const user = users.find((u) => u.id === currentUserId) ?? users[0];
  const cohort = cohortFor(user.dayInJourney);
  const [open, setOpen] = useState(false);

  // Auto-open when entering a trigger window and not yet surveyed
  useEffect(() => {
    if (cohort && !user.surveyed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [cohort, user.surveyed, user.id]);

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

function SimControls() {
  const users = useRetentionStore((s) => s.users);
  const currentUserId = useRetentionStore((s) => s.currentUserId);
  const user = users.find((u) => u.id === currentUserId) ?? users[0];
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sim controls</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => actions.setCurrentUser(u.id)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                u.id === currentUserId ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-accent"
              }`}
            >
              {u.name.split(" ")[0]} · D{u.dayInJourney}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Jump:</span>
          {[7, 14, 30, 45, 60].map((d) => (
            <button
              key={d}
              onClick={() => actions.setDay(user.id, d)}
              className="rounded-md border border-border bg-background px-2 py-1 font-medium hover:bg-accent"
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className="text-xs font-medium text-emerald-600">{delta}</span>
      </div>
    </div>
  );
}

function SparkBars() {
  const bars = useMemo(() => Array.from({ length: 14 }, () => 20 + Math.random() * 80), []);
  return (
    <div className="mt-4 flex h-32 items-end gap-1.5">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-foreground/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}