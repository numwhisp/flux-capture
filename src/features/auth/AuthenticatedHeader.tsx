import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Zap, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

async function fetchHeaderData() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name, company").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name || user.email?.split("@")[0] || "Member",
    company: profile?.company || "",
    isAdmin,
  };
}

export function AuthenticatedHeader() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["auth-header"], queryFn: fetchHeaderData, staleTime: 30_000 });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-500 text-emerald-950">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight">retention.engine</span>
        </Link>
        <div className="flex items-center gap-3">
          {data?.isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/20"
            >
              <ShieldCheck className="h-3 w-3" /> Admin
            </Link>
          )}
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[11px] font-semibold text-foreground">{data?.displayName ?? "…"}</span>
            <span className="text-[10px] text-muted-foreground">{data?.company || data?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-7 px-2 text-[11px]">
            <LogOut className="mr-1 h-3 w-3" /> Log out
          </Button>
        </div>
      </div>
    </div>
  );
}