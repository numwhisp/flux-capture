import { useMemo } from "react";
import { actions, useRetentionStore } from "@/features/retention";

export function SimControls() {
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