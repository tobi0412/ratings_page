# Diseño: Calcular Asistencia Según la Fecha de Ingreso del Jugador

Este documento detalla el diseño para ajustar la métrica de **"Asistencia"** de los jugadores de modo que el total de sesiones elegibles (denominador) se calcule considerando únicamente las sesiones de juego que fueron creadas en o después de la fecha en que el jugador se unió al equipo (fecha de creación de su perfil `created_at`).

## Requerimientos
1. El porcentaje y número de sesiones jugadas sobre el total elegible debe calcularse por jugador.
2. Una sesión es elegible para un jugador si `session.created_at >= profile.created_at`.
3. Este cálculo debe aplicarse en:
   - **Histórico Personal** (Pestaña Personal, tarjeta de Asistencia y progreso).
   - **Comparativas por Equipo** (Tabla comparativa y Ranking de Asistencia).

## Cambios Propuestos

### 1. Histórico Personal

#### [MODIFY] [PersonalTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx)
- Calcular `totalSessions` para el jugador seleccionado utilizando su fecha de creación de perfil.
- Comparar `new Date(session.created_at) >= new Date(selectedPlayer.profile.created_at)`.

### 2. Tabla Comparativa

#### [MODIFY] [ComparisonTable.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/charts/ComparisonTable.tsx)
- Modificar las props para recibir `sessions: MatchSession[]` en lugar de `totalSessionsCount: number`.
- Calcular el total de sesiones elegibles y el porcentaje de asistencia de manera individual para cada jugador en el mapeo de la tabla.

### 3. Ranking de Asistencia

#### [MODIFY] [AttendanceRanking.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/charts/AttendanceRanking.tsx)
- Modificar las props para recibir `sessions: MatchSession[]` en lugar de `totalSessionsCount: number`.
- Calcular el total de sesiones elegibles y el porcentaje de asistencia de manera individual para cada jugador para ordenar y renderizar el ranking.

### 4. Pestaña del Equipo

#### [MODIFY] [TeamTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx)
- Pasar el array `sessions` a `<ComparisonTable>` y `<AttendanceRanking>` en lugar de `sessions.length`.

## Plan de Verificación

### Pruebas Manuales
1. Entrar en la sección **Histórico**.
2. Verificar que un jugador que se registró después de que ya se hubieran jugado varias sesiones no tenga un porcentaje de asistencia penalizado por las sesiones previas a su registro.
3. Comprobar que en la pestaña **Comparativas por Equipo**, la columna de asistencia de cada jugador muestre un denominador acorde a su fecha de registro (ej. `X/2` para un jugador nuevo vs `X/10` para un miembro original).
4. Comprobar que el ranking de asistencia de la pestaña **Comparativas por Equipo** ordene a los jugadores correctamente según este porcentaje ajustado.
