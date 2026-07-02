import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  actions,
  classifyFreeText,
  frictionLabel,
  resolveInterventionFromRules,
  useRetentionStore,
  type Cohort,
  type FrictionType,
  type SimUser,
} from "@/features/retention";
import { Loader2, Sparkles, X, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { getAnalyzeLatencyMs, getQ1Options, getQ2Options } from "./questions";
import { PostSubmissionIntervention } from "./PostSubmissionIntervention";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: SimUser;
  cohort: Cohort;
}

/**
 * Screen 3 — In-product Check-In Widget. Slide-out 3-question survey:
 * picks a friction bucket, collects free-text, runs the classifier, then
 * hands off to <PostSubmissionIntervention /> for the branched CTA.
 */
export function CheckInWidget({ open, onOpenChange, user, cohort }: Props) {
  const [step, setStep] = useState(0);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState<{
    id: string;
    intervention: ReturnType<typeof resolveInterventionFromRules>;
  } | null>(null);
  // Analyzing phase: between Submit click and the post-submission intervention,
  // we freeze the form and run a skeleton so the regex categorizer has a
  // visible "thinking" beat. Pure UX latency — categorization is sync.
  const [analyzing, setAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  // DB-driven survey config (with hardcoded fallback during first paint).
  const surveyQuestions = useRetentionStore((s) => s.surveyQuestions);
  const interventionRules = useRetentionStore((s) => s.interventionRules);
  const analyzeLatencyMs = useRetentionStore(getAnalyzeLatencyMs);
  const q1Options = useMemo(() => getQ1Options(surveyQuestions), [surveyQuestions]);

  useEffect(() => {
    if (open) {
      actions.recordImpression();
      setStep(0); setQ1(null); setQ2(null); setQ3(null);
      setFreeText(""); setSubmitted(null); setAnalyzing(false); setSubmitError(null);
    }
  }, [open]);

  const choiceFriction = useMemo<FrictionType | null>(
    () => (q1 ? q1Options.find((o) => o.id === q1)?.friction ?? null : null),
    [q1, q1Options],
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
    setAnalyzing(true);
    setSubmitError(null);
    window.setTimeout(async () => {
      const intervention = resolveInterventionFromRules(interventionRules, finalFriction, cohort);
      try {
        const r = await actions.submitResponse({
          userId: user.id,
          cohort,
          friction: finalFriction,
          q1: q1Options.find((o) => o.id === q1)?.label ?? q1,
          q2,
          q3: `${q3}/10 likely to renew`,
          freeText,
          intervention,
          interventionAccepted: null,
        });
        setSubmitted({ id: r.id, intervention });
        setAnalyzing(false);
        setStep(3);
      } catch (err) {
        // Preserve typed input + selections so the user can retry immediately.
        const msg = err instanceof Error ? err.message : String(err);
        setSubmitError(msg);
        setAnalyzing(false);
        toast.error("Couldn't submit your check-in", { description: msg });
      }
    }, analyzeLatencyMs);
  }

  function handleIntervention(accepted: boolean) {
    if (!submitted) return;
    actions.acceptIntervention(submitted.id, accepted);
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Quick check-in"
      className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] origin-bottom-right animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
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
                {q1Options.map((o) => (
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
                {getQ2Options(surveyQuestions, choiceFriction).map((opt) => (
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
                    disabled={analyzing}
                    className="mt-1.5 min-h-[64px] rounded-sm border-border bg-background/40 text-xs disabled:opacity-60"
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
                {analyzing && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing friction markers…
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="h-2 w-5/6 animate-pulse rounded-sm bg-emerald-500/20" />
                      <div className="h-2 w-2/3 animate-pulse rounded-sm bg-emerald-500/15" />
                      <div className="h-2 w-3/4 animate-pulse rounded-sm bg-emerald-500/10" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDismiss} disabled={analyzing}>
                Not now
              </Button>
              {step === 2 && (
                <Button
                  size="sm"
                  className="h-7 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                  onClick={handleSubmit}
                  disabled={q3 === null || analyzing}
                >
                  {analyzing ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
                    </span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && submitted && (
          <PostSubmissionIntervention
            friction={submitted.intervention === "book_cs_call" || submitted.intervention === "send_tutorial" ? "usability"
              : submitted.intervention === "unlock_team_discount" ? "admin" : "value"}
            cohort={cohort}
            onAccept={() => {
              handleIntervention(true);
              if (submitted.intervention === "send_tutorial" || submitted.intervention === "book_cs_call") {
                navigate({ to: "/dashboard/academy" });
              } else if (submitted.intervention === "unlock_team_discount") {
                actions.acceptTeamDiscount();
                navigate({ to: "/dashboard/team" });
              }
            }}
            onDecline={() => handleIntervention(false)}
          />
        )}
      </div>
    </div>
  );
}