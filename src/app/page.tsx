"use client";

import { getCurrentProfile } from "@/actions/auth";
import { getActiveSessions } from "@/actions/sessions";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function HomePage() {
  useEffect(() => {
    async function checkRedirect() {
      const [profile, activeSessions] = await Promise.all([
        getCurrentProfile(),
        getActiveSessions(),
      ]);

      if (!profile) {
        redirect("/auth/login");
      }

      if (activeSessions.length > 0 && profile.role === "player") {
        // Check if player has pending votes
        redirect("/dashboard");
      } else {
        redirect("/history");
      }
    }

    checkRedirect();
  }, []);

  return <div className="text-center py-8">Redirecting...</div>;
}
