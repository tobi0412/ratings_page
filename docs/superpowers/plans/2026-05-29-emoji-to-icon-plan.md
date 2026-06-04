# Emojis to Icons Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all UI emojis to custom React SVG icon components.

**Architecture:** Add new SVG react components in `Icons.tsx` and import/render them in dashboard, mystery vote widget, history page, and stats line chart.

**Tech Stack:** React, Next.js, SVG.

---

### Task 1: Add New Icons to Icons.tsx

**Files:**
- Modify: `src/components/Icons.tsx`

- [ ] **Step 1: Add new icon functions to Icons.tsx**

Add `BanIcon`, `StadiumIcon`, `SpyIcon`, `ChartBarIcon`, `ThumbsUpIcon`, `TrendingUpIcon`, and `AlertTriangleIcon` components at the end of the file.

```tsx
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
```

---

### Task 2: Replace Emojis in Dashboard page.tsx

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Import BanIcon and StadiumIcon**

Import them from `@/components/Icons`.

```typescript
import { BanIcon, StadiumIcon } from "@/components/Icons";
```

- [ ] **Step 2: Replace 🚫 and 🏟**

Lines 144:
```diff
- <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
+ <BanIcon size="3rem" style={{ color: "#ff5252", marginBottom: "1rem" }} />
```

Lines 273:
```diff
- <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏟</div>
+ <StadiumIcon size="3rem" style={{ color: "#3d6e50", marginBottom: "1rem" }} />
```

---

### Task 3: Replace Emoji in MysteryVoteWidget.tsx

**Files:**
- Modify: `src/components/session/MysteryVoteWidget.tsx`

- [ ] **Step 1: Import SpyIcon**

Import `SpyIcon` from `@/components/Icons`.

- [ ] **Step 2: Replace 🕵️‍♂️**

Line 115:
```diff
- <span style={{ fontSize: "2rem" }}>🕵️‍♂️</span>
+ <SpyIcon size="2rem" style={{ color: "var(--accent-lime)", marginBottom: "0.25rem" }} />
```

---

### Task 4: Replace Emoji in History page.tsx

**Files:**
- Modify: `src/app/history/page.tsx`

- [ ] **Step 1: Import ChartBarIcon**

Import `ChartBarIcon` from `@/components/Icons`.

```typescript
import { ChartBarIcon } from "@/components/Icons";
```

- [ ] **Step 2: Replace 📊**

Line 123:
```diff
- <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
+ <ChartBarIcon size="3rem" style={{ color: "#3d6e50", marginBottom: "1rem" }} />
```

---

### Task 5: Replace Emojis in StatLineChart.tsx

**Files:**
- Modify: `src/components/charts/StatLineChart.tsx`

- [ ] **Step 1: Import new icons**

Import `StarIcon`, `FlameIcon`, `ThumbsUpIcon`, `TrendingUpIcon`, `AlertTriangleIcon` at the top of the file.

```typescript
import { StarIcon, FlameIcon, ThumbsUpIcon, TrendingUpIcon, AlertTriangleIcon } from "@/components/Icons";
```

- [ ] **Step 2: Replace text-tier emojis with component logic**

Replace lines 176–190.

```typescript
      // Determine visual tier
      let tierText: React.ReactNode = "Clase Mundial";
      let tierIcon: React.ReactNode = <StarIcon size="0.85rem" filled style={{ color: "#00e676" }} />;
      let tierColor = "#00e676";
      if (singleValue < 9.0 && singleValue >= 8.0) {
        tierText = "Destacado";
        tierIcon = <FlameIcon size="0.85rem" style={{ color: "#40c4ff" }} />;
        tierColor = "#40c4ff";
      } else if (singleValue < 8.0 && singleValue >= 7.0) {
        tierText = "Buen Rendimiento";
        tierIcon = <ThumbsUpIcon size="0.85rem" style={{ color: "#ffab40" }} />;
        tierColor = "#ffab40";
      } else if (singleValue < 7.0 && singleValue >= 6.0) {
        tierText = "Regular";
        tierIcon = <TrendingUpIcon size="0.85rem" style={{ color: "#a0c4ac" }} />;
        tierColor = "#a0c4ac";
      } else if (singleValue < 6.0) {
        tierText = "Bajo promedio";
        tierIcon = <AlertTriangleIcon size="0.85rem" style={{ color: "#ff5252" }} />;
        tierColor = "#ff5252";
      }
```

- [ ] **Step 3: Update tier rendering structure to render both the text and the icon**

Around line 261:
```diff
- {tierText}
+ <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
+   {tierText}
+   {tierIcon}
+ </span>
```
