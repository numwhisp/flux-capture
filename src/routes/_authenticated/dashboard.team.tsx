import { createFileRoute } from "@tanstack/react-router";
import { TeamWorkspacePage } from "@/features/team/TeamWorkspacePage";

export const Route = createFileRoute("/_authenticated/dashboard/team")({
  head: () => ({
    meta: [
      { title: "Team seats — Retention Engine" },
      { name: "description", content: "Activate the triggered team discount and invite teammates to close the seat-stagnation loop." },
    ],
  }),
  component: TeamWorkspacePage,
});
