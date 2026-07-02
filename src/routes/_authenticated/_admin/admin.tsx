import { createFileRoute } from "@tanstack/react-router";
import { AdminAnalyticsPage } from "@/features/admin/AdminAnalyticsPage";

export const Route = createFileRoute("/_authenticated/_admin/admin")({
  head: () => ({
    meta: [
      { title: "PM analytics — Retention Engine" },
      { name: "description", content: "Live friction tagging, intervention conversion, kill-switch monitor, and simulated 90-day retention curve." },
    ],
  }),
  component: AdminAnalyticsPage,
});
