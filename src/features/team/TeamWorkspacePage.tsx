import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { actions, useRetentionStore } from "@/features/retention";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BadgePercent, X, Users, Check, Sparkles } from "lucide-react";

const SEAT_CAP = 5;

// Screen 6 — Team Workspace cohort rollup.
export function TeamWorkspacePage() {
  const invites = useRetentionStore((s) => s.invites);
  const activated = useRetentionStore((s) => s.teamDiscountActivated);
  const users = useRetentionStore((s) => s.users);
  const currentUserId = useRetentionStore((s) => s.currentUserId);
  const user = users.find((u) => u.id === currentUserId) ?? users[0];

  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const activeSeats = user.seatsActive + invites.filter((i) => i.status === "accepted").length;
  const allocPct = Math.min(100, ((activeSeats + invites.length) / SEAT_CAP) * 100);

  function commit(value: string) {
    const email = value.trim().replace(/[,;]$/, "");
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid work email");
      return;
    }
    if (invites.some((i) => i.email === email)) {
      setErr("Already invited");
      return;
    }
    actions.inviteTeammate(email);
    setDraft("");
    setErr(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-semibold tracking-tight">Team & seats</span>
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Admin friction · workspace
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bring the team in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You were flagged for team-seat stagnation. Activate your triggered discount and invite the people who'd unlock value.
          </p>
        </div>

        <div className={`rounded-sm border bg-card p-5 transition-colors ${activated ? "border-emerald-500/40" : "border-amber-500/30"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-sm ${activated ? "bg-emerald-500 text-emerald-950" : "bg-amber-400 text-amber-950"}`}>
                <BadgePercent className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">20% off additional seats · 90 days</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Triggered from your Day {user.dayInJourney} check-in. Auto-applies at checkout — no procurement back-and-forth.
                </p>
              </div>
            </div>
            {activated ? (
              <span className="flex items-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <Check className="h-3 w-3" /> Activated
              </span>
            ) : (
              <Button
                size="sm"
                className="h-8 bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                onClick={() => actions.acceptTeamDiscount()}
              >
                Activate discount
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-3">
            <h2 className="text-sm font-semibold">Invite teammates</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste emails — press Enter, comma, or space to add. They get the discounted seat link.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-sm border border-border bg-background/40 p-2">
              {invites.map((i) => (
                <span
                  key={i.email}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-200"
                >
                  {i.email}
                  <button
                    onClick={() => actions.removeInvite(i.email)}
                    className="text-emerald-300/70 hover:text-emerald-200"
                    aria-label={`Remove ${i.email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <Input
                value={draft}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/[\s,;]$/.test(v)) commit(v); else { setDraft(v); setErr(null); }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commit(draft); }
                  if (e.key === "Backspace" && !draft && invites.length) {
                    actions.removeInvite(invites[invites.length - 1].email);
                  }
                }}
                onBlur={() => draft && commit(draft)}
                placeholder={invites.length ? "Add another…" : "alex@company.com"}
                className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            {err && <p className="mt-1.5 text-[11px] text-rose-300">{err}</p>}

            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              {invites.length === 0 && "No invites yet — accounts with 3+ seats churn 4× less."}
              {invites.length > 0 && `${invites.length} pending · discount auto-applied`}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Seat allocation</h2>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums">{activeSeats}</span>
              <span className="text-sm text-muted-foreground">/ {SEAT_CAP} seats</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-sm bg-muted">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(activeSeats / SEAT_CAP) * 100}%` }} />
              <div className="-mt-2 h-full bg-amber-400/60" style={{ width: `${allocPct - (activeSeats / SEAT_CAP) * 100}%`, marginLeft: `${(activeSeats / SEAT_CAP) * 100}%` }} />
            </div>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <SeatRow label="Active now" value={String(activeSeats)} tone="emerald" />
              <SeatRow label="Pending invites" value={String(invites.length)} tone="amber" />
              <SeatRow label="Available" value={String(Math.max(0, SEAT_CAP - activeSeats - invites.length))} tone="muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatRow({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "muted" }) {
  const dot = tone === "emerald" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-400" : "bg-muted-foreground/40";
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-sm ${dot}`} /> {label}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}