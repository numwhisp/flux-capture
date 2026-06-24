import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { frictionLabel, type Cohort, type FrictionType } from "@/features/retention";
import { UsabilityStage } from "./stages/UsabilityStage";
import { AdminStage } from "./stages/AdminStage";
import { ValueStage } from "./stages/ValueStage";

/**
 * Screen 4 — Post-Submission Intervention. Branches on classified friction:
 * Usability → academy/CS call, Value → ROI snapshot, Admin → team workspace.
 */
export function PostSubmissionIntervention({
  friction, cohort, onAccept, onDecline,
}: {
  friction: FrictionType;
  cohort: Cohort;
  onAccept: () => void;
  onDecline: () => void;
}) {
  // Simulate API generation latency for the personalised asset.
  const [generating, setGenerating] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          Matched fast-track · {frictionLabel(friction)}
        </span>
      </div>

      {friction === "usability" && (
        <UsabilityStage generating={generating} cohort={cohort} onAccept={onAccept} onDecline={onDecline} />
      )}
      {friction === "admin" && (
        <AdminStage generating={generating} onAccept={onAccept} onDecline={onDecline} />
      )}
      {friction === "value" && (
        <ValueStage generating={generating} onAccept={onAccept} onDecline={onDecline} />
      )}
    </div>
  );
}