import type { Metadata } from "next";
import { getCurrentProfile } from "@/actions/auth";
import Navbar from "@/components/layouts/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cotorra Analytics",
  description: "Rendimientos históricos de jugadores de Cotorra",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <html lang="es">
      <body>
        <Navbar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  );
}
