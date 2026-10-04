# Requirements Traceability Matrix

## Propósito

Esta matriz establece la trazabilidad entre requisitos, responsabilidades de software, diseño, implementación, pruebas, evidencia de verificación y certificación.

| Requirement ID | Requirement | Source | Software Requirement | Design / Component | Test | Verification Evidence | Status |
|---|---|---|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático con intervalo configurable | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-003 | Ofertas SELL por moneda y tasa ascendente | Issue #1 | TBD | TBD | TBD | TBD | Defined |
| SYS-FR-004 | Ofertas BUY por moneda y tasa ascendente | Issue #1 | TBD | TBD | TBD | TBD | Defined |

## Estados

- **Defined:** requisito definido y trazable.
- **Designed:** existe diseño identificable.
- **Implemented:** existe implementación identificable.
- **Tested:** existe prueba ejecutada.
- **Verified:** existe evidencia satisfactoria de verificación.
- **Certified:** se completó la verificación requerida y la evidencia quedó registrada.
- **Failed / Rejected:** existe incumplimiento o rechazo.
- **Blocked:** la verificación está impedida por una dependencia externa.
- **TBD:** información todavía no definida o verificada.

## Regla de trazabilidad

Un requisito no se considerará completamente cerrado hasta disponer, cuando corresponda, de su relación con implementación, prueba y evidencia de verificación.

## Regla transversal de certificación

Merge, CI exitoso o deployment exitoso no equivalen a certificación. Un requisito no podrá marcarse como **Certified** sin evidencia objetiva y trazable de cumplimiento conforme a [Verification and Certification Policy](../quality/verification-and-certification-policy.md).
