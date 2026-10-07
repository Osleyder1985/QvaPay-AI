# Matriz de trazabilidad de requisitos

## Propósito

Relacionar requisitos con diseño, implementación, pruebas, evidencia de runtime y certificación. Un estado superior no puede declararse mientras falte evidencia de una etapa previa.

## Requisitos funcionales existentes

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático configurable | Scanner Runtime + Durable Object + Alarm | pruebas de runtime/scheduler + smoke | Verified |
| SYS-FR-002 | Ejecución 24/7 server-side | Durable Object + Alarm | Quality Gate + Cloudflare Deploy + smoke | Verified |
| SYS-FR-003 | Libro SELL | Market + Public App | pruebas de dominio/API + smoke | Verified |
| SYS-FR-004 | Libro BUY | Market + Public App | pruebas de dominio/API + smoke | Verified |
| SYS-FR-005 | Centro de Cuenta protegido | QvaPayAccountClient + /api/account | pruebas de cliente/ruta | Implemented |
| SYS-SEC-001 | No pedir secretos operacionales al navegador | Public App + Worker | Security Gate + dashboard smoke | Verified |
| SYS-SEC-002 | Identidad de cuenta desde /user | QvaPayAccountClient | pruebas de cuenta | Verified* |

## Nuevos requisitos — Audit and Control

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-AUD-001 | Audit trail persistente y consultable | TBD | TBD | Defined |
| SYS-AUD-002 | Actor, acción, objeto y contexto | TBD | TBD | Defined |
| SYS-AUD-003 | Before/after y resultado | TBD | TBD | Defined |
| SYS-AUD-004 | Correlation/request/operation traceability | TBD | TBD | Defined |
| SYS-AUD-005 | Integridad, retención y control de acceso | TBD | TBD | Defined |
| SYS-AUD-006 | Auditoría del acceso al propio audit trail | TBD | TBD | Defined |
| SYS-AUD-007 | Exportación y preservación de evidencia | TBD | TBD | Defined |
| SYS-AUD-008 | Minimización de secretos/datos sensibles | TBD | TBD | Defined |

## Nuevos requisitos — Accounting and Economic

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-ACC-001 | Ledger económico persistente | TBD | TBD | Defined |
| SYS-ACC-002 | BUY/SELL y operaciones monetarias | TBD | TBD | Defined |
| SYS-ACC-003 | Transferencias, ingresos, gastos, comisiones | TBD | TBD | Defined |
| SYS-ACC-004 | Proveniencia y referencias externas | TBD | TBD | Defined |
| SYS-ACC-005 | Saldos y estados de cuenta | TBD | TBD | Defined |
| SYS-ACC-006 | Ganancias, pérdidas y resultado neto | TBD | TBD | Defined |
| SYS-ACC-007 | Períodos y cierres contables inmutables | TBD | TBD | Defined |
| SYS-ACC-008 | Ajustes/reversiones controlados | TBD | TBD | Defined |
| SYS-ACC-009 | Reconciliación con proveedores/medios de pago | TBD | TBD | Defined |
| SYS-ACC-010 | Modelo de partida doble/general ledger evaluado | TBD | TBD | Defined |
| SYS-ACC-011 | Minimización y protección de datos de tarjetas | TBD | TBD | Defined |
| SYS-ACC-012 | Reporting reproducible y evidencia de cierre | TBD | TBD | Defined |

## Requisitos de cumplimiento contable

| ID | Requisito | Estado |
|---|---|---|
| SYS-COMP-ACC-001 | Determinar jurisdicción y marco contable aplicable | Defined |
| SYS-COMP-ACC-002 | Determinar obligaciones fiscales/financieras/payment | Defined |
| SYS-COMP-ACC-003 | Mapear requisitos legales a controles y evidencia | Defined |

## Gobernanza

Toda solución para SYS-AUD-* y SYS-ACC-* queda bloqueada por #270 hasta contar con Solution Card ISO-backed, autorización explícita y trazabilidad completa.

## Estados formales

Defined, Designed, Implemented, Tested, Verified, Certified, Failed / Rejected, Blocked.

Estos estados no son intercambiables. Un deployment exitoso no implica certificación.
