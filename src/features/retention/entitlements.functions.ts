import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Server-side entitlement writer. Users cannot self-grant via RLS anymore;
// this validates the caller then performs the upsert with admin rights.
export const activateTeamDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_entitlements")
      .upsert(
        {
          user_id: context.userId,
          team_discount_activated: true,
          discount_activated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });