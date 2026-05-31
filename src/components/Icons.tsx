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


