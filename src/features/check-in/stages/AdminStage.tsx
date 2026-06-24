import { Button } from "@/components/ui/button";
import { Download, FileText, Users } from "lucide-react";

export function AdminStage({
  generating, onAccept, onDecline,
}: { generating: boolean; onAccept: () => void; onDecline: () => void }) {
  // Admin friction → ROI Snapshot Report with progress loader + download.
  return (
    <>
      <div className="mt-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <FileText className="h-3.5 w-3.5 text-emerald-400" /> Generated ROI Snapshot · PDF
        </div>
        <div className="mt-2.5 space-y-1.5 text-[11px] text-muted-foreground">
          <RoiRow label="Hours saved / week" value="14.2h" />
          <RoiRow label="Workflows automated" value="142" />
          <RoiRow label="Est. payback" value="38 days" />
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-muted">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: generating ? "62%" : "100%" }} />
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {generating ? "Compiling account data…" : "Ready to download"}
        </div>
      </div>

      <div className="mt-2 rounded-sm border border-border bg-background/30 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Users className="h-3.5 w-3.5 text-emerald-400" /> + Team-seat workspace unlocked
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          20% off additional seats for 90 days, ready to share with finance.
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onDecline}>Maybe later</Button>
        <Button
          size="sm"
          className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
          onClick={onAccept}
          disabled={generating}
        >
          <Download className="mr-1 h-3 w-3" /> Open team workspace
        </Button>
      </div>
    </>
  );
}

function RoiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}