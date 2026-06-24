import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  actions,
  classifyFreeText,
  frictionLabel,
  interventionFor,
  interventionLabel,
  type Cohort,
  type FrictionType,
  type SimUser,
} from "@/lib/retention-store";
import {
  Calendar,
  GraduationCap,
  BadgePercent,
  LineChart,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: SimUser;
  cohort: Cohort;
}

type Q1 = "setup" | "value" | "team" | "price";

const Q1_OPTIONS: { id: Q1; label: string; friction: FrictionType }[] = [
  { id: "setup", label: "Stuck getting it configured", friction: "usability" },
  { id: "value", label: "Can't tell what changed for my team", friction: "value" },
  { id: "team", label: "My team hasn't adopted it", friction: "admin" },
  { id: "price", label: "Hard to justify the cost internally", friction: "admin" },
];

const Q2_BY_FRICTION: Record<FrictionType, string[]> = {
  usability: ["Onboarding checklist", "Connecting our data sources", "Inviting teammates", "Finding the right report"],
  value: ["Need ROI numbers", "Need a baseline comparison", "Need exec-ready summary", "Need usage trends"],
  admin: ["Need more seats", "Need procurement help", "Need a discount", "Need an SSO/security review"],
};

export function CheckInWidget({ open, onOpenChange, user, cohort }: Props) {
  const [step, setStep] = useState(0);
  const [q1, setQ1] = useState<Q1 | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState<{
    id: string;
    intervention: ReturnType<typeof interventionFor>;
  } | null>(null);

  useEffect(() => {
    if (open) {
      actions.recordImpression();
      setStep(0);
      setQ1(null);
      setQ2(null);
      setQ3(null);
      setFreeText("");
      setSubmitted(null);
    }
  }, [open]);

  const choiceFriction = useMemo<FrictionType | null>(
    () => (q1 ? Q1_OPTIONS.find((o) => o.id === q1)!.friction : null),
    [q1],
  );

  // Real-time LLM-stub classification of the free-text answer.
  const textFriction = useMemo(() => classifyFreeText(freeText), [freeText]);
  // Free-text classification overrides the click choice when it disagrees —
  // matches a real PM workflow where the qualitative answer is the signal.
  const finalFriction = textFriction ?? choiceFriction;

  function handleDismiss() {
    if (!submitted) actions.recordDismissal();
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!finalFriction || !q1 || !q2 || q3 === null) return;
    const intervention = interventionFor(finalFriction, cohort);
    const r = actions.submitResponse({
      userId: user.id,
      cohort,
      friction: finalFriction,
      q1: Q1_OPTIONS.find((o) => o.id === q1)!.label,
      q2,
      q3: `${q3}/10 likely to renew`,
      freeText,
      intervention,
      interventionAccepted: null,
    });
    setSubmitted({ id: r.id, intervention });
    setStep(3);
  }

  function handleIntervention(accepted: boolean) {
    if (!submitted) return;
    actions.acceptIntervention(submitted.id, accepted);
    onOpenChange(false);
  }

  if (!open) return null;

  const InterventionIcon =
    submitted?.intervention === "book_cs_call" ? Calendar
      : submitted?.intervention === "send_tutorial" ? GraduationCap
      : submitted?.intervention === "unlock_team_discount" ? BadgePercent
      : LineChart;

  return (
    <div
      role="dialog"
      aria-label="Quick check-in"
      className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] origin-bottom-right animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
    >
      <div className="overflow-hidden rounded-md border border-emerald-500/20 bg-card shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/10">
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cohort === "day14" ? "Day 14 check-in" : "Day 45 check-in"} · 30s
            </span>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close check-in"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {step < 3 && (
          <div className="px-4 pb-4 pt-3">
            <h3 className="text-sm font-semibold text-foreground">
              {cohort === "day14"
                ? `${user.name.split(" ")[0]} — how is week two going?`
                : `${user.name.split(" ")[0]} — where is this falling short?`}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Three quick questions. Your answer changes what shows up next.
            </p>

            {step === 0 && (
              <div className="mt-3 space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  1 / 3 · biggest friction
                </Label>
                {Q1_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setQ1(o.id); setStep(1); }}
                    className="w-full rounded-sm border border-border bg-background/40 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {step === 1 && choiceFriction && (
              <div className="mt-3 space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  2 / 3 · what specifically?
                </Label>
                {Q2_BY_FRICTION[choiceFriction].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setQ2(opt); setStep(2); }}
                    className="w-full rounded-sm border border-border bg-background/40 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    3 / 3 · renew likelihood (0–10)
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setQ3(i)}
                        className={`h-7 w-7 rounded-sm border text-[11px] font-semibold transition-colors ${
                          q3 === i
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                            : "border-border bg-background/40 text-foreground hover:bg-accent"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="freeText" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    In your own words (optional)
                  </Label>
                  <Textarea
                    id="freeText"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value.slice(0, 280))}
                    placeholder="One sentence is plenty."
                    className="mt-1.5 min-h-[64px] rounded-sm border-border bg-background/40 text-xs"
                  />
                  {textFriction && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      Auto-tagged as
                      <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
                        {frictionLabel(textFriction)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDismiss}>
                Not now
              </Button>
              {step === 2 && (
                <Button
                  size="sm"
                  className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                  onClick={handleSubmit}
                  disabled={q3 === null}
                >
                  Submit
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && submitted && (
          <div className="px-4 pb-4 pt-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Matched fast-track
              </span>
            </div>
            <div className="mt-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-500 text-emerald-950">
                  <InterventionIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {interventionLabel(submitted.intervention)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {submitted.intervention === "book_cs_call" && "A specialist walks through your setup live. Avg resolution: 12 min."}
                    {submitted.intervention === "send_tutorial" && "A 4-minute path to your first 'aha' — skips what you've done."}
                    {submitted.intervention === "unlock_team_discount" && "20% off additional seats for 90 days. Bring the team in."}
                    {submitted.intervention === "send_roi_report" && "Auto-generated ROI snapshot using your account data. Exec-ready."}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleIntervention(false)}>
                Maybe later
              </Button>
              <Button
                size="sm"
                className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                onClick={() => handleIntervention(true)}
              >
                Yes, do it
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}