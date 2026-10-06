# Requisitos de integración — QvaPay P2P

## SYS-INT-001 — Consulta del mercado P2P

El sistema deberá consultar `GET /p2p`.

**Estado:** Tested.

## SYS-INT-002 — Separación por tipo y mercado

El sistema deberá procesar `type=buy|sell` y `coin` de forma independiente.

**Estado:** Tested.

## SYS-INT-003 — Paginación

El sistema deberá procesar todas las páginas requeridas.

**Estado:** Tested.

## SYS-INT-004 — Autenticación de servidor

Las credenciales deberán permanecer exclusivamente en servidor.

**Estado:** Implemented; la verificación pública de ausencia de secretos forma parte del smoke del dashboard.

## SYS-INT-005 — Validación del contrato externo

Las respuestas deben validarse antes del mapeo.

**Estado:** Tested.

## SYS-INT-006 — Rate limiting

Los `429` deben usar backoff controlado.

**Estado:** Tested.

## SYS-INT-007 — Errores de proveedor

Se deben distinguir autenticación, solicitud inválida, rate limiting y fallos transitorios.

**Estado:** Tested.

## SYS-INT-008 — Precisión decimal

Los importes del contrato se conservan como strings.

**Estado:** Tested.

## SYS-INT-009 — Consulta de mercado

El escáner utiliza GET para lectura del mercado.

**Estado:** Tested.

La aplicación de una oferta se mantiene como operación separada mediante `applyOffer()`.

## SYS-INT-010 — Frescura de observación

Cada oferta mapeada conserva `observedAt`.

**Estado:** Tested.

## SYS-INT-011 — Caché del proveedor

La documentación de operación no debe interpretar un intervalo corto como garantía de datos más frescos que los entregados por QvaPay.

**Estado:** Defined.

## SYS-INT-012 — Evolución segura del contrato

Cambios incompatibles deben producir un error controlado.

**Estado:** Tested.
