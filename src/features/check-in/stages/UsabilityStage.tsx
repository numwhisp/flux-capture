import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, GraduationCap, Loader2 } from "lucide-react";
import type { Cohort } from "@/features/retention";

export function UsabilityStage({
  generating, cohort, onAccept, onDecline,
}: { generating: boolean; cohort: Cohort; onAccept: () => void; onDecline: () => void }) {
  const [slot, setSlot] = useState<string | null>(null);
  const slots = ["Today 3:30pm", "Today 5:00pm", "Tomorrow 9:15am", "Tomorrow 11:00am"];
  return (
    <>
      <div className="mt-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Book an instant setup call · 15 min
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`rounded-sm border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                slot === s
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-border bg-background/40 text-foreground hover:border-emerald-500/40"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="mt-2 rounded-sm border border-border bg-background/30 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
          {cohort === "day14" ? "Fast-track tutorial" : "Skip-ahead tutorial"}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          {generating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
              <span className="text-muted-foreground">Generating your custom link…</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300">Link ready · 4 min · skips what you've done</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onDecline}>Maybe later</Button>
        <Button
          size="sm"
          className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
          onClick={onAccept}
          disabled={generating}
        >Open fast-track tutorial</Button>
      </div>
    </>
  );
}