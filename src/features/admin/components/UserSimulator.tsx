import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play } from "lucide-react";
import { actions } from "@/features/retention";

export function UserSimulator({
  ignoreMode, killSwitch, engagementRate, killSwitchThreshold = 0.10,
}: { ignoreMode: boolean; killSwitch: boolean; engagementRate: number; killSwitchThreshold?: number }) {
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
            the kill switch trips when engagement collapses below {Math.round(killSwitchThreshold * 100)}%.
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
        <Button size="sm" className="h-8 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          onClick={() => actions.simulateSessions(100)}>
          Run 100 sessions
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => actions.simulateSessions(25)}>+25</Button>
        <Button variant="outline" size="sm" className="h-8" onClick={() => actions.simulateSessions(10)}>+10</Button>
        <div className="ml-auto text-xs text-muted-foreground">
          Engagement now: <span className={`font-semibold ${killSwitch ? "text-rose-300" : "text-emerald-300"}`}>
            {Math.round(engagementRate * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}