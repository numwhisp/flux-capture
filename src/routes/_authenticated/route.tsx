import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedHeader } from "@/features/auth/AuthenticatedHeader";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { userId: data.user.id, email: data.user.email ?? "" };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthenticatedHeader />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}