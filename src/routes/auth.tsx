import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/auth/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Retention Engine" },
      { name: "description", content: "Sign in or create an account to access the Retention Engine dashboard." },
    ],
  }),
  component: AuthPage,
});