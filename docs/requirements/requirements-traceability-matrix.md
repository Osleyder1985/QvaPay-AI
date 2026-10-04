# Matriz de trazabilidad de requisitos

## Propósito

Esta matriz establece la trazabilidad entre los requisitos del sistema, su implementación, las pruebas ejecutables y la evidencia de verificación disponible.

| Requirement ID | Requirement | Source | Software Requirement | Design / Component | Test | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático con intervalo configurable | Issue #1 | SWR-FR-001 | Scanner Scheduler | TBD | TBD | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Issue #1 | SWR-FR-002 | Durable Object / Alarm | TBD | TBD | Defined |
| SYS-FR-003 | Ofertas SELL por moneda y tasa ascendente | Issue #1 | SWR-FR-003 | Market / Offer | tests/domain/market.test.ts | CI Quality Gate | Implemented |
| SYS-FR-004 | Ofertas BUY por moneda y tasa ascendente | Issue #1 | SWR-FR-004 | Market / Offer | tests/domain/market.test.ts | CI Quality Gate | Implemented |
| SYS-INT-001 | Consulta del mercado P2P mediante GET /p2p | Issue #10 / QvaPay API | SWR-IR-001 | QvaPay Adapter | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-002 | Separación independiente por type y coin | Issue #10 / QvaPay API | SWR-FR-003 / SWR-FR-004 | QvaPay Adapter / Market | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-003 | Procesamiento completo de paginación | Issue #10 / QvaPay API | SWR-IR-002 | QvaPay Adapter | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-004 | Credenciales exclusivamente en servidor | Issue #10 / Security Baseline | SWR-SR-001 | Infrastructure / Secrets | TBD | TBD | Defined |
| SYS-INT-005 | Validación de respuestas externas | Issue #10 | SWR-IR-003 | Schema Validator / Mapper | tests/infrastructure/qvapay-p2p-contract.test.ts | CI Quality Gate | Tested |
| SYS-INT-006 | Backoff controlado ante 429 | Issue #10 / QvaPay API | SWR-QR-001 | Retry Policy | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-007 | Clasificación de errores del proveedor | Issue #10 | SWR-IR-002 | Error Classification | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-008 | Preservación de precisión decimal | Issue #10 / QvaPay API | SWR-DR-002 | Decimal Value Objects | tests/infrastructure/qvapay-p2p-contract.test.ts | CI Quality Gate | Tested |
| SYS-INT-009 | Integración inicial de solo lectura | Issue #10 | SWR-IR-001 | Read-only Adapter | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-010 | Timestamp propio de observación | Issue #10 | SWR-DR-001 | QvaPay Adapter observation boundary | tests/infrastructure/qvapay-p2p-client.test.ts | CI Quality Gate | Tested |
| SYS-INT-011 | Compatibilidad con caché del proveedor | Issue #10 / QvaPay API | SWR-FR-001 | Scanner Scheduling | TBD | TBD | Defined |
| SYS-INT-012 | Evolución segura del contrato | Issue #10 | SWR-IR-003 | Contract Validation | tests/infrastructure/qvapay-p2p-contract.test.ts | CI Quality Gate | Tested |

## Estados

- **Defined:** requisito aprobado a nivel de definición inicial.
- **Implemented:** existe implementación identificable, pero la evidencia de prueba puede ser incompleta.
- **Tested:** existe una prueba ejecutable que cubre el comportamiento indicado y forma parte del Quality Gate.
- **Verified:** existe evidencia suficiente de verificación frente a todos los criterios aplicables.
- **Certified:** se completó la verificación requerida y la evidencia quedó registrada.
- **Failed / Rejected:** la evidencia demuestra incumplimiento o el elemento fue rechazado.
- **Blocked:** la verificación requerida no puede ejecutarse por una dependencia o condición externa.
- **TBD:** información todavía no definida o verificada.

## Regla de trazabilidad

Un requisito no se considerará completamente cerrado hasta disponer, cuando corresponda, de su relación con implementación, prueba y evidencia de verificación.

Los identificadores de casos de prueba formales no se consideran evidencia por sí mismos. Cuando una prueba todavía no tiene un registro formal independiente, la matriz referencia directamente el archivo ejecutable que contiene la prueba.

## Trazabilidad de ingestión event-driven

| Requirement ID | Software Requirement | Architecture / Component | Planned Test |
|---|---|---|---|
| SYS-QR-008 | SWR-IR-004 | Event Ingestion Boundary | TBD |
| SYS-QR-009 | SWR-IR-005 | Reconciliation | TBD |
| SYS-QR-010 | SWR-IR-004 / SWR-SR-001 | Webhook Boundary / Secret Store | TBD |
| SYS-QR-005 | SWR-IR-002 | QvaPay Adapter | TBD |
| SYS-QR-006 | SWR-IR-003 / SWR-IR-004 | Integration Boundary | TBD |

## Trazabilidad de la implementación inicial

| Requirement | Implementation | Test | Current Status |
|---|---|---|---|
| SYS-FR-003 | `src/domain/market.ts` + `src/domain/offer.ts` | `tests/domain/market.test.ts` | Implemented |
| SYS-FR-004 | `src/domain/market.ts` + `src/domain/offer.ts` | `tests/domain/market.test.ts` | Implemented |
| SYS-QR-003 | `src/domain/market.ts` | `tests/domain/market.test.ts` | Implemented |
| SYS-QR-006 | `src/domain/offer.ts` | `tests/domain/offer.test.ts` | Implemented |
| SYS-QR-007 | Dominio sin dependencias externas | Tests unitarios del dominio | Implemented |

La ejecución de pruebas puede llevar un elemento a Tested; Verified requiere evidencia suficiente frente a los criterios aplicables. Certified requiere cumplir además las reglas de la política de verificación y certificación. Los estados de nivel sistema permanecen sin elevarse por una implementación parcial de componentes.

## Implementación del adaptador QvaPay P2P

| Requirement | Implementation | Test | Status |
|---|---|---|---|
| SYS-INT-001 | `src/infrastructure/qvapay/qvapay-p2p-client.ts` | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-002 | `src/infrastructure/qvapay/qvapay-p2p-client.ts` + mapper | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-003 | Paginación `page` / `last_page` | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-006 | Retry-After + backoff acotado ante HTTP 429 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-007 | Clasificación de autenticación, solicitud inválida y fallos transitorios | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-008 | Decimales preservados como strings | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Tested |
| SYS-INT-009 | Cliente exclusivamente GET /p2p | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-010 | `observedAt` generado en la frontera de observación del adaptador | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-012 | Validación estricta del contrato externo | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Tested |
