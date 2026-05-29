# Historicos Redesign — Spec

**Date:** 2026-05-29  
**Status:** Approved

---

## Overview

Rediseño completo de la pantalla `/history`. El objetivo es separar las estadísticas en dos pestañas claras (personales y comparativas de equipo), agregar dashboards de línea por cada stat, y corregir tres bugs existentes: MVP duplicado, gráfico de evolución vacío, y datos incorrectamente ignorados.

---

## Bugs a corregir

### Bug 1: MVP duplicado en el ranking
**Causa:** `getTopMVPs()` en `stats.ts` consulta `historical_ratings` sin agrupar por `player_id`. Cada jugador tiene una fila por sesión, por lo que aparece múltiples veces si tuvo MVPs en varias sesiones.  
**Fix:** Traer todas las filas con `mvp_count > 0`, agrupar por `player_id` en JavaScript, sumar los totales, ordenar descendente y retornar los primeros N.

### Bug 2: Gráfico de evolución vacío
**Causa:** `history/page.tsx` llama a `getHistoricalStats()` que retorna `{ sessions, ratings }`, pero solo almacena `sessions` en el estado. Los `ratings` se descartan, por lo que `RatingEvolutionChart` siempre recibe `ratings: []`.  
**Fix:** Guardar también `ratings` en el estado del componente y pasarlos correctamente al gráfico.

### Bug 3: Datos de evolución per-stat no disponibles
**Causa:** `getHistoricalStats()` retorna las `historical_ratings` completas (con avg por stat por sesión) pero actualmente no se usan para los gráficos.  
**Fix:** Utilizar esos datos en los nuevos componentes `StatLineChart` para mostrar evolución real por sesión.

---

## Arquitectura

### Árbol de archivos

```
src/
  app/history/page.tsx              ← refactor: tab state + carga de datos corregida
  components/
    charts/
      RatingEvolutionChart.tsx      ← existente, fix de ratings vacíos
      StatLineChart.tsx             ← NUEVO: línea de una sola stat (reutilizable)
      MVPRanking.tsx                ← NUEVO: ranking lista en lugar de podio cards
    history/
      PersonalTab.tsx               ← NUEVO: pestaña estadísticas personales
      TeamTab.tsx                   ← NUEVO: pestaña comparativas por equipo
  actions/stats.ts                  ← fix getTopMVPs (agrupación en JS)
```

### Carga de datos

La carga de datos es client-side con `useEffect` en `page.tsx` (mismo patrón actual). Se carga todo de una sola vez al montar el componente:

- `getHistoricalStats()` → sesiones + historical_ratings (todas las filas por jugador por sesión)
- `getAllPlayersStats()` → promedios globales por jugador
- `getTopMVPs()` → ranking de MVPs (con fix de agrupación)
- Usuario logueado via contexto de autenticación existente

Cada tab consume lo que necesita del mismo estado compartido en `page.tsx`.

---

## Componentes

### `page.tsx` — Refactor

- Estado: `activeTab: 'personal' | 'team'`
- Estado: `sessions`, `ratings`, `stats`, `topMVPs`, `currentUser`
- Renderiza el toggle de pestañas y el tab activo
- Pasa todos los datos necesarios como props a `PersonalTab` y `TeamTab`

### Toggle de pestañas

Dos botones al tope de la página, estilo consistente con el design system existente (Bebas Neue, colores del theme verde). La pestaña activa tiene borde o highlight en `#00e676`.

### `PersonalTab.tsx`

Props: `sessions`, `ratings`, `stats`, `currentUserId`

Layout vertical:

1. **Selector de jugador** — lista de chips/botones con todos los jugadores. El jugador logueado aparece primero y seleccionado por defecto. Al seleccionar un jugador, los gráficos se actualizan.

2. **Dashboard General** — `StatLineChart` con `avgTotal` del jugador seleccionado. Un único color (`#00e676`).

3. **Grid 2×2 de stats** — cuatro instancias de `StatLineChart`:
   - 🎯 Técnica (`avg_tecnica`, color `#40c4ff`)
   - 💪 Físico (`avg_fisico`, color `#ff5252`)
   - 🔥 Actitud (`avg_actitud`, color `#ffab40`)
   - 👁 Visión (`avg_vision_juego`, color `#ea80fc`)

4. **Resumen numérico** — fila de tarjetas pequeñas mostrando el promedio global de cada stat y total de MVPs del jugador seleccionado.

### `TeamTab.tsx`

Props: `sessions`, `ratings`, `stats`, `topMVPs`

Layout vertical:

1. **`MVPRanking`** — lista rankeada con todos los jugadores que tienen al menos 1 MVP, mostrando posición, nombre y total de MVPs. Usa medallas (🥇🥈🥉) para los top 3 y `#N` para el resto.

2. **Dashboard General** — `RatingEvolutionChart` existente (con fix de datos) mostrando `avgTotal` de todos los jugadores.

3. **Grid 2×2 de stats** — cuatro instancias de `StatLineChart` en modo multi-jugador, cada una mostrando todos los jugadores en esa stat. Misma paleta de colores por jugador en los cuatro gráficos para consistencia.

4. **Tabla comparativa** — `ComparisonTable` existente al final.

### `StatLineChart.tsx` — NUEVO

Componente reutilizable para líneas de una o múltiples series. Props:

```typescript
interface StatLineChartProps {
  sessions: MatchSession[];           // eje X
  data: {
    playerId: string;
    playerName: string;
    color: string;
    values: { sessionId: string; value: number | null }[];
  }[];
  label: string;                      // título del gráfico
  yDomain?: [number, number];         // default [0, 10]
}
```

Usa `recharts` (ya instalado). Tooltip con el mismo estilo custom que `RatingEvolutionChart`.

### `MVPRanking.tsx` — NUEVO

Props: `topMVPs: { player_id: string; username: string; total_mvps: number }[]`

Lista vertical simple. Cada ítem: posición (medalla o `#N`), nombre del jugador, badge con total de MVPs. Usa `card-sport` del design system existente.

---

## Actions (`stats.ts`)

### `getTopMVPs` — Fix

```typescript
export async function getTopMVPs(limit = 10) {
  // Fetch all rows with mvp_count > 0
  // Group by player_id in JS
  // Sum mvp_count per player
  // Sort descending, slice to limit
}
```

Retorna: `{ player_id, username, total_mvps }[]`

### Sin nuevas actions necesarias

Los datos de sesiones + historical_ratings ya están disponibles via `getHistoricalStats()`. Los gráficos de evolución por stat se construyen en el cliente a partir de esas filas.

---

## Comportamiento en mobile

- El selector de jugadores (PersonalTab) hace scroll horizontal si los chips no entran.
- El grid 2×2 colapsa a 1 columna en pantallas < 768px.
- La tabla comparativa mantiene `overflowX: auto` (ya implementado).

---

## Out of scope

- Filtros por rango de fechas o sesiones específicas.
- Exportar datos.
- Animaciones entre pestañas.
- Comparar dos jugadores seleccionados (PersonalTab solo muestra uno a la vez).
