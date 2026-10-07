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

## Nuevos requisitos — Auditoría y Control

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-AUD-001 | Registro de auditoría persistente y consultable | TBD | TBD | Defined |
| SYS-AUD-002 | Actor, acción, objeto y contexto | TBD | TBD | Defined |
| SYS-AUD-003 | Estado anterior/posterior y resultado | TBD | TBD | Defined |
| SYS-AUD-004 | Trazabilidad de correlación, solicitud y operación | TBD | TBD | Defined |
| SYS-AUD-005 | Integridad, retención y control de acceso | TBD | TBD | Defined |
| SYS-AUD-006 | Auditoría del acceso al propio registro de auditoría | TBD | TBD | Defined |
| SYS-AUD-007 | Exportación y preservación de evidencia | TBD | TBD | Defined |
| SYS-AUD-008 | Minimización de secretos/datos sensibles | TBD | TBD | Defined |

## Nuevos requisitos — Contabilidad y Economía

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-ACC-001 | Libro mayor económico persistente | TBD | TBD | Defined |
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
| SYS-ACC-012 | Informes reproducibles y evidencia de cierre | TBD | TBD | Defined |

## Requisitos de cumplimiento contable

| ID | Requisito | Estado |
|---|---|---|
| SYS-COMP-ACC-001 | Determinar jurisdicción y marco contable aplicable | Defined |
| SYS-COMP-ACC-002 | Determinar obligaciones fiscales/financieras y de medios de pago | Defined |
| SYS-COMP-ACC-003 | Mapear requisitos legales a controles y evidencia | Defined |

## Gobernanza

Toda solución para SYS-AUD-* y SYS-ACC-* queda bloqueada por #270 hasta contar con Solution Card respaldada por ISO, autorización explícita y trazabilidad completa.

## Estados formales

Definido, Diseñado, Implementado, Probado, Verificado, Certificado, Fallido / Rechazado, Bloqueado.

Estos estados no son intercambiables. Un despliegue exitoso no implica certificación.
