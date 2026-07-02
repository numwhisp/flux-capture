import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retention Engine — Prototype" },
      { name: "description", content: "In-app contextual check-ins that surface hidden churn drivers and trigger targeted interventions." },
      { property: "og:title", content: "Retention Engine — Reduce SaaS churn with contextual check-ins" },
      { property: "og:description", content: "A prototype testing whether 3-question check-ins at Day 14 and Day 45 can cut 90-day churn by 15%." },
      { property: "og:url", content: "https://flux-capture.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://flux-capture.lovable.app/" }],
  }),
  component: LandingPage,
});
