'use client';
import React, { useState, useEffect } from 'react';
import { FEATURE_FLAGS } from '@/config/features';
import { getEquippedCosmetics } from '@/modules/economy/services/shop';

// Simple global cache to prevent N+1 query loops
const equippedCache: Record<string, any> = {};
const fetchPromises: Record<string, Promise<any> | undefined> = {};

interface PlayerAvatarProps {
  playerId: string;
  avatarUrl: string | null;
  username: string;
  size?: number; // Optional size in pixels
  isLarge?: boolean; // Explicit flag for larger layouts
  className?: string; // Additional classes
  style?: React.CSSProperties; // Additional inline styles
}

export default function PlayerAvatar({
  playerId,
  avatarUrl,
  username,
  size,
  isLarge: explicitIsLarge,
  className = "",
  style = {}
}: PlayerAvatarProps) {
  const [equipped, setEquipped] = useState<any>(null);

  useEffect(() => {
    if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED || !playerId) return;

    if (equippedCache[playerId] !== undefined) {
      setEquipped(equippedCache[playerId]);
      return;
    }

    if (fetchPromises[playerId]) {
      fetchPromises[playerId].then((res) => {
        setEquipped(res);
      });
      return;
    }

    const promise = getEquippedCosmetics(playerId)
      .then((res) => {
        equippedCache[playerId] = res;
        setEquipped(res);
        return res;
      })
      .catch((err) => {
        console.error("Error loading equipped cosmetics for avatar:", err);
        return null;
      });

    fetchPromises[playerId] = promise;
  }, [playerId]);

  const isLarge = explicitIsLarge ?? (size !== undefined ? size >= 80 : false);
  const initial = username?.[0]?.toUpperCase() ?? "?";

  // Base keyframes styles injected once on the client side
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'avatar-border-keyframes';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = `
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 12px #00e676, inset 0 0 8px rgba(0,230,118,0.2); }
          50% { box-shadow: 0 0 24px #00e676, inset 0 0 16px rgba(0,230,118,0.4); }
        }
        @keyframes shimmerBorder {
          0%, 100% { border-color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.4); }
          50% { border-color: #fff3a8; box-shadow: 0 0 28px rgba(255, 215, 0, 0.7); }
        }
        @keyframes neonPulseSmall {
          0%, 100% { box-shadow: 0 0 5px #00e676, inset 0 0 3px rgba(0,230,118,0.2); }
          50% { box-shadow: 0 0 10px #00e676, inset 0 0 5px rgba(0,230,118,0.4); }
        }
        @keyframes shimmerBorderSmall {
          0%, 100% { border-color: #ffd700; box-shadow: 0 0 6px rgba(255, 215, 0, 0.3); }
          50% { border-color: #fff3a8; box-shadow: 0 0 12px rgba(255, 215, 0, 0.6); }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Compute styles dynamically based on size and equipped cosmetic
  const containerStyle: React.CSSProperties = {
    ...(size !== undefined ? { width: `${size}px`, height: `${size}px` } : {}),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
    boxSizing: 'border-box',
    ...propsStyle(),
    ...style
  };

  function propsStyle(): React.CSSProperties {
    const border = equipped?.avatar_border;
    if (border === 'border_neon') {
      return {
        background: 'rgba(0, 230, 118, 0.05)',
        border: isLarge ? '3px solid #00e676' : '1.5px solid #00e676',
        boxShadow: isLarge 
          ? '0 0 20px #00e676, inset 0 0 12px rgba(0,230,118,0.3)' 
          : '0 0 8px #00e676, inset 0 0 4px rgba(0,230,118,0.3)',
        animation: isLarge ? 'neonPulse 2s infinite ease-in-out' : 'neonPulseSmall 2s infinite ease-in-out',
      };
    }
    if (border === 'border_gold') {
      return {
        background: 'rgba(255, 215, 0, 0.05)',
        border: isLarge ? '3px solid #ffd700' : '1.5px solid #ffd700',
        boxShadow: isLarge 
          ? '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 12px rgba(255,215,0,0.3)' 
          : '0 0 10px rgba(255, 215, 0, 0.4), inset 0 0 4px rgba(255,215,0,0.3)',
        animation: isLarge ? 'shimmerBorder 3s infinite ease-in-out' : 'shimmerBorderSmall 3s infinite ease-in-out',
      };
    }
    if (border === 'border_wood') {
      return {
        background: 'rgba(139, 69, 19, 0.1)',
        border: isLarge ? '4px solid #8b5a2b' : '2px solid #8b5a2b',
        boxShadow: isLarge 
          ? '0 4px 10px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.6)' 
          : '0 2px 4px rgba(0,0,0,0.4), inset 0 0 4px rgba(0,0,0,0.6)',
      };
    }
    // Default style
    return {
      background: 'var(--accent-lime-soft, rgba(0, 230, 118, 0.08))',
      border: isLarge ? '2px solid rgba(0,230,118,0.4)' : '1px solid rgba(0,230,118,0.3)',
      boxShadow: isLarge ? '0 0 25px rgba(0, 230, 118, 0.15)' : 'none'
    };
  }

  const fontStyle: React.CSSProperties = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: size !== undefined 
      ? (isLarge ? `${size * 0.42}px` : `${size * 0.48}px`)
      : (isLarge ? "3.5rem" : "1.2rem"),
    color: 'var(--accent-lime, #00e676)',
    lineHeight: 1
  };

  console.log("PlayerAvatar rendering playerId:", playerId, "username:", username, "border:", equipped?.avatar_border);
  return (
    <div style={containerStyle} className={className}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={username} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ) : (
        <span style={fontStyle}>{initial}</span>
      )}
    </div>
  );
}
