import { createFileRoute } from "@tanstack/react-router";
import { FastTrackAcademyPage, FastTrackAcademyError } from "@/features/academy/FastTrackAcademyPage";

export const Route = createFileRoute("/_authenticated/dashboard/academy")({
  head: () => ({
    meta: [
      { title: "Fast-track academy — Retention Engine" },
      { name: "description", content: "Interactive setup checklist that closes the loop on Day 14 usability friction." },
      { property: "og:title", content: "Fast-track academy — Retention Engine" },
      { property: "og:description", content: "Interactive setup checklist that resolves Day 14 usability friction with a guided onboarding path." },
    ],
  }),
  component: FastTrackAcademyPage,
  errorComponent: FastTrackAcademyError,
});
