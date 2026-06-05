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