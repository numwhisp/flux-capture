import { Button } from "@/components/ui/button";
import { Download, LineChart } from "lucide-react";

export function ValueStage({
  generating, onAccept, onDecline,
}: { generating: boolean; onAccept: () => void; onDecline: () => void }) {
  return (
    <>
      <div className="mt-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <LineChart className="h-3.5 w-3.5 text-emerald-400" /> Exec-ready ROI snapshot
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-sm bg-muted">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: generating ? "70%" : "100%" }} />
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {generating ? "Calculating baseline delta…" : "Snapshot ready"}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onDecline}>Maybe later</Button>
        <Button
          size="sm"
          className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
          onClick={onAccept}
          disabled={generating}
        >
          <Download className="mr-1 h-3 w-3" /> Download snapshot
        </Button>
      </div>
    </>
  );
}