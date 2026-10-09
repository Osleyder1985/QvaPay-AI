# Requisitos iniciales de software

## Propósito

Definir requisitos de software verificables y su relación con los requisitos de sistema. Este documento no autoriza implementación por sí mismo.

## Requisitos existentes

## SWR-FR-001 — Caso de uso de escaneo de mercado

El software ejecuta un escaneo y produce un mercado normalizado.
**Trazabilidad:** SYS-FR-001.
**Estado:** Probado.

## SWR-FR-002 — Runtime continuo del scanner

El runtime ejecuta el scanner sin depender de una sesión de usuario.
**Trazabilidad:** SYS-FR-002.
**Estado:** Probado.

## SWR-FR-003 — Procesamiento del libro SELL

El software mantiene BUY y SELL separados y ordena SELL por tasa ascendente.
**Trazabilidad:** SYS-FR-003.
**Estado:** Probado.

## SWR-FR-004 — Procesamiento del libro BUY

El software mantiene BUY y SELL separados y determina la mejor BUY mediante la mayor tasa.
**Trazabilidad:** SYS-FR-004.
**Estado:** Probado.

## SWR-IR-001 — Adaptador del proveedor externo

QvaPay se integra mediante QvaPayP2PClient.
**Estado:** Probado.

## SWR-IR-002 — Política de solicitudes al proveedor

El adaptador gestiona paginación, timeout, rate limiting, backoff y errores.
**Estado:** Probado.

## SWR-IR-003 — Validación del contrato externo

El contrato externo se valida antes del mapeo.
**Estado:** Probado.

## SWR-DR-001 — Persistencia del snapshot de mercado

El snapshot se conserva en el almacenamiento del Durable Object.
**Estado:** Implementado / Probado.

## SWR-DR-002 — Conservación de valores decimales

Los valores económicos externos se representan como strings.
**Estado:** Probado.

## SWR-QR-001 — Reintento controlado

Los reintentos son limitados y utilizan backoff.
**Estado:** Probado.

## SWR-SR-001 — Aislamiento de secretos

Las credenciales se mantienen del lado del servidor.
**Estado:** Implementado.

## Nuevos requisitos de software

### SWR-AUD-001 — Persistencia de eventos de auditoría

Los eventos de auditoría deben persistirse de forma durable, consultable y trazable.
**Trazabilidad:** SYS-AUD-001, SYS-AUD-004.
**Estado:** Definido / Bloqueado.

### SWR-AUD-002 — Captura de transiciones de estado de auditoría

Los eventos deben poder registrar estado anterior, estado posterior, resultado y motivo cuando aplique.
**Trazabilidad:** SYS-AUD-003.
**Estado:** Definido / Bloqueado.

### SWR-AUD-003 — Integridad y retención de auditoría

El sistema debe aplicar controles de integridad, retención, acceso y preservación de evidencia.
**Trazabilidad:** SYS-AUD-005, SYS-AUD-006, SYS-AUD-007.
**Estado:** Definido / Bloqueado.

### SWR-ACC-001 — Libro mayor económico

Las operaciones económicas deben persistirse como un libro mayor auditable, con referencias internas y externas.
**Trazabilidad:** SYS-ACC-001, SYS-ACC-004.
**Estado:** Definido / Bloqueado.

### SWR-ACC-002 — Asientos contables

El diseño debe evaluar y documentar un modelo de partida doble/general libro mayor antes de implementación.
**Trazabilidad:** SYS-ACC-010.
**Estado:** Definido / Bloqueado.

### SWR-ACC-003 — Cierre de períodos

Los períodos contables deben soportar apertura, movimientos, conciliación, cierre y evidencia reproducible; los períodos cerrados deben ser inmutables.
**Trazabilidad:** SYS-ACC-007, SYS-ACC-012.
**Estado:** Definido / Bloqueado.

### SWR-ACC-004 — Conciliación

Las operaciones internas deben poder reconciliarse con fuentes externas y conservar la evidencia de las diferencias.
**Trazabilidad:** SYS-ACC-009.
**Estado:** Definido / Bloqueado.

### SWR-ACC-005 — Minimización de instrumentos de pago

Los registros contables deben minimizar datos de tarjetas y medios de pago y evitar almacenamiento de secretos de autenticación.
**Trazabilidad:** SYS-ACC-011.
**Estado:** Definido / Bloqueado.

## Gobernanza

Los nuevos requisitos no autorizan implementación. Cada solución debe seguir #270 y alcanzar evidencia objetiva antes de cambiar de estado.
