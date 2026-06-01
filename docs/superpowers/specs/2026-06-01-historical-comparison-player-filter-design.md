# Design Spec: Filtro de Jugadores en Comparativas Históricas

This document outlines the design and implementation for adding a player filter feature to the historical comparison dashboard ("Comparativas por Equipo"). This allows users to show/hide lines for specific players to improve readability in charts with many overlapping data lines.

## 1. State Management in `TeamTab.tsx`

We will add a state hook in `src/components/history/TeamTab.tsx` to keep track of the selected players:
```typescript
const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
```

*   **Initialization:** Upon component mount, `selectedPlayerIds` will be initialized to contain all player IDs available in `stats` (i.e., `Object.keys(stats)`), ensuring all lines are visible by default.
*   **Toggle Handler:** A toggle function will add/remove player IDs to/from the `selectedPlayerIds` list when their respective pills are clicked.
*   **Bulk Selection Utilities:** "Todos" (Select All) and "Ninguno" (Clear All) utility buttons will allow users to select all players or clear the selection with a single click.

## 2. Interactive Badge/Pill Row UI (`src/components/history/TeamTab.tsx`)

A new filter panel will be rendered right below the page/tab headers and above the chart widgets.

### Visual Style
*   The selector will align with the sports dashboard aesthetic (dark background `#0b1810`, borders in `#1c3828`).
*   It will display a small label: `Comparar Jugadores`.
*   Beside the label, two utility action buttons: `Todos` (Select All) and `Ninguno` (Clear All) using simple border/text styling.
*   A flex-wrap container displaying player badge pills.

### Pill States
Each player pill will display the player's username. The style changes dynamically:
*   **Selected (Active):** Uses the player's assigned color (e.g., `PLAYER_COLORS[index]`) for a glowing border, and has a subtle opacity background of that color, with bright text `#e4f0e8`.
*   **Deselected (Inactive):** Dimmed background `#12261b`, dark border `#1c3828`, and text in `#3d6e50`.
*   **Hover:** Increased brightness and pointer cursor.

## 3. Data Transformation & Filtering

To maintain consistent color coding across all charts (preventing a player's line color from changing when other players are filtered out):

1.  We compile the full series list first, mapping each player to their color based on their position in the original list.
2.  We then filter this compiled list to only include series matching `selectedPlayerIds`.
3.  The filtered list is passed as the `data` prop to all five `StatLineChart` widgets.

```typescript
const allSeries = buildAllPlayersSeries("avg_total");
const filteredSeries = allSeries.filter(s => selectedPlayerIds.includes(s.playerId));
```

The `ComparisonTable` and other rankings will continue displaying all players to retain full context (as tables do not suffer from line-overlapping readability issues).

## 4. Verification Plan

### Automated / Build Verification
*   Run `npm run build` to verify clean typescript compilation.

### Manual Verification
*   Navigate to `/history` -> `Comparativas por Equipo`.
*   Verify that by default all player pills are highlighted and all player lines are rendered in the charts.
*   Click a player pill to deselect them, and verify their line immediately disappears from all 5 charts.
*   Verify that player line colors DO NOT change or swap when other players are filtered out.
*   Click the "Ninguno" button and verify all lines disappear.
*   Click the "Todos" button and verify all lines reappear.
*   Verify responsive layout: player pills wrap correctly on mobile screens.
