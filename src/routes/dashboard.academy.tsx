import { createFileRoute } from "@tanstack/react-router";
import { FastTrackAcademyPage, FastTrackAcademyError } from "@/features/academy/FastTrackAcademyPage";

export const Route = createFileRoute("/dashboard/academy")({
  head: () => ({
    meta: [
      { title: "Fast-track academy — Retention Engine" },
      { name: "description", content: "Interactive setup checklist that closes the loop on Day 14 usability friction." },
    ],
  }),
  component: FastTrackAcademyPage,
  errorComponent: FastTrackAcademyError,
});
