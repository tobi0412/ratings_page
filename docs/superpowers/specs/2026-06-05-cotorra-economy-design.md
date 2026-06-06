# Cotorra Economy: Ecosistema de Moneda Virtual, Apuestas y Fidelización

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

---

## 2. Control de la Feature Flag (`IS_CURRENCY_ENABLED`)

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

## 3. Modelo de Datos (Esquema de BD)

Creamos las siguientes tablas satélites para el módulo de economía:

```sql
-- Billeteras de usuarios
CREATE TABLE IF NOT EXISTS economy_wallets (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones e historial de balance
CREATE TABLE IF NOT EXISTS economy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('reward_performance', 'reward_bonus', 'purchase', 'bet_place', 'bet_win', 'bet_refund')),
  match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apuestas deportivas
CREATE TABLE IF NOT EXISTS economy_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_type VARCHAR NOT NULL CHECK (bet_type IN ('player_prop_over', 'player_prop_under', 'team_total_over', 'team_total_under')),
  target_player_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL para Team Totals
  line_value NUMERIC(3, 1) NOT NULL,
  odds NUMERIC(4, 2) NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Inventario de ítems comprados
CREATE TABLE IF NOT EXISTS economy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id VARCHAR NOT NULL,
  item_type VARCHAR NOT NULL CHECK (item_type IN ('tactical', 'avatar_border', 'field_design', 'profile_title')),
  match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL, -- Para consumibles de sesión
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_player_item_match UNIQUE(player_id, item_id, match_id)
);

-- Equipamiento de cosméticos activos
CREATE TABLE IF NOT EXISTS economy_equipped (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_border VARCHAR,
  field_design VARCHAR,
  profile_title VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Economía Base: Acuñación de "Cotorra Coins" (CC)

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

  *La racha se calcula contando regresivamente las sesiones cerradas consecutivas en las que el jugador estuvo registrado en `session_participants`.*

---

## 5. Sección de Apuestas Deportivas (/bets)

Una nueva pestaña que abre un mercado de especulación interna. Las apuestas se abren automáticamente al crearse una nueva sesión en `/admin` y se cierran obligatoriamente al inicio del partido (definido por el momento en que se envía la primera calificación/voto de la sesión).

- **Apuesta a Rendimiento Individual ("Player Prop")**: El usuario puede apostar CC a si un compañero superará o no una línea base de calificación impuesta por el sistema en base a su promedio histórico al momento de crear la sesión (ej. Rating de Juan: Más de 7.2 / Menos de 7.2).
  - *Regla de Integridad*: Apostar por un jugador (a favor o en contra) bloquea completamente la capacidad de calificar a ese jugador en la sesión. En la pantalla de `/dashboard`, su `VotingCard` se mostrará bloqueada. Su voto emitido por el apostador hacia ese jugador se autocalculará usando el promedio de los votos recibidos por el resto de los participantes para evitar fraudes.
- **Apuesta de Rendimiento Colectivo ("Team Total")**: Apuesta al valor del slider del `TeamRatingCard` que promediará la fecha (ej. El equipo rinde +6.5 global).

### Lógica de Cuotas Dinámicas (Con 40% de House Edge)
Las cuotas se calculan al momento de realizar la apuesta:
1. Obtenemos el promedio histórico general del jugador ($\mu$), su promedio en los últimos 3 partidos ($\text{avg}_3$) y su desviación estándar ($\sigma$, default a $0.8$ si hay menos de 3 partidos).
2. Calculamos el factor de forma reciente: $z = \frac{\text{avg}_3 - \mu}{\sigma}$.
3. Determinamos la probabilidad de superar la línea:
   * $P(\text{Over}) = 0.5 + 0.1 \times z$ (acotado entre $0.15$ y $0.85$).
   * $P(\text{Under}) = 1.0 - P(\text{Over})$.
4. Calculamos las cuotas aplicando un **40% de House Edge**:
   * $\text{Odds}(\text{Over}) = \text{ROUND}(0.6 / P(\text{Over}), 2)$ (mínimo $1.05\text{x}$, máximo $3.00\text{x}$).
   * $\text{Odds}(\text{Under}) = \text{ROUND}(0.6 / P(\text{Under}), 2)$.
   * *Si no hay historial:* Se asigna una cuota fija de $1.20\text{x}$ para ambas opciones (Over/Under).

---

## 6. La Tienda de la Cotorra: El Mercado Negro (/shop)

Pestaña exclusiva para el intercambio de las CC acumuladas, dividida en dos categorías de productos:

### A) Consumibles Tácticos (Hackeo de Privacidad)

- **Escudo de Anonimato** (Costo: Alto - 1500 CC): Inmunidad total en la ruleta del `MysteryVoteWidget` para la sesión actual. El nombre del jugador se remueve del bombo de selección de forma invisible al cerrarse la sesión (se le excluye de la selección de `mystery_player_id`).
- **Infiltración de Datos** (Costo: Muy Alto - 2500 CC): Revela instantáneamente y de forma privada el voto completo y las calificaciones que un jugador específico te puso en la última sesión, saltándose la ruleta de revelación general.

### B) Cosméticos de Prestigio (Estética Deportiva)

- **Bordes de Avatar Animados**: Bordes interactivos CSS basados en el ecosistema (Efecto fuego verde neón `#00e676`, borde Oro MVP con destellos, o borde Madera Rota).
- **Diseños de Cancha Personalizados**: Cambia el fondo del `FootballField` en `/profile/[id]` por estéticas alternativas:
  - **Estadio Nocturno**: Fondo pitch black, focos LED potentes y líneas cian.
  - **Potrero de Tierra**: Textura arcillosa y marrón con líneas de tiza desgastadas.
  - **Fútbol 5 Sintético**: Grid de césped artificial moderno con destellos neón ámbar.
- **Títulos de Perfil**: Textos cortos autoelegibles en fuente *Barlow Condensed* micro-text debajo del nombre del jugador (ej. "Terminator de Tobillos", "Lírico Incomprendido", "Cero Pulmón").

---

## 7. Plan de Verificación

### Pruebas Automatizadas
- Tests unitarios de fórmulas de acuñación (`mintCoinsForSession`) y cálculo de cuotas (house edge del 40%, z-score y límites de cuota).
- Tests de flujo de resolución de apuestas.

### Pruebas Manuales
- Validar el bloqueo de `VotingCard` en `/dashboard` tras colocar una apuesta.
- Comprar e infiltrar datos de un compañero, comprobando que se muestren las calificaciones exactas recibidas.
- Validar que al activar el Escudo de Anonimato, el jugador no pueda ser elegido como Mystery Player al cerrar la sesión.
- Validar el equipamiento de cosméticos en `/profile` y su renderizado en `/profile/[id]` (bordes, títulos y fondos de cancha).
