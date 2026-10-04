# Requirements Traceability Matrix

## Propósito

Esta matriz establece la trazabilidad entre requisitos, responsabilidades de software, arquitectura y futura verificación.

| Requirement ID | Requirement | Source | Software Requirement | Design / Component | Test | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático con intervalo configurable | Issue #1 | SWR-FR-001, SWR-IR-002 | Scanner Runtime + QvaPay Adapter | TBD | QvaPay contract test + integration test | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Issue #1 | SWR-FR-002, SWR-DR-001 | Durable Object + Snapshot Repository | TBD | Runtime/integration evidence | Defined |
| SYS-FR-003 | Ofertas SELL por moneda y tasa ascendente | Issue #1 | SWR-FR-003 | Offer Normalizer + SELL Book | TBD | Domain/unit test | Defined |
| SYS-FR-004 | Ofertas BUY por moneda y tasa ascendente | Issue #1 | SWR-FR-004 | Offer Normalizer + BUY Book | TBD | Domain/unit test | Defined |
| SYS-INT-001 | Consulta del mercado P2P mediante GET /p2p | Issue #5 | SWR-IR-001, SWR-IR-002 | QvaPay Adapter | CT-P2P-001 | QvaPay contract evidence | Defined |
| SYS-INT-002 | Separación estricta BUY/SELL | Issue #5 | SWR-FR-003, SWR-FR-004 | Domain OfferSide | CT-P2P-002 | Contract + domain test | Defined |
| SYS-INT-003 | Conservación de coin como identidad de mercado | Issue #5 | SWR-FR-003, SWR-FR-004 | Market / Offer | CT-P2P-003 | Contract + domain test | Defined |
| SYS-INT-004 | Soporte de paginación | Issue #5 | SWR-IR-002 | QvaPay Adapter | CT-P2P-004 | Integration evidence | Defined |
| SYS-INT-005 | Respeto de límites y caché | Issue #5 | SWR-IR-002 | Scanner Scheduler | IT-P2P-005 | Runtime evidence | Defined |
| SYS-INT-006 | Backoff ante 429 | Issue #5 | SWR-SR-002 | QvaPay Adapter + Retry Policy | CT-P2P-006 | Integration evidence | Defined |
| SYS-INT-007 | Validación del esquema externo | Issue #5 | SWR-IR-001, SWR-DR-002 | Schema Validator + Mapper | CT-P2P-007 | Contract test | Defined |
| SYS-QR-003 | Integridad de clasificación y mercado | Issue #3 | SWR-FR-003, SWR-FR-004 | Domain | UT-OFFER-001 | Unit test | Defined |
| SYS-QR-005 | Resiliencia ante errores del proveedor | Issue #3, #5 | SWR-DR-001, SWR-SR-002 | Scanner Runtime | IT-SCAN-001 | Integration evidence | Defined |
| SYS-QR-006 | Validación de datos externos | Issue #3, #5 | SWR-IR-001, SWR-SR-001 | Adapter Boundary | CT-P2P-007 | Contract test | Defined |

## Convención de pruebas

- **UT** — Unit Test.
- **IT** — Integration Test.
- **CT** — Contract Test.
- **E2E** — End-to-End Test.

Los identificadores de prueba anteriores son objetivos de trazabilidad; no representan pruebas ejecutadas todavía.

## Estados

- **Defined:** requisito definido y trazable.
- **Implemented:** existe implementación identificable.
- **Tested:** existe prueba ejecutada.
- **Verified:** existe evidencia suficiente de verificación.
- **TBD:** información todavía no definida o verificada.

## Regla de trazabilidad

Un requisito no se considerará completamente cerrado hasta disponer, cuando corresponda, de su relación con implementación, prueba y evidencia de verificación.
