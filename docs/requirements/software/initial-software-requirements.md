# Requisitos iniciales de software

## Propósito

Definir requisitos de software verificables y su relación con los requisitos de sistema. Este documento no autoriza implementación por sí mismo.

## Requisitos existentes

## SWR-FR-001 — Scan Market Use Case
El software ejecuta un escaneo y produce un mercado normalizado.
**Trazabilidad:** SYS-FR-001.
**Estado:** Tested.

## SWR-FR-002 — Continuous Scanner Runtime
El runtime ejecuta el scanner sin depender de una sesión de usuario.
**Trazabilidad:** SYS-FR-002.
**Estado:** Tested.

## SWR-FR-003 — SELL Book Processing
El software mantiene BUY y SELL separados y ordena SELL por tasa ascendente.
**Trazabilidad:** SYS-FR-003.
**Estado:** Tested.

## SWR-FR-004 — BUY Book Processing
El software mantiene BUY y SELL separados y determina la mejor BUY mediante la mayor tasa.
**Trazabilidad:** SYS-FR-004.
**Estado:** Tested.

## SWR-IR-001 — External Provider Adapter
QvaPay se integra mediante QvaPayP2PClient.
**Estado:** Tested.

## SWR-IR-002 — Provider Request Policy
El adaptador gestiona paginación, timeout, rate limiting, backoff y errores.
**Estado:** Tested.

## SWR-IR-003 — External Contract Validation
El contrato externo se valida antes del mapeo.
**Estado:** Tested.

## SWR-DR-001 — Market Snapshot Persistence
El snapshot se conserva en el almacenamiento del Durable Object.
**Estado:** Implemented / Tested.

## SWR-DR-002 — Decimal Value Preservation
Los valores económicos externos se representan como strings.
**Estado:** Tested.

## SWR-QR-001 — Controlled Retry
Los reintentos son limitados y utilizan backoff.
**Estado:** Tested.

## SWR-SR-001 — Secret Isolation
Las credenciales se mantienen server-side.
**Estado:** Implemented.

## Nuevos requisitos de software

### SWR-AUD-001 — Audit Event Persistence
Los eventos de auditoría deben persistirse de forma durable, consultable y trazable.
**Trazabilidad:** SYS-AUD-001, SYS-AUD-004.
**Estado:** Defined / Blocked.

### SWR-AUD-002 — Audit State Transition Capture
Los eventos deben poder registrar estado anterior, estado posterior, resultado y motivo cuando aplique.
**Trazabilidad:** SYS-AUD-003.
**Estado:** Defined / Blocked.

### SWR-AUD-003 — Audit Integrity and Retention
El sistema debe aplicar controles de integridad, retención, acceso y preservación de evidencia.
**Trazabilidad:** SYS-AUD-005, SYS-AUD-006, SYS-AUD-007.
**Estado:** Defined / Blocked.

### SWR-ACC-001 — Economic Ledger
Las operaciones económicas deben persistirse como un ledger auditable, con referencias internas y externas.
**Trazabilidad:** SYS-ACC-001, SYS-ACC-004.
**Estado:** Defined / Blocked.

### SWR-ACC-002 — Accounting Entries
El diseño debe evaluar y documentar un modelo de partida doble/general ledger antes de implementación.
**Trazabilidad:** SYS-ACC-010.
**Estado:** Defined / Blocked.

### SWR-ACC-003 — Period Close
Los períodos contables deben soportar apertura, movimientos, conciliación, cierre y evidencia reproducible; los períodos cerrados deben ser inmutables.
**Trazabilidad:** SYS-ACC-007, SYS-ACC-012.
**Estado:** Defined / Blocked.

### SWR-ACC-004 — Reconciliation
Las operaciones internas deben poder reconciliarse con fuentes externas y conservar la evidencia de las diferencias.
**Trazabilidad:** SYS-ACC-009.
**Estado:** Defined / Blocked.

### SWR-ACC-005 — Payment Instrument Minimization
Los registros contables deben minimizar datos de tarjetas y medios de pago y evitar almacenamiento de secretos de autenticación.
**Trazabilidad:** SYS-ACC-011.
**Estado:** Defined / Blocked.

## Gobernanza

Los nuevos requisitos no autorizan implementación. Cada solución debe seguir #270 y alcanzar evidencia objetiva antes de cambiar de estado.
