import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  actions,
  interventionFor,
  interventionLabel,
  type Cohort,
  type FrictionType,
  type SimUser,
} from "@/lib/retention-store";
import { Calendar, GraduationCap, BadgePercent, LineChart, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: SimUser;
  cohort: Cohort;
}

type Q1 = "setup" | "value" | "team" | "price";

const Q1_OPTIONS: { id: Q1; label: string; friction: FrictionType }[] = [
  { id: "setup", label: "I'm stuck getting it configured", friction: "usability" },
  { id: "value", label: "I can't tell what changed for my team", friction: "value" },
  { id: "team", label: "My team hasn't adopted it", friction: "admin" },
  { id: "price", label: "Hard to justify the cost internally", friction: "admin" },
];

const Q2_BY_FRICTION: Record<FrictionType, string[]> = {
  usability: ["Onboarding checklist", "Connecting our data sources", "Inviting teammates", "Finding the right report"],
  value: ["Need ROI numbers", "Need a baseline comparison", "Need exec-ready summary", "Need usage trends"],
  admin: ["Need more seats", "Need procurement help", "Need a discount", "Need an SSO/security review"],
};

export function CheckInModal({ open, onOpenChange, user, cohort }: Props) {
  const [step, setStep] = useState(0);
  const [q1, setQ1] = useState<Q1 | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState<{ id: string; intervention: ReturnType<typeof interventionFor> } | null>(null);

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

  const friction = useMemo<FrictionType | null>(() => {
    return q1 ? Q1_OPTIONS.find((o) => o.id === q1)!.friction : null;
  }, [q1]);

  function handleDismiss() {
    if (!submitted) actions.recordDismissal();
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!friction || !q1 || !q2 || q3 === null) return;
    const intervention = interventionFor(friction, cohort);
    const r = actions.submitResponse({
      userId: user.id,
      cohort,
      friction,
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

  const InterventionIcon =
    submitted?.intervention === "book_cs_call" ? Calendar
      : submitted?.intervention === "send_tutorial" ? GraduationCap
      : submitted?.intervention === "unlock_team_discount" ? BadgePercent
      : LineChart;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleDismiss() : onOpenChange(v))}>
      <DialogContent className="sm:max-w-md">
        {step < 3 && (
          <>
            <DialogHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Quick check-in · {cohort === "day14" ? "Day 14" : "Day 45"} · 30 seconds
              </div>
              <DialogTitle className="text-lg">
                {cohort === "day14"
                  ? `Hey ${user.name.split(" ")[0]} — how is week two going?`
                  : `${user.name.split(" ")[0]}, where is this falling short?`}
              </DialogTitle>
              <DialogDescription>
                Three quick questions. Your answer changes what shows up next.
              </DialogDescription>
            </DialogHeader>

            {step === 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  1 / 3 — What's the biggest friction right now?
                </Label>
                {Q1_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setQ1(o.id); setStep(1); }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-accent"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {step === 1 && friction && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  2 / 3 — What specifically?
                </Label>
                {Q2_BY_FRICTION[friction].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setQ2(opt); setStep(2); }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-accent"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    3 / 3 — How likely are you to renew today? (0–10)
                  </Label>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setQ3(i)}
                        className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                          q3 === i
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background text-foreground hover:bg-accent"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="freeText" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Anything else? (optional)
                  </Label>
                  <Textarea
                    id="freeText"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value.slice(0, 280))}
                    placeholder="One sentence is plenty."
                    className="mt-2 min-h-[72px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex sm:justify-between gap-2">
              <Button variant="ghost" onClick={handleDismiss}>Not now</Button>
              {step === 2 && (
                <Button onClick={handleSubmit} disabled={q3 === null}>
                  Submit
                </Button>
              )}
            </DialogFooter>
          </>
        )}

        {step === 3 && submitted && (
          <>
            <DialogHeader>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-center text-lg">Got it — here's what we can do right now</DialogTitle>
              <DialogDescription className="text-center">
                Based on your answer we matched a fast-track for you.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <InterventionIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {interventionLabel(submitted.intervention)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {submitted.intervention === "book_cs_call" && "A specialist walks through your setup live. Average resolution: 12 minutes."}
                    {submitted.intervention === "send_tutorial" && "A 4-minute path to your first 'aha' — skips everything you've already done."}
                    {submitted.intervention === "unlock_team_discount" && "20% off additional seats for 90 days. Helps you bring the whole team in."}
                    {submitted.intervention === "send_roi_report" && "We'll auto-generate an ROI snapshot using your account data. Exec-ready."}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex sm:justify-between gap-2">
              <Button variant="ghost" onClick={() => handleIntervention(false)}>Maybe later</Button>
              <Button onClick={() => handleIntervention(true)}>Yes, do it</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}