# Requisitos iniciales de software

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

QvaPay se integra mediante `QvaPayP2PClient`.

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

D1 permanece futuro.

## SWR-DR-002 — Decimal Value Preservation

Los valores económicos externos se representan como strings.

**Estado:** Tested.

## SWR-QR-001 — Controlled Retry

Los reintentos son limitados y utilizan backoff.

**Estado:** Tested.

## SWR-SR-001 — Secret Isolation

Las credenciales se mantienen server-side.

**Estado:** Implemented.

## Capacidades futuras

`SWR-IR-004` y `SWR-IR-005` relacionados con ingestión event-driven y reconciliación permanecen como requisitos futuros hasta que exista implementación y evidencia.
