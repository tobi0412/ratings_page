"use client";

import { signOut } from "@/actions/auth";
import { Profile } from "@/types";
import Link from "next/link";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          ⚽ Ratings
        </Link>

        <div className="flex gap-6 items-center">
          {profile ? (
            <>
              <Link href="/history" className="hover:text-gray-300">
                Histórico
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300">
                Votación
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className="hover:text-gray-300 font-bold">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm">{profile.username}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-gray-300">
                Sign In
              </Link>
              <Link href="/auth/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
