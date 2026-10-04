# Requirements Traceability Matrix

## Propósito

Esta matriz establece la trazabilidad inicial entre los requisitos funcionales del sistema y su futura implementación y verificación.

| Requirement ID | Requirement | Source | Software Requirement | Design / Component | Test | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático con intervalo configurable | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-003 | Ofertas SELL por moneda y tasa ascendente | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-004 | Ofertas BUY por moneda y tasa ascendente | Issue #1 | TBD | TBD | TBD | TBD | Defined |

## Estados

- **Defined:** requisito aprobado a nivel de definición inicial.
- **Implemented:** existe implementación identificable.
- **Tested:** existe prueba ejecutada.
- **Verified:** existe evidencia suficiente de verificación.
- **TBD:** información todavía no definida o verificada.

## Regla de trazabilidad

Un requisito no se considerará completamente cerrado hasta disponer, cuando corresponda, de su relación con implementación, prueba y evidencia de verificación.


## Trazabilidad de ingestión event-driven

| Requirement ID | Software Requirement | Architecture / Component | Planned Test |
|---|---|---|---|
| SYS-QR-008 | SWR-IR-002 | Event Ingestion Boundary | CT-QVA-003 |
| SYS-QR-009 | SWR-IR-003 | Reconciliation | CT-QVA-009 |
| SYS-QR-010 | SWR-IR-002 / SWR-SR-001 | Webhook Boundary / Secret Store | CT-QVA-004, CT-QVA-005 |
| SYS-QR-005 | SWR-IR-004 | QvaPay Adapter | CT-QVA-011, CT-QVA-013 |
| SYS-QR-006 | SWR-IR-001 / SWR-IR-002 | Integration Boundary | CT-QVA-001, CT-QVA-002, CT-QVA-007 |
