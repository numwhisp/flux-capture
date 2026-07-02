import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Retention Engine" },
      { name: "description", content: "Sign in or create an account to access the Retention Engine dashboard." },
      { property: "og:title", content: "Sign in — Retention Engine" },
      { property: "og:description", content: "Access your Retention Engine workspace to review check-ins and interventions." },
      { property: "og:url", content: "https://flux-capture.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://flux-capture.lovable.app/auth" }],
  }),
  component: AuthPage,
});