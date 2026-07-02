import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";

type Mode = "signin" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName || email.split("@")[0],
              company,
              product_role: "Member",
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr(result.error instanceof Error ? result.error.message : String(result.error));
      setBusy(false);
      return;
    }
    if (result.redirected) return; // browser is navigating away
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-emerald-500/20 bg-card p-6 shadow-2xl shadow-emerald-500/5">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500 text-emerald-950">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">retention.engine</span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "signin"
            ? "Access your workspace and check-ins."
            : "New accounts start as end users. Admins are granted separately."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="display_name" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Display name
                </Label>
                <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label htmlFor="company" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input id="password" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-8 text-xs" />
          </div>

          {err && <p className="text-[11px] text-rose-300">{err}</p>}

          <Button
            type="submit"
            disabled={busy}
            aria-label={mode === "signin" ? "Sign in" : "Create account"}
            className="h-8 w-full bg-emerald-500 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={google} disabled={busy} className="h-8 w-full text-xs">
          Continue with Google
        </Button>

        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
          className="mt-4 w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}