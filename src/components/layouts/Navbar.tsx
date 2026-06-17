"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/actions/auth";
import { Profile } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CotorraLogoIcon } from "@/components/Icons";
import { FEATURE_FLAGS } from "@/config/features";
import WalletIndicator from "@/modules/economy/components/WalletIndicator";
import PlayerAvatar from "@/components/profile/PlayerAvatar";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, [dropdownOpen]);

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
        className="px-3 sm:px-5"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
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
          <CotorraLogoIcon
            size="1.85rem"
            style={{
              display: "inline-block",
            }}
          />
          {/* Desktop & Tablet: COTORRA ANALYTICS. */}
          <span
            className="hidden md:inline-block"
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
          {/* Small tablets: COTORRA. */}
          <span
            className="hidden sm:inline-block md:hidden"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.08em",
              color: "#e4f0e8",
              lineHeight: 1,
            }}
          >
            COTORRA
            <span style={{ color: "#00e676" }}>.</span>
          </span>
        </Link>

        {/* Nav links */}
        <div
          className="gap-1 sm:gap-2"
          style={{ display: "flex", alignItems: "center" }}
        >
          {profile ? (
            <>
              <NavLink href="/latest" active={isActive("/latest")} mobileText="Última">
                Última sesión
              </NavLink>
              <NavLink href="/history" active={isActive("/history")}>
                Histórico
              </NavLink>
              <NavLink href="/dashboard" active={isActive("/dashboard")}>
                Votación
              </NavLink>
              {FEATURE_FLAGS.IS_CURRENCY_ENABLED && (
                <>
                  <NavLink href="/bets" active={isActive("/bets")}>
                    Apuestas
                  </NavLink>
                  <NavLink href="/shop" active={isActive("/shop")}>
                    Tienda
                  </NavLink>
                </>
              )}

              {/* Divider */}
              <div
                className="hidden sm:block"
                style={{
                  width: "1px",
                  height: "24px",
                  background: "#1c3828",
                  margin: "0 0.5rem",
                }}
              />

              <WalletIndicator playerId={profile.id} />

              {/* User badge with Dropdown */}
              <div
                style={{ position: "relative" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
              >
                <div
                  className="gap-1 sm:gap-2.5"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px",
                    transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                      e.currentTarget.style.background = "rgba(28, 56, 40, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <PlayerAvatar
                    playerId={profile.id}
                    avatarUrl={profile.avatar_url}
                    username={profile.username}
                    size={30}
                  />
                  <span
                    className="hidden sm:inline-block"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      letterSpacing: "0.06em",
                      color: "#a0c4ac",
                      userSelect: "none",
                    }}
                  >
                    {profile.username}
                  </span>
                  <span style={{ color: "#3d6e50", fontSize: "0.75rem", display: "inline-block", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 180ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
                    ▼
                  </span>
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "rgba(6, 13, 9, 0.96)",
                      border: "1px solid #1c3828",
                      borderRadius: "8px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                      backdropFilter: "blur(12px)",
                      padding: "0.5rem 0",
                      minWidth: "140px",
                      display: "flex",
                      flexDirection: "column",
                      zIndex: 200,
                      animation: "slideDown 0.15s ease-out forwards",
                    }}
                  >
                    <style>{`
                      @keyframes slideDown {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        padding: "0.6rem 1rem",
                        color: isActive("/profile") ? "#00e676" : "#a0c4ac",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        textAlign: "left",
                        transition: "color 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                      }}
                      onMouseEnter={(e) => {
                        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                          e.currentTarget.style.background = "rgba(0, 230, 118, 0.08)";
                          e.currentTarget.style.color = "#00e676";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = isActive("/profile") ? "#00e676" : "#a0c4ac";
                      }}
                    >
                      Perfil
                    </Link>
                    {profile.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                         style={{
                          padding: "0.6rem 1rem",
                          color: isActive("/admin") ? "#00e676" : "#a0c4ac",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          textAlign: "left",
                          transition: "color 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                        }}
                        onMouseEnter={(e) => {
                          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                            e.currentTarget.style.background = "rgba(0, 230, 118, 0.08)";
                            e.currentTarget.style.color = "#00e676";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = isActive("/admin") ? "#00e676" : "#a0c4ac";
                        }}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignOut();
                      }}
                      style={{
                        padding: "0.6rem 1rem",
                        background: "transparent",
                        border: "none",
                        color: "#ff5252",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        textAlign: "left",
                        cursor: "pointer",
                        width: "100%",
                        transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                      }}
                      onMouseEnter={(e) => {
                        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                          e.currentTarget.style.background = "rgba(255, 82, 82, 0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Salir
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink href="/auth/login" active={isActive("/auth/login")}>
                Ingresar
              </NavLink>
              <Link
                href="/auth/register"
                className="text-[0.72rem] sm:text-[0.82rem] px-2 sm:px-3.5 py-1.5 sm:py-1.5"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  background: "#00e676",
                  color: "#040a06",
                  borderRadius: "5px",
                  marginLeft: "0.25rem",
                  transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1), transform 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
                onMouseEnter={(e) => {
                  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "#1ded87";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 0 16px rgba(0,230,118,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "#00e676";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                    "none";
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "scale(0.96)";
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "none";
                }}
                onTouchStart={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "scale(0.96)";
                }}
                onTouchEnd={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "none";
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
  mobileText,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  mobileText?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: active ? 700 : 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: active ? "#00e676" : "#7aaa8a",
        background: active ? "rgba(0, 230, 118, 0.08)" : "transparent",
        transition: "color 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
        position: "relative",
      }}
      className="text-[0.75rem] sm:text-[0.85rem] px-2 sm:px-3 py-1.5 sm:py-1 rounded-[5px]"
    >
      <span className={mobileText ? "hidden sm:inline" : "inline"}>
        {children}
      </span>
      {mobileText && (
        <span className="inline sm:hidden">
          {mobileText}
        </span>
      )}
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
