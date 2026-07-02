import { useMemo } from "react";
import { actions, useRetentionStore } from "@/features/retention";

// The persona switcher is gone — the current user is whoever is signed in.
// This control now only lets a signed-in user jump their own journey day
// so they can test the Day 14 / Day 45 triggers.
export function SimControls() {
  const currentUserId = useRetentionStore((s) => s.currentUserId);
  const users = useRetentionStore((s) => s.users);
  const user = users.find((u) => u.id === currentUserId);
  if (!user) return null;
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sim controls · {user.name}
        </span>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Jump to day:</span>
          {[7, 14, 30, 45, 60].map((d) => (
            <button
              key={d}
              onClick={() => actions.setDay(user.id, d)}
              className={`rounded-md border px-2 py-1 font-medium transition-colors ${
                user.dayInJourney === d
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
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

export function SparkBars() {
  const bars = useMemo(() => Array.from({ length: 14 }, () => 20 + Math.random() * 80), []);
  return (
    <div className="mt-4 flex h-32 items-end gap-1.5">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-foreground/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}