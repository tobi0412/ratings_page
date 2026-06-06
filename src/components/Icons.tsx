import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function TargetIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function DumbbellIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
      <path d="M2.5 21.5l1.4-1.4" />
      <path d="M20.1 3.9l1.4-1.4" />
      <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
      <path d="M9.6 14.4l4.8-4.8" />
    </svg>
  );
}

export function FlameIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </svg>
  );
}

export function BrainIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 18V5" />
      <path d="M15 13a4.17 4.17 0 0 1-3-4a4.17 4.17 0 0 1-3 4" />
      <path d="M8.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
      <path d="M18 18a4 4 0 0 0 2-7.464" />
      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
      <path d="M6 18a4 4 0 0 1-2-7.464" />
      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
    </svg>
  );
}

export function HourglassIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

export function SoccerBallIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      {...props}
    >
      <path
        fill="currentColor"
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m76.52 147.42H170.9l-9.26-12.76l12.63-36.78l15-4.89l26.24 20.13a87.4 87.4 0 0 1-10.99 34.3m-164-34.3L66.71 117l15 4.89l12.63 36.78l-9.24 12.75H51.48a87.4 87.4 0 0 1-11.01-34.3Zm10-50.64l5.51 18.6l-15.32 11.69a87.3 87.3 0 0 1 9.72-30.29ZM109 152l-11.46-33.35L128 97.71l30.46 20.94L147 152Zm91.07-46.92l5.51-18.6a87.3 87.3 0 0 1 9.72 30.29Zm-6.2-35.38l-9.51 32.08l-15.07 4.89L136 83.79V68.21l29.09-20a88.6 88.6 0 0 1 28.77 21.49Zm-47.8-27.83L128 54.29l-18.07-12.42a88.2 88.2 0 0 1 36.14 0m-55.16 6.34l29.09 20v15.58l-33.28 22.88l-15.07-4.89l-9.51-32.08a88.6 88.6 0 0 1 28.77-21.49M63.15 187.42h20.37l7.17 20.27a88.4 88.4 0 0 1-27.54-20.27M110 214.13l-11.88-33.42l9.23-12.71h41.3l9.23 12.71l-11.83 33.42a88 88 0 0 1-36.1 0Zm55.36-6.44l7.17-20.27h20.37a88.4 88.4 0 0 1-27.59 20.27Z"
      />
    </svg>
  );
}

export interface StarIconProps extends IconProps {
  filled?: boolean;
}

export function StarIcon({ size = "1em", filled = false, ...props }: StarIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
    </svg>
  );
}

export function MedalIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7.21 15L2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12L5.12 2.2M13 12l5.88-9.8M8 7h8" />
      <circle cx="12" cy="17" r="5" fill="currentColor" />
      <path d="M12 18v-2h-.5" />
    </svg>
  );
}

export function CheckIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function XIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function UsersIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CalendarIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function BanIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function StadiumIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="12" rx="8" ry="8" />
      <path d="M4 12v7c0 .94 2.51 1.785 6 2v-3h4v3c3.435-.225 6-1.07 6-2v-7" />
      <path d="M15 6h4V3h-4v7M7 6h4V3H7v7" />
    </svg>
  );
}

export function SpyIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      {...props}
    >
      <path
        fill="currentColor"
        d="M248 112h-27.92l-47.5-65.41a16 16 0 0 0-25.31-.72l-12.85 14.9l-.2.23a7.95 7.95 0 0 1-12.44 0l-.2-.23l-12.85-14.9a16 16 0 0 0-25.31.72L35.92 112H8a8 8 0 0 0 0 16h240a8 8 0 0 0 0-16M96.34 56l.19.23l12.85 14.89a24 24 0 0 0 37.24 0l12.85-14.89c.06-.08.1-.15.17-.23l40.66 56H55.69ZM180 144a36 36 0 0 0-35.77 32h-32.46a36 36 0 1 0-1.83 16h36.12A36 36 0 1 0 180 144M76 200a20 20 0 1 1 20-20a20 20 0 0 1-20 20m104 0a20 20 0 1 1 20-20a20 20 0 0 1-20 20"
      />
    </svg>
  );
}

export function ChartBarIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 16h8" />
      <path d="M7 11h12" />
      <path d="M7 6h3" />
    </svg>
  );
}

export function ThumbsUpIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function TrendingUpIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function CotorraLogoIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      {...props}
    >
      {/* Facet 1: Forehead Left */}
      <polygon
        points="50,12 58,37 31,25"
        fill="#00e676"
        opacity="0.8"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 2: Forehead Right */}
      <polygon
        points="50,12 68,20 58,37"
        fill="#00e676"
        opacity="0.9"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 3: Back Top */}
      <polygon
        points="31,25 38,42 22,45"
        fill="#00e676"
        opacity="0.6"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 4: Back Mid */}
      <polygon
        points="22,45 38,42 36,60"
        fill="#00e676"
        opacity="0.5"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 5: Cheek Mid */}
      <polygon
        points="38,42 48,52 36,60"
        fill="#00e676"
        opacity="0.85"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 6: Jaw Left */}
      <polygon
        points="22,45 36,60 27,65"
        fill="#00e676"
        opacity="0.45"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 7: Jaw Mid */}
      <polygon
        points="36,60 46,68 27,65"
        fill="#00e676"
        opacity="0.55"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 8: Jaw Center */}
      <polygon
        points="36,60 48,52 46,68"
        fill="#00e676"
        opacity="0.75"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 9: Neck Lower Left */}
      <polygon
        points="27,65 46,68 40,80"
        fill="#00e676"
        opacity="0.5"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 10: Neck Lower Mid */}
      <polygon
        points="46,68 55,87 40,80"
        fill="#00e676"
        opacity="0.6"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 11: Throat Mid */}
      <polygon
        points="48,52 68,52 46,68"
        fill="#00e676"
        opacity="0.8"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 12: Throat Low */}
      <polygon
        points="46,68 68,62 55,87"
        fill="#00e676"
        opacity="0.7"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 13: Beak Upper */}
      <polygon
        points="68,20 81,35 60,48 58,37"
        fill="#00e676"
        opacity="0.95"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 14: Beak Mid */}
      <polygon
        points="81,35 85,47 68,52 60,48"
        fill="#00e676"
        opacity="1.0"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 15: Beak Lower Outer */}
      <polygon
        points="85,47 75,75 68,62"
        fill="#00e676"
        opacity="0.9"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Facet 16: Beak Lower Inner */}
      <polygon
        points="85,47 68,62 68,52"
        fill="#00e676"
        opacity="0.8"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      
      {/* Facet 17: Dark Eye area */}
      <polygon
        points="58,37 60,48 48,52 38,42"
        fill="#040906"
        stroke="#060d09"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      
      {/* Eye: Green Hexagon */}
      <polygon
        points="51,40 54,41.5 54,44.5 51,46 48,44.5 48,41.5"
        fill="#00e676"
      />
    </svg>
  );
}

export function TrophyIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v1a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
    </svg>
  );
}

export function TheaterMasksIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13.192 9h6.616a2 2 0 0 1 1.992 2.183l-.567 6.182A4 4 0 0 1 17.25 21h-1.5a4 4 0 0 1-3.983-3.635l-.567-6.182A2 2 0 0 1 13.192 9M15 13h.01M18 13h.01" />
      <path d="M15 16.5q1.5 1 3 0" />
      <path d="M9.632 15.482A4 4 0 0 1 8.25 16h-1.5a4 4 0 0 1-3.983-3.635L2.2 6.183A2 2 0 0 1 4.192 4h6.616a2 2 0 0 1 2 2" />
      <path d="M6 8h.01M9 8h.01" />
      <path d="M6 12q1.146-.765 2.291-.36" />
    </svg>
  );
}

export function PoopIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19.2 14c1.13.836 1.8 1.874 1.8 3c0 2.761-4.03 5-9 5s-9-2.239-9-5c0-1.126.67-2.164 1.8-3" />
      <path d="M12.759 8c-1.536-.884-2.83-1.214-3.862-1.203" />
      <path d="M6 9c0 1.657 2.594 3 5.793 3s5.078-1.518 5.793-3c1.448-3-.965-6.5-6.276-7c1.127 1.365 2.221 4.235-2.413 4.797" />
      <path d="M17.014 10c1.821.721 2.986 1.826 2.986 3.066C20 15.239 16.418 17 12 17s-8-1.761-8-3.934c0-1.107.93-2.107 2.426-2.822" />
    </svg>
  );
}

export function PaperIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
    </svg>
  );
}

export function CoinsIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="18" r="6" />
      <path d="M12 18a6 6 0 0 0-3.5-5.5" />
    </svg>
  );
}

export function CotorraCoinIcon({ size = "1em", ...props }: IconProps) {
  const uniqueId = React.useId().replace(/:/g, "-");
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      {...props}
    >
      <defs>
        {/* Coin Rim 3D Gradient */}
        <linearGradient id={`coinRimGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#144d2d" />
          <stop offset="50%" stopColor="#072011" />
          <stop offset="100%" stopColor="#0a2a17" />
        </linearGradient>
        
        {/* Coin Face Gradient */}
        <linearGradient id={`coinFaceGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a2214" />
          <stop offset="100%" stopColor="#040e08" />
        </linearGradient>
        
        {/* Highlight for the edge */}
        <linearGradient id={`coinEdgeHighlight-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00e676" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#092213" stopOpacity="0" />
        </linearGradient>
        
        {/* Glow filter for Cotorra logo */}
        <filter id={`logoGlow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <clipPath id={`faceClip-${uniqueId}`}>
          <circle cx="60" cy="60" r="46" />
        </clipPath>
      </defs>

      {/* Outer Shadow / Glow */}
      <circle cx="60" cy="60" r="56" fill="#000000" fillOpacity="0.4" />
      
      {/* Outer Rim */}
      <circle cx="60" cy="60" r="54" fill={`url(#coinRimGrad-${uniqueId})`} stroke="#164d2d" strokeWidth="1.5" />
      
      {/* Ridges on the outer rim */}
      <circle cx="60" cy="60" r="52.5" stroke="#0b2416" strokeWidth="1.5" strokeDasharray="2 3" />
      
      {/* Inner Rim Border */}
      <circle cx="60" cy="60" r="48" fill={`url(#coinFaceGrad-${uniqueId})`} stroke="#164d2d" strokeWidth="2" />
      
      {/* Grid Background (Clipped to coin face) */}
      <g clipPath={`url(#faceClip-${uniqueId})`}>
        {/* Subtle Grid Lines */}
        <path d="M20 0 V120 M28 0 V120 M36 0 V120 M44 0 V120 M52 0 V120 M60 0 V120 M68 0 V120 M76 0 V120 M84 0 V120 M92 0 V120 M100 0 V120" stroke="#00e676" strokeWidth="0.3" strokeOpacity="0.12" />
        <path d="M0 20 H120 M0 28 H120 M0 36 H120 M0 44 H120 M0 52 H120 M0 60 H120 M0 68 H120 M0 76 H120 M0 84 H120 M0 92 H120 M0 100 H120" stroke="#00e676" strokeWidth="0.3" strokeOpacity="0.12" />
        
        {/* Circuit Board Traces */}
        <path d="M85 35 H95 V50 H105" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
        <path d="M35 85 H25 V70 H15" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
        <path d="M80 80 H70 V95 H65" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
        <path d="M40 30 H50 V20 H55" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
        
        {/* Small circuit dots */}
        <circle cx="95" cy="50" r="1.5" fill="#00e676" fillOpacity="0.3" />
        <circle cx="25" cy="70" r="1.5" fill="#00e676" fillOpacity="0.3" />
        <circle cx="70" cy="95" r="1.5" fill="#00e676" fill-opacity="0.3" />
        <circle cx="50" cy="20" r="1.5" fill="#00e676" fill-opacity="0.3" />
      </g>

      {/* Inner Rim Inner shadow/highlight ring */}
      <circle cx="60" cy="60" r="46.5" stroke={`url(#coinEdgeHighlight-${uniqueId})`} strokeWidth="1" fill="none" />

      {/* Cotorra Logo in the center */}
      <g transform="translate(34, 34) scale(0.52)" filter={`url(#logoGlow-${uniqueId})`}>
        {/* Facet 1: Forehead Left */}
        <polygon points="50,12 58,37 31,25" fill="#00e676" opacity="0.8" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 2: Forehead Right */}
        <polygon points="50,12 68,20 58,37" fill="#00e676" opacity="0.9" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 3: Back Top */}
        <polygon points="31,25 38,42 22,45" fill="#00e676" opacity="0.6" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 4: Back Mid */}
        <polygon points="22,45 38,42 36,60" fill="#00e676" opacity="0.5" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 5: Cheek Mid */}
        <polygon points="38,42 48,52 36,60" fill="#00e676" opacity="0.85" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 6: Jaw Left */}
        <polygon points="22,45 36,60 27,65" fill="#00e676" opacity="0.45" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 7: Jaw Mid */}
        <polygon points="36,60 46,68 27,65" fill="#00e676" opacity="0.55" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 8: Jaw Center */}
        <polygon points="36,60 48,52 46,68" fill="#00e676" opacity="0.75" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 9: Neck Lower Left */}
        <polygon points="27,65 46,68 40,80" fill="#00e676" opacity="0.5" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 10: Neck Lower Mid */}
        <polygon points="46,68 55,87 40,80" fill="#00e676" opacity="0.6" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 11: Throat Mid */}
        <polygon points="48,52 68,52 46,68" fill="#00e676" opacity="0.8" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 12: Throat Low */}
        <polygon points="46,68 68,62 55,87" fill="#00e676" opacity="0.7" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 13: Beak Upper */}
        <polygon points="68,20 81,35 60,48 58,37" fill="#00e676" opacity="0.95" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 14: Beak Mid */}
        <polygon points="81,35 85,47 68,52 60,48" fill="#00e676" opacity="1.0" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 15: Beak Lower Outer */}
        <polygon points="85,47 75,75 68,62" fill="#00e676" opacity="0.9" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 16: Beak Lower Inner */}
        <polygon points="85,47 68,62 68,52" fill="#00e676" opacity="0.8" stroke="#060d09" strokeWidth="0.8" />
        {/* Facet 17: Dark Eye area */}
        <polygon points="58,37 60,48 48,52 38,42" fill="#040906" stroke="#060d09" strokeWidth="0.8" />
        {/* Eye: Green Hexagon */}
        <polygon points="51,40 54,41.5 54,44.5 51,46 48,44.5 48,41.5" fill="#00e676" />
      </g>
    </svg>
  );
}

export function ShieldIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8.24-2.2a1 1 0 0 1 .5 0l8.24 2.2A1 1 0 0 1 20 6z" />
    </svg>
  );
}

export function ShieldAlertIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8.24-2.2a1 1 0 0 1 .5 0l8.24 2.2A1 1 0 0 1 20 6z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function HelpCircleIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function EyeIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ShieldAnonIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M3 11.991c0 5.638 4.239 8.375 6.899 9.536c.721.315 1.082.473 2.101.473V8l-9 3z" />
      <path fill="currentColor" d="M14.101 21.527C16.761 20.365 21 17.63 21 11.991V11l-9-3v14c1.02 0 1.38-.158 2.101-.473M8.838 2.805L8.265 3c-3.007 1.03-4.51 1.545-4.887 2.082C3 5.62 3 7.22 3 10.417V11l9-3V2c-.811 0-1.595.268-3.162.805" opacity=".5" />
      <path fill="currentColor" d="m15.735 3l-.573-.195C13.595 2.268 12.812 2 12 2v6l9 3v-.583c0-3.198 0-4.797-.378-5.335c-.377-.537-1.88-1.052-4.887-2.081" />
    </svg>
  );
}

export function InfiltrationIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M2 12c0 1.64.425 2.191 1.275 3.296C4.972 17.5 7.818 20 12 20s7.028-2.5 8.725-4.704C21.575 14.192 22 13.639 22 12c0-1.64-.425-2.191-1.275-3.296C19.028 6.5 16.182 4 12 4S4.972 6.5 3.275 8.704C2.425 9.81 2 10.361 2 12" opacity=".5" />
      <path fill="currentColor" fillRule="evenodd" d="M8.25 12a3.75 3.75 0 1 1 7.5 0a3.75 3.75 0 0 1-7.5 0m1.5 0a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" clipRule="evenodd" />
    </svg>
  );
}

export function FlameNeonIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M20 15c0 4.255-2.618 6.122-4.641 6.751a.44.44 0 0 1-.233.012c-.289-.069-.432-.453-.224-.751c.88-1.266 1.898-3.196 1.898-5.012c0-1.95-1.644-4.253-2.928-5.674c-.293-.324-.805-.11-.821.328c-.053 1.45-.282 3.388-1.268 4.908a.412.412 0 0 1-.677.036c-.308-.39-.616-.871-.924-1.252c-.166-.204-.466-.207-.657-.026c-.747.707-1.792 1.809-1.792 3.18c0 .93.36 1.905.767 2.69c.202.39-.103.851-.482.77a.5.5 0 0 1-.122-.046C6.113 19.98 4 18.084 4 15c0-3.146 4.31-7.505 5.956-11.623c.26-.65 1.06-.955 1.617-.531C14.943 5.414 20 10.378 20 15" />
      <path fill="currentColor" d="M7.733 17.5c0 .93.36 1.905.767 2.69c.202.39-.103.852-.482.77c.482.54 3.658.957 7.108.803c-.289-.069-.432-.453-.224-.751c.88-1.265 1.898-3.196 1.898-5.012c0-1.95-1.644-4.253-2.928-5.674c-.293-.324-.805-.11-.821.328c-.053 1.45-.282 3.388-1.268 4.908a.412.412 0 0 1-.677.036c-.308-.39-.616-.871-.924-1.251c-.166-.205-.466-.208-.657-.027c-.747.707-1.792 1.809-1.792 3.18" opacity=".5" />
    </svg>
  );
}

export function StarsShimmerIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M15.252 10.689c-.987-1.18-1.48-1.77-2.048-1.68c-.567.091-.832.803-1.362 2.227l-.138.368c-.15.405-.226.607-.373.756c-.146.149-.348.228-.75.386l-.367.143c-1.417.555-2.126.833-2.207 1.4s.52 1.049 1.721 2.011l.31.25c.342.273.513.41.611.597c.1.187.115.404.146.837l.029.394c.11 1.523.166 2.285.683 2.545s1.154-.155 2.427-.983l.329-.215c.362-.235.543-.353.75-.387c.208-.033.42.022.841.132l.385.1c1.485.386 2.228.58 2.629.173s.193-1.144-.221-2.62l-.108-.38c-.117-.42-.176-.63-.147-.837c.03-.208.145-.39.374-.756l.21-.332c.807-1.285 1.21-1.927.94-2.438c-.269-.511-1.033-.553-2.562-.635l-.396-.022c-.434-.023-.652-.035-.841-.13c-.19-.095-.33-.263-.61-.599z" />
      <path fill="currentColor" d="M10.331 4.252c1.316-1.574 1.974-2.361 2.73-2.24s1.11 1.07 1.817 2.969l.183.491c.201.54.302.81.497 1.008c.196.199.464.304 1.001.514l.489.192c1.89.74 2.835 1.11 2.942 1.866c.108.757-.693 1.398-2.294 2.682l-.414.332c-.455.365-.683.547-.815.797s-.152.538-.194 1.115l-.038.526c-.148 2.031-.222 3.047-.911 3.393c-.69.347-1.538-.206-3.236-1.311l-.439-.286c-.482-.314-.723-.47-1-.515s-.558.028-1.121.175l-.513.133c-1.98.516-2.971.773-3.505.231s-.258-1.526.295-3.492l.142-.509c.157-.559.236-.838.197-1.115c-.04-.277-.193-.52-.499-1.008l-.278-.443C4.29 8.044 3.752 7.187 4.11 6.507c.36-.682 1.379-.737 3.418-.848l.527-.028c.58-.031.869-.047 1.122-.174c.252-.127.439-.35.813-.798z" opacity=".5" />
    </svg>
  );
}

export function AxeBrokenIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m13 9l7.383 7.418c.823.82.823 2.148 0 2.967a2.11 2.11 0 0 1-2.976 0L10 12" />
      <path d="m6.66 15.66l-3.32-3.32a1.25 1.25 0 0 1 .42-2.044L7 9l6-6l3 3l-6 6l-1.296 3.24a1.25 1.25 0 0 1-2.044.42" />
    </svg>
  );
}

export function MoonStarsIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M19.9 2.307a.483.483 0 0 0-.9 0l-.43 1.095a.48.48 0 0 1-.272.274l-1.091.432a.486.486 0 0 0 0 .903l1.091.432a.48.48 0 0 1 .272.273L19 6.81c.162.41.74.41.9 0l.43-1.095a.48.48 0 0 1 .273-.273l1.091-.432a.486.486 0 0 0 0-.903l-1.091-.432a.48.48 0 0 1-.273-.274zM16.033 8.13a.483.483 0 0 0-.9 0l-.157.399a.48.48 0 0 1-.272.273l-.398.158a.486.486 0 0 0 0 .903l.398.157c.125.05.223.148.272.274l.157.399c.161.41.739.41.9 0l.157-.4a.48.48 0 0 1 .272-.273l.398-.157a.486.486 0 0 0 0-.903l-.398-.158a.48.48 0 0 1-.272-.273z" />
      <path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10c0-.463-.694-.54-.933-.143a6.5 6.5 0 1 1-8.924-8.924C12.54 2.693 12.463 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10" opacity=".5" />
    </svg>
  );
}

export function ShovelFieldIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m17 4l3 3m-1.5-1.5l-8 8m-2.224-2.216l4.44 4.44a.97.97 0 0 1 0 1.369l-2.704 2.704a4.108 4.108 0 0 1-5.809-5.81l2.704-2.703a.97.97 0 0 1 1.37 0z" />
    </svg>
  );
}

export function SoccerFieldIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 9h3v6H3zm15 0h3v6h-3z" />
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm9-2v14" />
    </svg>
  );
}

export function BoneInjuryIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3a3 3 0 0 1 3 3a3 3 0 1 1-2.12 5.122l-4.758 4.758a3 3 0 1 1-5.117 2.297V18h-.176a3 3 0 1 1 2.298-5.115l4.758-4.758a3 3 0 0 1 2.12-5.122z" />
    </svg>
  );
}

export function WizardHatIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M21 22H3v-2h18zm-2-3H5l6.1-16.4q.3-.6.9-.6l6 3h-4.1zM10 7.5l1.04.47L11.5 9l.47-1.03L13 7.5l-1.03-.47L11.5 6l-.46 1.03zm3 7.5l-2.06-.93L10 12l-.93 2.07L7 15l2.07.93L10 18l.94-2.07zm.97-3.03L15 11.5l-1.03-.47L13.5 10l-.46 1.03l-1.04.47l1.04.47l.46 1.03zm2 4L17 15.5l-1.03-.47L15.5 14l-.46 1.03l-1.04.47l1.04.47l.46 1.03z" />
    </svg>
  );
}

export function LungsIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.081 20C7.693 20 9 18.665 9 17.02V7.257C9 6.563 8.448 6 7.768 6c-.205 0-.405.052-.584.15l-.13.083C5.594 7.292 4.622 8.88 3.65 12.057q-.63 2.055-.648 4.775c-.012 1.675 1.261 3.054 2.877 3.161zm11.839 0C16.307 20 15 18.665 15 17.02V7.257C15 6.563 15.552 6 16.233 6c.204 0 .405.052.584.15l.13.083c1.46 1.059 2.432 2.647 3.405 5.824q.63 2.055.648 4.775c.012 1.675-1.261 3.054-2.878 3.161zM9 12a3 3 0 0 0 3-3a3 3 0 0 0 3 3m-3-8v5" />
    </svg>
  );
}

export function MVPCrownIcon({ size = "1em", ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" fillRule="evenodd" d="m19.687 14.093l.184-1.704c.097-.91.162-1.51.111-1.889a1.5 1.5 0 0 1-1.117-.52c-.327.201-.753.626-1.394 1.265c-.495.493-.742.739-1.018.777a.83.83 0 0 1-.45-.063c-.254-.112-.424-.416-.763-1.025l-1.79-3.209c-.209-.375-.384-.69-.542-.942c-.273.139-.581.217-.908.217s-.635-.078-.908-.217c-.158.253-.333.567-.543.942L8.76 10.934c-.34.609-.51.913-.764 1.025a.83.83 0 0 1-.45.063c-.275-.038-.522-.284-1.017-.777c-.641-.639-1.067-1.064-1.393-1.265a1.5 1.5 0 0 1-1.118.52c-.051.378.014.979.111 1.889l.184 1.704l.089.85c.252 2.435.46 4.45 1.31 5.21c.946.847 2.364.847 5.2.847h2.176c2.836 0 4.254 0 5.2-.847c.85-.76 1.058-2.775 1.31-5.21q.043-.417.09-.85" clipRule="evenodd" opacity=".5" />
      <path fill="currentColor" d="M20 10.5a1.5 1.5 0 1 0-.018 0zM12 3a2 2 0 1 0 0 4a2 2 0 0 0 0-4M2.5 9A1.5 1.5 0 0 0 4 10.5h.018A1.497 1.497 0 0 0 5.5 9a1.5 1.5 0 1 0-3 0m2.349 9.25a18 18 0 0 1-.246-1.5h14.794c-.07.545-.148 1.05-.246 1.5z" />
    </svg>
  );
}


