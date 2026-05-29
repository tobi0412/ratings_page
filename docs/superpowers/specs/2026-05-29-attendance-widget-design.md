# Diseño: Añadir Métrica de Asistencia al Histórico

Este documento detalla el diseño para incorporar la métrica de **"Asistencia"** (porcentaje y número de sesiones jugadas sobre el total de sesiones cerradas) tanto en el Resumen Personal de la pestaña *Histórico Personal*, como en la tabla comparativa de la pestaña *Comparativas por Equipo*.

## Requerimientos

1. **Definición de Asistencia**:
   - Porcentaje de sesiones completadas en las que participó el jugador sobre el total de sesiones completadas/cerradas.
   - Formato: `XX% (X/Y)` (por ejemplo, `80% (8/10)`).

2. **Pestaña Personal (PersonalTab)**:
   - Añadir una nueva tarjeta en la sección de "Resumen" al final de la vista personal.
   - Etiqueta: `ASISTENCIA`.
   - Valor: `XX% (X/Y)`.

3. **Pestaña del Equipo (ComparisonTable / TeamTab)**:
   - Añadir una columna nueva llamada `Asistencia` en la tabla `Comparativa del Equipo`.
   - Mostrar el valor formateado `XX% (X/Y)` para cada jugador.

## Cambios Propuestos

### 1. Modelos de Datos Comunes

#### [MODIFY] [index.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/types/index.ts)
- Definir y exportar de forma centralizada la interfaz `PlayerStats` para evitar la duplicación de código en múltiples componentes:
```typescript
export interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
  sessionsCount: number; // Cantidad de sesiones cerradas en las que participó el jugador
}
```

### 2. Backend (Server Actions)

#### [MODIFY] [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)
- Actualizar `getAllPlayersStats` para que calcule `sessionsCount` a partir de la longitud del array `historical_ratings` de cada perfil:
```typescript
    statsMap[profile.id] = {
      profile: profileData,
      avgTotal: avg("avg_total"),
      avgTecnica: avg("avg_tecnica"),
      avgFisico: avg("avg_fisico"),
      avgActitud: avg("avg_actitud"),
      avgVision: avg("avg_vision_juego"),
      mvpCount: playerRatings.reduce((sum, r) => sum + (r.mvp_count || 0), 0),
      sessionsCount: playerRatings.length, // Sesiones jugadas
    };
```

### 3. Componentes Frontend (Histórico)

#### [MODIFY] [PersonalTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx)
- Reemplazar la definición local de `PlayerStats` por la importación desde `@/types`.
- Calcular el porcentaje de asistencia del jugador seleccionado:
```typescript
const totalSessions = sessions.length;
const attendancePercentage = totalSessions > 0 
  ? (selectedPlayer.sessionsCount / totalSessions) * 100 
  : 0;
```
- Agregar el séptimo bloque de datos al array `statCards`:
```typescript
{
  label: "Asistencia",
  value: `${attendancePercentage.toFixed(0)}% (${selectedPlayer.sessionsCount}/${totalSessions})`,
  color: "#a0c4ac",
}
```

#### [MODIFY] [TeamTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx)
- Reemplazar la definición local de `PlayerStats` por la importación desde `@/types`.
- Pasar el total de sesiones a `ComparisonTable`:
```tsx
<ComparisonTable stats={stats} totalSessionsCount={sessions.length} />
```

#### [MODIFY] [ComparisonTable.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/charts/ComparisonTable.tsx)
- Reemplazar la definición local de `PlayerStats` por la importación desde `@/types`.
- Añadir el prop `totalSessionsCount: number` a la interfaz `ComparisonTableProps`.
- Registrar un icono apropiado de calendario/asistencia desde `src/components/Icons.tsx` (ej: `CalendarIcon` u otro similar).
- Añadir el header a la tabla:
```typescript
{ label: "Asistencia", icon: <CalendarIcon size={14} style={{ color: "#a0c4ac" }} />, align: "center" }
```
- Calcular y mostrar el porcentaje por fila del jugador:
```typescript
const attendancePercentage = totalSessionsCount > 0 
  ? (player.sessionsCount / totalSessionsCount) * 100 
  : 0;
```
- Añadir la celda `<td>` correspondiente.

## Plan de Verificación

### Pruebas Manuales
1. Ir a la pestaña **Histórico**.
2. En **Estadísticas Personales**, verificar la sección **Resumen** inferior y confirmar que aparece la tarjeta `ASISTENCIA` con la relación correcta (ej: `100% (2/2)` o la proporción adecuada).
3. En **Comparativas por Equipo**, verificar que la tabla comparativa tenga una columna `Asistencia` con el icono y el texto formateado correspondiente para cada jugador.
