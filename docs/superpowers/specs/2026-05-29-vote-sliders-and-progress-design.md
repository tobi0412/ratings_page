# Diseño: Nuevos Sliders de Votación y Actualización de Progreso en Tiempo Real

Este documento detalla el diseño para actualizar las etiquetas de los sliders de votación en la interfaz de usuario, y para optimizar el flujo de actualización del progreso de votación para que se refleje inmediatamente al guardar un voto.

## Requerimientos

1. **Nuevos Sliders y Etiquetas**:
   - Cambiar "Visión de Juego" / "Visión" por **"Toma de Decisiones"** con el icono de cerebro `🧠`.
   - Modificar "Físico" por **"Esfuerzo Físico"** (manteniendo el icono `💪`).
   - Modificar "Técnica" por **"Habilidad Técnica"** (manteniendo el icono `🎯`).
   - Mantener "Actitud" (icono `🔥`).
   - **Nota**: El esquema de base de datos no cambia. La columna `vision_juego` se mapea a "Toma de Decisiones", `tecnica` a "Habilidad Técnica", y `fisico` a "Esfuerzo Físico".

2. **Actualización de Progreso en el Momento**:
   - Cuando el usuario hace clic en "Guardar voto" o "Actualizar voto", el progreso de votación (los votos realizados sobre el total de jugadores a calificar) debe actualizarse de forma inmediata en la pantalla del Dashboard.

## Componentes y Archivos Afectados

### 1. [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx)
- Actualizar `METRIC_LABELS` y `METRIC_ICONS` para reflejar las nuevas descripciones e iconos:
  - `tecnica`: "Habilidad Técnica"
  - `fisico`: "Esfuerzo Físico"
  - `vision_juego`: "Toma de Decisiones"
  - `vision_juego` icon: `🧠`
- Cambiar la definición de la prop `onSuccess` para pasar el objeto `Rating` retornado por la base de datos:
  ```typescript
  onSuccess?: (rating: Rating) => void;
  ```
- Llamar a `onSuccess?.(result.data)` cuando el voto se guarda exitosamente.

### 2. [page.tsx (Dashboard)](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)
- Implementar la función callback en la prop `onSuccess` de cada `<VotingCard />`:
  ```typescript
  onSuccess={(newRating) => {
    setMyVotes((prev) => {
      const exists = prev.some((v) => v.receiver_id === newRating.receiver_id);
      if (exists) {
        return prev.map((v) => (v.receiver_id === newRating.receiver_id ? newRating : v));
      }
      return [...prev, newRating];
    });
  }}
  ```
- Esto actualizará el array `myVotes` en el estado local de Next.js, lo que recalculará inmediatamente la variable `votedCount = myVotes.length` y actualizará el componente `<VotingProgress />` con transiciones fluidas.

### 3. Historial y Comparativas (Vistas de solo lectura)
Actualizar los nombres de los atributos e iconos correspondientes en las siguientes pantallas para mantener la consistencia:
- [ComparisonTable.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/charts/ComparisonTable.tsx): Cambiar los headers a "🎯 Hab. Técnica", "💪 Esf. Físico", "🧠 Toma de Decisiones".
- [TeamTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx): Cambiar etiquetas en los gráficos `<StatLineChart />`: "🎯 Habilidad Técnica", "💪 Esfuerzo Físico", "🧠 Toma de Decisiones".
- [PersonalTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx): Cambiar las tarjetas de métricas (`statCards`) y etiquetas de gráficos de línea correspondientes a las nuevas descripciones y al icono `🧠`.

## Plan de Verificación

### Pruebas Manuales
1. Entrar en la vista de votación (Dashboard).
2. Verificar que las etiquetas de los sliders muestren los nuevos nombres: "Habilidad Técnica", "Esfuerzo Físico", "Actitud" y "Toma de Decisiones" con sus iconos.
3. Guardar un voto para un jugador y verificar que el progreso de votación (ej: `2 / 10 votos`) se incremente inmediatamente y la barra de progreso avance de forma animada.
4. Modificar un voto guardado anteriormente y verificar que el progreso se mantenga igual (no se duplique).
5. Visitar la pestaña de Historial (Team y Personal) y verificar que los nombres de los gráficos y columnas de tabla coincidan con las nuevas denominaciones.
