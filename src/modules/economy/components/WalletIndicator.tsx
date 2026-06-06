"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { getWalletBalance } from "../services/wallet";
import { FEATURE_FLAGS } from "@/config/features";

interface WalletIndicatorProps {
  playerId: string;
}

export default function WalletIndicator({ playerId }: WalletIndicatorProps) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) return;

    // Fetch initial balance
    async function loadBalance() {
      try {
        const data = await getWalletBalance(playerId);
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
      } catch (err) {
        console.error("Error loading wallet balance:", err);
      }
    }

    loadBalance();

    // Subscribe to real-time changes
    const channel = supabaseClient
      .channel(`wallet-changes-${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "economy_wallets",
          filter: `player_id=eq.${playerId}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.balance === "number") {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [playerId]);

  if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED || balance === null) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "rgba(255, 215, 0, 0.08)",
        border: "1px solid rgba(255, 215, 0, 0.25)",
        padding: "0.25rem 0.6rem",
        borderRadius: "6px",
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "0.95rem",
        color: "#ffd700",
        letterSpacing: "0.05em",
        userSelect: "none",
        transition: "all 0.2s ease",
      }}
      className="hidden sm:flex"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 215, 0, 0.15)";
        e.currentTarget.style.boxShadow = "0 0 12px rgba(255, 215, 0, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 215, 0, 0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: "1rem" }}>🪙</span>
      <span>{balance} CC</span>
    </div>
  );
}
