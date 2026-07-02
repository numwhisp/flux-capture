import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/workspace/WorkspacePage";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "User dashboard — Retention Engine" },
      { name: "description", content: "Simulated B2B SaaS dashboard that triggers a contextual check-in at Day 14 and Day 45." },
    ],
  }),
  component: WorkspacePage,
});