# Matriz de trazabilidad de requisitos

## Propósito

Esta matriz establece la trazabilidad entre los requisitos del sistema y su futura implementación y verificación.

| Requirement ID | Requirement | Source | Software Requirement | Design / Component | Test | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático con intervalo configurable | Issue #1 | SWR-FR-001 | Scanner Scheduler | TBD | TBD | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Issue #1 | SWR-FR-002 | Durable Object / Alarm | TBD | TBD | Defined |
| SYS-FR-003 | Ofertas SELL por moneda y tasa ascendente | Issue #1 | SWR-FR-003 | Market / Offer | TBD | TBD | Defined |
| SYS-FR-004 | Ofertas BUY por moneda y tasa ascendente | Issue #1 | SWR-FR-004 | Market / Offer | TBD | TBD | Defined |
| SYS-INT-001 | Consulta del mercado P2P mediante GET /p2p | Issue #10 / QvaPay API | SWR-IR-001 | QvaPay Adapter | CT-QVA-001 | TBD | Defined |
| SYS-INT-002 | Separación independiente por type y coin | Issue #10 / QvaPay API | SWR-FR-003 / SWR-FR-004 | Market / Offer | CT-QVA-002 | TBD | Defined |
| SYS-INT-003 | Procesamiento completo de paginación | Issue #10 / QvaPay API | SWR-IR-002 | QvaPay Adapter | CT-QVA-003 | TBD | Defined |
| SYS-INT-004 | Credenciales exclusivamente en servidor | Issue #10 / Security Baseline | SWR-SR-001 | Infrastructure / Secrets | SEC-QVA-001 | TBD | Defined |
| SYS-INT-005 | Validación de respuestas externas | Issue #10 | SWR-IR-003 | Schema Validator / Mapper | CT-QVA-004 | TBD | Defined |
| SYS-INT-006 | Backoff controlado ante 429 | Issue #10 / QvaPay API | SWR-QR-001 | Retry Policy | CT-QVA-005 | TBD | Defined |
| SYS-INT-007 | Clasificación de errores del proveedor | Issue #10 | SWR-IR-002 | Error Classification | CT-QVA-006 | TBD | Defined |
| SYS-INT-008 | Preservación de precisión decimal | Issue #10 / QvaPay API | SWR-DR-002 | Decimal Value Objects | CT-QVA-007 | TBD | Defined |
| SYS-INT-009 | Integración inicial de solo lectura | Issue #10 | SWR-IR-001 | Read-only Adapter | CT-QVA-008 | TBD | Defined |
| SYS-INT-010 | Timestamp propio de observación | Issue #10 | SWR-DR-001 | MarketSnapshot | CT-QVA-009 | TBD | Defined |
| SYS-INT-011 | Compatibilidad con caché del proveedor | Issue #10 / QvaPay API | SWR-FR-001 | Scanner Scheduling | CT-QVA-010 | TBD | Defined |
| SYS-INT-012 | Evolución segura del contrato | Issue #10 | SWR-IR-003 | Contract Validation | CT-QVA-011 | TBD | Defined |

## Estados

- **Defined:** requisito aprobado a nivel de definición inicial.
- **Implemented:** existe implementación identificable.
- **Tested:** existe prueba ejecutada.
- **Verified:** existe evidencia suficiente de verificación.
- **TBD:** información todavía no definida o verificada.

## Regla de trazabilidad

Un requisito no se considerará completamente cerrado hasta disponer, cuando corresponda, de su relación con implementación, prueba y evidencia de verificación.
