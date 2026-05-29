import type { Metadata } from "next";
import { getCurrentProfile } from "@/actions/auth";
import Navbar from "@/components/layouts/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Team Ratings",
  description: "Peer evaluation system for football teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Navbar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  );
}
