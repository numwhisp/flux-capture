import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retention Engine — Prototype" },
      { name: "description", content: "In-app contextual check-ins that surface hidden churn drivers and trigger targeted interventions." },
    ],
  }),
  component: LandingPage,
});
