---
name: Cotorra Analytics Design System
description: Dark-green athletic sports dashboard aesthetic for team peer evaluation.
colors:
  primary: "#00e676"
  neutral-bg: "#060d09"
  bg-card: "#0b1810"
  bg-card-hover: "#112018"
  border-subtle: "#1c3828"
  text-primary: "#e4f0e8"
  text-muted: "#3d6e50"
  accent-gold: "#ffc93c"
  accent-red: "#ff5252"
  accent-amber: "#ffab40"
typography:
  display:
    fontFamily: "Bebas Neue, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    letterSpacing: "0.1em"
rounded:
  sm: "6px"
  md: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#040a06"
    rounded: "{rounded.sm}"
    padding: "10.4px 28px"
  card-sport:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: Cotorra Analytics

## 1. Overview

**Creative North Star: "The Floodlit Pitch"**

Cotorra Analytics is a peer-voting performance tracker that channels the raw energy of playing football under stadium floodlights. It rejects corporate SaaS minimalism in favor of a dark, immersive, high-contrast athletic aesthetic. The canvas is a pitch-black night, with lines and elements illuminated by a brilliant turf-lime green.

The typography is bold, tall, and uppercase for headers (evoking jersey names and scoreboard digits), paired with crisp sans-serif text for stats and values. Radii are kept tight and functional (6px for buttons/inputs, 12px for cards) to preserve a precise, digital-sport dashboard feel.

**Key Characteristics:**
- Deep green-black surfaces resembling night football turf.
- High-visibility lime accents (`#00e676`) for primary interactive states.
- Condensed, athletic display fonts in uppercase for strong visual hierarchy.
- Seamless transitions, hover glows, and distinct status colorization.

## 2. Colors

The color palette is derived directly from a soccer field at night. Surfaces are tinted with turf-hue values to create visual depth without resorting to plain grays.

### Primary
- **Floodlit Turf Lime** (`#00e676`): The primary brand color. Reserved for active inputs, focus indicators, successful state badges, and primary call-to-action buttons. It acts as the "light source" on the pitch.

### Neutral
- **Deep Pitch Background** (`#060d09`): The base background color. A very dark, low-chroma green-black.
- **Card Surface** (`#0b1810`): Elevation level 1 background. Used for layout containers, voting cards, and tables.
- **Card Surface Hover** (`#112018`): Interactive hover background for card elements.
- **Border Subtle** (`#1c3828`): Structural borders, dividers, and inactive range slider tracks.
- **Cream Mint Text** (`#e4f0e8`): Primary reading color. High-contrast near-white with a very slight mint green tint to avoid harshness.
- **Muted Turf Ink** (`#3d6e50`): Secondary/muted label text and helper elements.

### Accents
- **Winner Gold** (`#ffc93c`): Used for MVPs and top performers.
- **Warning Amber** (`#ffab40`): Used for medium ratings and warnings.
- **Ref Red** (`#ff5252`): Used for low ratings, errors, delete buttons, and "No coincidí" blank votes.

**The Floodlight Rule.** The primary lime accent is used on ≤15% of any given screen. Its rarity is the point; too much lime makes the dashboard look like a neon billboard rather than a sleek analytics tool.

## 3. Typography

**Display Font:** Bebas Neue (with sans-serif fallback)
**Body Font:** Barlow (with sans-serif fallback)
**Label/Mono Font:** Barlow Condensed (with sans-serif fallback)

The pairing of Bebas Neue and Barlow is inspired by athletic wear and stadium dashboards. Tall display headers provide immediate hierarchy, while Barlow offers clean readability for statistics.

### Hierarchy
- **Display** (Regular 400, `clamp(2rem, 5vw, 4rem)`, 1): Used for page titles and large numbers.
- **Headline** (Regular 400, `1.75rem`, 1.1): Used for section titles.
- **Title** (Regular 400, `1.25rem`, 1.2): Used for card headings and player names.
- **Body** (Regular 400, `1rem` or `0.95rem`, 1.5): Used for descriptions, notes, and values.
- **Label** (Bold 700, `0.8rem`, letter-spacing `0.1em`, uppercase): Used for button labels, form headers, and badges.

**The Scoreboard Rule.** Display text (Bebas Neue) must always be in uppercase or represent numerical statistics. Sentence-case Bebas Neue is forbidden.

## 4. Elevation

Cotorra Analytics is flat and layered, relying on background value steps and subtle border colors rather than soft drop shadows to convey depth.

Surfaces are flat at rest. Subtle borders define containers, while active or hovered states receive light-glow borders and soft-glow transitions.

**The Glow-Response Rule.** Box shadows are not used as generic ambient drop shadows on cards. They are strictly reactive: applied as a high-intensity glow response (`box-shadow: 0 0 24px rgba(0, 230, 118, 0.12)`) on active or hovered states to simulate the bloom of floodlights.

## 5. Components

### Buttons
- **Shape:** Soft square (6px radius).
- **Primary:** Floodlit Turf Lime (`#00e676`) background with near-black (`#040a06`) bold text. Padding: `0.65rem 1.75rem`.
- **Hover / Focus:** Transition to background color `#1ded87` with an active glow shadow (`box-shadow: 0 0 24px rgba(0, 230, 118, 0.5)`) and a slight upward translate (`translateY(-1px)`).
- **Secondary / Outline:** Transparent background with lime border (`1px solid rgba(0, 230, 118, 0.5)`) and lime text. Hovers transition to a light green tint (`rgba(0, 230, 118, 0.1)`) and full lime border.

### Cards / Containers
- **Corner Style:** Rounded (12px radius).
- **Background:** Card Surface (`#0b1810`).
- **Border:** Inactive states use Border Subtle (`1px solid #1c3828`). Saved or active states transition to a custom colored border (e.g., lime or red).
- **Internal Padding:** `1.25rem` to `1.5rem`.

### Inputs / Fields
- **Style:** Dark background (`rgba(0, 0, 0, 0.45)`) with Border Subtle (`1px solid #1c3828`) and a 6px border radius.
- **Focus:** Outline is suppressed; border transitions to primary lime with a soft glow ring (`rgba(0, 230, 118, 0.12)`).

### Chips / Badges
- **Style:** Compact pill layout (20px border radius) with a light background tint (`rgba(color, 0.15)`) and matching solid color text/border.
- **Example:** Active badge uses `--accent-lime-soft` background and `--accent-lime` text.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH tints dynamically for rating colorization (lime for high, amber for mid, red for low).
- **Do** ensure contrast of body text is kept high against the dark turf background (using `--text-primary` at `#e4f0e8`).
- **Do** clamp heading font-sizes on mobile viewports to prevent overflow.

### Don't:
- **Don't** use generic gray drop-shadows on cards.
- **Don't** use side-stripe borders (e.g., `border-left: 4px solid var(--accent-lime)`) on cards. Use full subtle borders instead.
- **Don't** use gradient text under any circumstances.
- **Don't** use all-caps body copy for descriptions. Keep uppercase limited to Display headers, labels, and badges.
- **Don't** pair competing display fonts. Stick to Bebas Neue for headings and Barlow/Barlow Condensed for body/labels.
