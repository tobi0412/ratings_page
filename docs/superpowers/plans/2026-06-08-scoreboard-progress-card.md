# Scoreboard Capsule Progress Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the voting progress card component to have a solid opaque card style with a neon lime accent top border, glowing linear progress track, and clear vertical stepper bubbles, implementing the "Scoreboard Capsule" approach.

**Architecture:** Modify the CSS definitions in the inline style block of `VotingProgress.tsx` to remove transparent card overrides and apply opaque surfaces, top neon borders, and scoreboard details for bubbles and labels.

**Tech Stack:** React, CSS, Next.js, TypeScript

---

### Task 1: Update Card Container & Progress Styles in VotingProgress.tsx

**Files:**
- Modify: `src/components/session/VotingProgress.tsx:147-235`

- [ ] **Step 1: Replace Card Base CSS Overrides**
  Modify the `.sticky-progress-card` selector inside the inline `<style>` JSX block to enable opaque background, card borders, glowing shadow, and the top accent line.

  *Code Content:*
  ```css
  /* --- Card base --- */
  .sticky-progress-card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-subtle) !important;
    border-top: 3px solid var(--accent-lime) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6) !important;
    padding: 1.25rem 1.5rem !important;
    position: relative;
    border-radius: 12px;
    transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .sticky-progress-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(0, 230, 118, 0.02) 0%,
      transparent 55%
    );
    pointer-events: none;
    border-radius: inherit;
  }
  .sticky-progress-card:hover {
    box-shadow: 0 12px 36px rgba(0, 230, 118, 0.05) !important;
    border-color: rgba(0, 230, 118, 0.25) !important;
  }
  ```

- [ ] **Step 2: Update Progress Label & Scoreboard Typography Styles**
  Ensure the Progress label and percentage layout match the uppercase condensed styling.
  Modify the header wrapper inside `VotingProgress.tsx` to align font weights and styles.

- [ ] **Step 3: Update Stepper Connection Line and Bubbles**
  Modify the CSS classes `.stepper-line`, `.stepper-bubble`, `.stepper-bubble.is-active`, `.stepper-bubble.is-done` to match the Scoreboard style specifications.

  *Code Content:*
  ```css
  /* --- Stepper track layout --- */
  .stepper-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: relative;
    margin-top: 1.25rem;
    padding-left: 0.25rem;
  }
  .stepper-line {
    position: absolute;
    left: 8px; /* centers with 18px circle container */
    top: 9px;
    bottom: 9px;
    width: 2px;
    background: var(--border-subtle);
    z-index: 0;
  }
  .stepper-step {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }
  .stepper-bubble {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-field);
    border: 2px solid var(--border-subtle);
    transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
    flex-shrink: 0;
    z-index: 2;
  }
  .stepper-bubble.is-active {
    border-color: var(--accent-lime);
    background: rgba(0, 230, 118, 0.05);
    box-shadow: 
      0 0 12px rgba(0, 230, 118, 0.35),
      inset 0 0 4px rgba(0, 230, 118, 0.2);
  }
  .stepper-bubble.is-done {
    background: var(--accent-lime);
    border-color: var(--accent-lime);
    box-shadow: 0 0 10px rgba(0, 230, 118, 0.25);
  }
  .stepper-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    .stepper-step:hover .stepper-label {
      color: var(--text-primary);
      transform: translateX(4px);
    }
  }
  .stepper-label.is-active {
    color: var(--text-primary);
  }
  .stepper-label.is-done {
    color: rgba(228, 240, 232, 0.45);
  }
  ```

- [ ] **Step 4: Update Inline styles in VotingProgress.tsx render output**
  Update the component return JSX (around lines 563-635) to match the scoreboard metrics layout.
  Specifically, match:
  - Label: "PROGRESO"
  - Percentage: e.g., `{percentage}%` in `Bebas Neue` large green text
  - Fraction: e.g., `({completedSteps}/{totalSteps})` in smaller `Barlow Condensed` text

  *Code Content (Return block):*
  ```tsx
  {/* Header */}
  <div style={{ marginBottom: "1rem" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: "0.5rem",
      }}
    >
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#3d6e50",
        }}
      >
        Progreso
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.8rem",
            color: "#00e676",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          {percentage}%
        </span>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.85rem",
            color: "#3d6e50",
          }}
        >
          ({completedSteps}/{totalSteps})
        </span>
      </div>
    </div>

    {/* Thin linear progress bar */}
    <div
      style={{
        width: "100%",
        height: "4px",
        background: "#1c3828",
        borderRadius: "2px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <motion.div
        animate={{ width: `${percentage}%` }}
        transition={progressTransition}
        style={{
          height: "100%",
          background: "#00e676",
          borderRadius: "2px",
          boxShadow: "0 0 8px rgba(0,230,118,0.4)",
        }}
      />
    </div>
  </div>
  ```

- [ ] **Step 5: Run linter checks**
  Run: `npm run lint`
  Expected: Clear with no syntax or lint errors.

- [ ] **Step 6: Run build verification**
  Run: `npm run build`
  Expected: Successful compilation of page and dashboard paths.

- [ ] **Step 7: Commit changes**
  ```bash
  git add src/components/session/VotingProgress.tsx
  git commit -m "style: redesign voting progress card to opaque scoreboard capsule theme"
  ```
