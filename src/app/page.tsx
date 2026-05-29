import { getCurrentProfile } from "@/actions/auth";
import { getActiveSessions } from "@/actions/sessions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const [profile, activeSessions] = await Promise.all([
    getCurrentProfile(),
    getActiveSessions(),
  ]);

  if (!profile) {
    redirect("/auth/login");
  }

  if (
    activeSessions.length > 0 &&
    (profile.role === "player" || profile.role === "admin") &&
    profile.status === "approved"
  ) {
    redirect("/dashboard");
  } else {
    redirect("/history");
  }
}
