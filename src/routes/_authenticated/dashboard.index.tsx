import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/workspace/WorkspacePage";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "User dashboard — Retention Engine" },
      { name: "description", content: "Simulated B2B SaaS dashboard that triggers a contextual check-in at Day 14 and Day 45." },
      { property: "og:title", content: "User dashboard — Retention Engine" },
      { property: "og:description", content: "Simulated B2B SaaS workspace where Day 14 and Day 45 contextual check-ins fire and interventions are accepted." },
    ],
  }),
  component: WorkspacePage,
});