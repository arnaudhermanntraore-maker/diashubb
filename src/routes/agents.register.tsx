import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agents/register")({
  beforeLoad: () => { throw redirect({ to: "/agency/register" }); },
});
