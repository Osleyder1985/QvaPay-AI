# Requisitos iniciales de calidad

## SYS-QR-001 — Disponibilidad del scanner

El scanner deberá funcionar sin usuarios conectados.

**Estado:** Tested; producción requiere evidencia del workflow Cloudflare.

## SYS-QR-002 — Configurabilidad

El intervalo deberá validarse entre 5 y 300 segundos.

**Estado:** Tested.

## SYS-QR-003 — Integridad de clasificación

BUY, SELL y mercados distintos no deberán mezclarse.

**Estado:** Tested.

## SYS-QR-004 — Trazabilidad temporal

Cada oferta observada deberá conservar `observedAt`.

**Estado:** Tested.

## SYS-QR-005 — Resiliencia ante proveedor

Un fallo temporal no deberá eliminar el último snapshot válido.

**Estado:** Tested.

## SYS-QR-006 — Validación externa

Los datos QvaPay deberán validarse antes del dominio.

**Estado:** Tested.

## SYS-QR-007 — Testabilidad

El dominio deberá poder probarse sin servicios externos.

**Estado:** Tested.

## Requisitos futuros

Idempotencia de eventos, reconciliación y seguridad de webhook permanecen asociados a la futura ingestión event-driven.
