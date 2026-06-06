# COTORRA ECONOMY: Ecosistema de Moneda Virtual, Apuestas y Fidelización

Esta propuesta complementa la documentación técnica de **Cotorra Analytics**, introduciendo una capa de gamificación, economía virtual y especulación deportiva. El sistema está diseñado de forma **100% modular y desacoplada**, permitiendo su activación o desactivación absoluta mediante una única *Feature Flag* sin alterar el núcleo de votación e historial de la plataforma.

---

## 1. Arquitectura del Módulo y Desacoplamiento

Para garantizar la independencia total del ecosistema de monedas, todo el código, lógica y UI residen en un directorio aislado. La base de datos trata la economía como un satélite: las tablas de billeteras, transacciones y apuestas se vinculan al usuario únicamente por su `userId` (Relación 1:1 o 1:N externa), dejando las tablas core de `User`, `Session` y `Rating` intactas.

### Estructura de Archivos Aislada

```text
src/
└── modules/
    └── economy/
        ├── components/       # UI (WalletIndicator, BetsMarket, ShopGrid)
        ├── hooks/            # Estado y Queries (useWallet, useBets)
        ├── services/         # Acciones de Servidor / Mutaciones de BD
        ├── utils/            # Fórmulas de acuñación y lógica de cuotas
        └── index.ts          # Punto de entrada único expuesto al resto de la app
```

## 2. Economía Base: Acuñación de "Cotorra Coins" (CC)

Las monedas se generan de forma automatizada únicamente al momento de cerrarse una sesión por el administrador. El algoritmo premia el rendimiento deportivo y la constancia de asistencia.

### Fórmulas Oficiales de Recompensa

Al cerrarse la sesión, cada participante recibe un pago consolidado calculado de la siguiente manera:

$$\text{CC}_{\text{Total}} = \text{CC}_{\text{Rendimiento}} + \text{CC}_{\text{Premios}} + \text{Bonus}_{\text{Asistencia}}$$

- **CC por Rendimiento Individual**: Pondera la calificación promedio final del jugador en la sesión ($\text{Rating}_{\text{Final}}$):

  $$\text{CC}_{\text{Rendimiento}} = \lfloor (\text{Rating}_{\text{Final}})^2 \times 10 \rfloor$$

  *(Ejemplo: Un rating final de 7.5 otorga 562 CC. Un partido perfecto de 10.0 otorga 1000 CC).*

- **CC por Premios Especiales**:
  - MVP del Partido (Oro): $+300 \text{ CC}$
  - Premio Papelón / Jugador Caca: $-100 \text{ CC}$ *(Penalización económica por bajo rendimiento o mala actitud).*

- **Bonus de Asistencia (Racha)**: Premia la fidelidad competitiva:

  $$\text{Bonus}_{\text{Asistencia}} = \text{Racha de Partidos Consecutivos} \times 50 \text{ CC} \quad (\text{Cap máximo de } 250 \text{ CC})$$

---

## 3. Sección de Apuestas Deportivas (/bets)

Una nueva pestaña que abre un mercado de especulación interna. Las apuestas se abren automáticamente al crearse una nueva sesión en `/admin` y se cierran obligatoriamente al inicio del partido.

- **Apuesta a Rendimiento Individual ("Player Prop")**: El usuario puede apostar CC a si un compañero superará o no una línea base de calificación impuesta por el sistema en base a su promedio histórico (ej. Rating de Juan: Más de 7.2 / Menos de 7.2).
  - *Regla de Integridad*: Apostar por un jugador (a favor o en contra) bloquea completamente la capacidad de calificar a ese jugador en la sesión. En la pantalla de `/dashboard`, su `VotingCard` se mostrará bloqueada, calculándose su voto automáticamente mediante el promedio del resto del grupo para evitar fraudes.
- **Apuesta de Rendimiento Colectivo ("Team Total")**: Apuesta al valor del slider del `TeamRatingCard` que promediará la fecha (ej. El equipo rinde +6.5 global).
- **Adición Recomendada ("El Pozo del Papelón")**: Una apuesta ciega y de alta volatilidad. Los jugadores aportan un monto fijo de CC a un pozo común intentando adivinar quién se llevará el premio Papelón o Jugador Caca de la fecha. Si hay un único ganador, se lleva el 100% del pozo acumulado, potenciando el folclore previo al partido.

---

## 4. La Tienda de la Cotorra: El Mercado Negro (/shop)

Pestaña exclusiva para el intercambio de las CC acumuladas, dividida en dos categorías de productos:

### A) Consumibles Tácticos (Hackeo de Privacidad)

- **Escudo de Anonimato** (Costo: Alto - 1500 CC): Inmunidad total en la ruleta del `MysteryVoteWidget` para la sesión actual. El nombre del jugador se remueve del bombo de selección de forma invisible.
- **Infiltración de Datos** (Costo: Muy Alto - 2500 CC): Revela instantáneamente y de forma privada el voto completo y las calificaciones que un jugador específico te puso en la última sesión, saltándose la ruleta de revelación general.
- **Voto de Doble Ponderación** (Costo: Medio - 800 CC): Modificador para la siguiente sesión. Tus calificaciones numéricas valdrán el doble (2x) en el promedio de tus compañeros (ideal para salvar o hundir sutilmente a alguien).

### B) Cosméticos de Prestigio (Estética Deportiva)

- **Bordes de Avatar Animados**: Bordes interactivos CSS basados en el ecosistema (Efecto fuego verde neón `#00e676`, borde Oro MVP con destellos, o borde Madera Rota para los recurrentes del trofeo caca).
- **Diseños de Cancha Personalizados**: Cambia el fondo del `FootballField` en `/profile/[id]` por estéticas alternativas:
  - **Estadio Nocturno**: Fondo pitch black, focos LED potentes y líneas cian.
  - **Potrero de Tierra**: Textura arcillosa y marrón con líneas de tiza desgastadas.
  - **Fútbol 5 Sintético**: Grid de césped artificial moderno con destellos neón ámbar.
- **Adición Recomendada ("Títulos de Perfil")**: Textos cortos autoelegibles en fuente *Barlow Condensed* micro-text debajo del nombre del jugador (ej. "Terminator de Tobillos", "Lírico Incomprendido", "Cero Pulmón").

---

## 5. Control de la Feature Flag (IS_CURRENCY_ENABLED)

El ecosistema se rige bajo una única variable booleana centralizada:

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  IS_CURRENCY_ENABLED: process.env.NEXT_PUBLIC_ENABLE_CURRENCY === 'true',
};
```

### Comportamiento del Sistema según el Estado

| Componente / Ruta | Si true (Prendido) | Si false (Apagado Completo) |
| :--- | :--- | :--- |
| **Navbar** | Muestra el componente `<WalletIndicator/>` (Bebas Neue, color dorado) con el balance de CC. | Oculta el componente por completo. El menú se reajusta sin dejar espacios vacíos. |
| **Rutas (`/bets`, `/shop`)** | Rutas accesibles y funcionales en el menú de navegación. | El Middleware de Next.js bloquea las rutas y redirige automáticamente (302) a `/dashboard`. |
| **Dashboard (`/dashboard`)** | Las `VotingCard` verifican si hay apuestas activas para bloquear/desbloquear sliders. | Se ignora cualquier chequeo de apuestas. Todos los sliders de votación se cargan desbloqueados de forma nativa. |
| **Cierre de Sesión (`/admin`)** | Llama de forma asíncrona a `mintCoinsForSession()`, inyectando las monedas calculadas. | Proceso de economía omitido por completo (short-circuit). La sesión se cierra de forma tradicional en milisegundos. |

---

## 6. Recomendaciones Breves para la Feature Flag

- **Uso de Wrappers en UI**: No ensucies los componentes core con condicionales inline. Utiliza un componente contenedor exclusivo (`<CurrencyFeatureToggle>`) para envolver la UI de la economía. Si está apagado, simplemente retorna `null` o un elemento alternativo (fallback).
- **Desacoplamiento en API Routes**: En el backend, maneja el módulo de economía como un proceso complementario que corre en segundo plano (*Background Promise*). Al cerrar la sesión, ejecuta la acuñación dentro de un bloque condicional, asegurando que si la economía falla o está apagada, jamás interrumpa el flujo principal de guardado de calificaciones.
- **Persistencia de Datos en Estado "Apagado"**: Si apagas la flag para una "pausa de temporada", no borres las tablas de la base de datos. Al estar desacopladas, los saldos, cosméticos comprados y el historial de apuestas quedarán congelados de forma segura, listos para reactivarse intactos cuando el booleano vuelva a ser `true`.