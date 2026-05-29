"use client";

import { signOut } from "@/actions/auth";
import { Profile } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SoccerBallIcon } from "@/components/Icons";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      style={{
        background: "rgba(4, 9, 6, 0.92)",
        borderBottom: "1px solid #1c3828",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.25rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <SoccerBallIcon
            size="1.6rem"
            style={{
              color: "#00e676",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.08em",
              color: "#e4f0e8",
              lineHeight: 1,
            }}
          >
            COTORRA ANALYTICS
            <span style={{ color: "#00e676" }}>.</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {profile ? (
            <>
              <NavLink href="/history" active={isActive("/history")}>
                Histórico
              </NavLink>
              <NavLink href="/dashboard" active={isActive("/dashboard")}>
                Votación
              </NavLink>
              {profile.role === "admin" && (
                <NavLink href="/admin" active={isActive("/admin")}>
                  Admin
                </NavLink>
              )}

              {/* Divider */}
              <div
                style={{
                  width: "1px",
                  height: "24px",
                  background: "#1c3828",
                  margin: "0 0.5rem",
                }}
              />

              {/* User badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "rgba(0, 230, 118, 0.15)",
                    border: "1px solid rgba(0, 230, 118, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "0.9rem",
                    color: "#00e676",
                    flexShrink: 0,
                  }}
                >
                  {profile.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    letterSpacing: "0.06em",
                    color: "#a0c4ac",
                  }}
                >
                  {profile.username}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  marginLeft: "0.25rem",
                  background: "transparent",
                  color: "#ff5252",
                  border: "1px solid rgba(255, 82, 82, 0.4)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255, 82, 82, 0.12)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#ff5252";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255, 82, 82, 0.4)";
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink href="/auth/login" active={isActive("/auth/login")}>
                Ingresar
              </NavLink>
              <Link
                href="/auth/register"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  background: "#00e676",
                  color: "#040a06",
                  padding: "0.35rem 0.9rem",
                  borderRadius: "5px",
                  marginLeft: "0.25rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "#1ded87";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "0 0 16px rgba(0,230,118,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "#00e676";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "none";
                }}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: active ? 700 : 500,
        fontSize: "0.85rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: active ? "#00e676" : "#7aaa8a",
        padding: "0.3rem 0.75rem",
        borderRadius: "5px",
        background: active ? "rgba(0, 230, 118, 0.08)" : "transparent",
        transition: "all 0.18s ease",
        position: "relative",
      }}
    >
      {children}
      {active && (
        <span
          style={{
            position: "absolute",
            bottom: "-1px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "2px",
            background: "#00e676",
            borderRadius: "2px",
          }}
        />
      )}
    </Link>
  );
}
