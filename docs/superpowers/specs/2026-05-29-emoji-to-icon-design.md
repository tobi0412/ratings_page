# Spec: Emojis to Icons Migration

This design document outlines the plan to replace user interface emojis with context-appropriate custom React SVG icon components in the Cotorra Analytics project.

## 1. Goal

Migrate all remaining visual emojis (like 🚫, 🏟, 🕵️‍♂️, 📊, 🌟, 🔥, 👍, 📈, ⚠️) inside pages and charts to clean, modern, outline-based SVG icon components, adhering to the codebase's existing zero-dependency custom-styling architecture.

## 2. Proposed Icon Components

We will add the following SVG components to `src/components/Icons.tsx` utilizing standard SVG styles:

### BanIcon (for 🚫)
- A circle with a diagonal line.

### StadiumIcon (for 🏟)
- A sports stadium architecture line drawing.

### SpyIcon (for 🕵️‍♂️)
- A detective hat and glasses line drawing.

### ChartBarIcon (for 📊)
- A three-column bar chart.

### ThumbsUpIcon (for 👍)
- A thumbs-up hand shape.

### TrendingUpIcon (for 📈)
- A rising trend line with an arrow.

### AlertTriangleIcon (for ⚠️)
- A warning triangle with an exclamation point.

## 3. Detailed Component Map

### Dashboard Page (`src/app/dashboard/page.tsx`)
- Replace `🚫` with `<BanIcon size="3rem" style={{ color: "#ff5252", marginBottom: "1rem" }} />`
- Replace `🏟` with `<StadiumIcon size="3rem" style={{ color: "#3d6e50", marginBottom: "1rem" }} />`

### Mystery Vote Widget (`src/components/session/MysteryVoteWidget.tsx`)
- Replace `🕵️‍♂️` with `<SpyIcon size="2.5rem" style={{ color: "var(--accent-lime)", marginBottom: "0.5rem" }} />`

### History Page (`src/app/history/page.tsx`)
- Replace `📊` with `<ChartBarIcon size="3rem" style={{ color: "#3d6e50", marginBottom: "1rem" }} />`

### Stat Line Chart Component (`src/components/charts/StatLineChart.tsx`)
In player rating performance tiers (lines 176–188):
- Change `Clase Mundial 🌟` to rendering `<StarIcon size="1rem" filled style={{ color: tierColor, display: 'inline', marginLeft: '0.25rem' }} />` (or replacing text structure to include component inline)
- Change `Destacado 🔥` to rendering `<FlameIcon size="1rem" style={{ color: tierColor, display: 'inline', marginLeft: '0.25rem' }} />`
- Change `Buen Rendimiento 👍` to rendering `<ThumbsUpIcon size="1rem" style={{ color: tierColor, display: 'inline', marginLeft: '0.25rem' }} />`
- Change `Regular 📈` to rendering `<TrendingUpIcon size="1rem" style={{ color: tierColor, display: 'inline', marginLeft: '0.25rem' }} />`
- Change `Bajo promedio ⚠️` to rendering `<AlertTriangleIcon size="1rem" style={{ color: tierColor, display: 'inline', marginLeft: '0.25rem' }} />`

## 4. Verification Plan

- Run `npm run dev` to start the Next.js dev server.
- Verify dashboard voting screens for users and empty/no-session states.
- Verify the history page for empty states.
- Verify the charts on the history tab and check player tooltips/tiers.
