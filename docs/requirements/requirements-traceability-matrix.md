# Matriz de trazabilidad de requisitos

## Propósito

Relacionar requisitos con diseño, implementación, pruebas, evidencia de runtime y certificación. Un estado superior no puede declararse mientras falte evidencia de una etapa previa.

## Requisitos funcionales existentes

| ID          | Requisito                                    | Implementación                           | Prueba / evidencia                                                          | Estado      |
| ----------- | -------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- | ----------- |
| SYS-FR-001  | Escaneo automático configurable              | Scanner Runtime + Durable Object + Alarm | pruebas de runtime/scheduler + smoke                                        | Verified    |
| SYS-FR-002  | Ejecución 24/7 server-side                   | Durable Object + Alarm                   | Quality Gate + Cloudflare Deploy + smoke                                    | Verified    |
| SYS-FR-003  | Libro SELL                                   | Market + Public App                      | pruebas de dominio/API + smoke                                              | Verified    |
| SYS-FR-004  | Libro BUY                                    | Market + Public App                      | pruebas de dominio/API + smoke                                              | Verified    |
| SYS-FR-005  | Centro de Cuenta protegido                   | QvaPayAccountClient + /api/account       | pruebas de cliente/ruta                                                     | Implemented |
| SYS-SEC-001 | No pedir secretos operacionales al navegador | Public App + Worker                      | Security Gate + dashboard smoke                                             | Verified    |
| SYS-SEC-002 | Identidad de cuenta desde /user              | QvaPayAccountClient                      | pruebas de cuenta + evidencia autenticada de producción del despliegue #115 | Verified    |

## Nuevos requisitos — Auditoría y Control

| ID          | Requisito                                            | Implementación | Prueba / evidencia | Estado  |
| ----------- | ---------------------------------------------------- | -------------- | ------------------ | ------- |
| SYS-AUD-001 | Registro de auditoría persistente y consultable      | TBD            | TBD                | Defined |
| SYS-AUD-002 | Actor, acción, objeto y contexto                     | TBD            | TBD                | Defined |
| SYS-AUD-003 | Estado anterior/posterior y resultado                | TBD            | TBD                | Defined |
| SYS-AUD-004 | Trazabilidad de correlación, solicitud y operación   | TBD            | TBD                | Defined |
| SYS-AUD-005 | Integridad, retención y control de acceso            | TBD            | TBD                | Defined |
| SYS-AUD-006 | Auditoría del acceso al propio registro de auditoría | TBD            | TBD                | Defined |
| SYS-AUD-007 | Exportación y preservación de evidencia              | TBD            | TBD                | Defined |
| SYS-AUD-008 | Minimización de secretos/datos sensibles             | TBD            | TBD                | Defined |

## Nuevos requisitos — Contabilidad y Economía

| ID          | Requisito                                       | Implementación | Prueba / evidencia | Estado  |
| ----------- | ----------------------------------------------- | -------------- | ------------------ | ------- |
| SYS-ACC-001 | Libro mayor económico persistente               | TBD            | TBD                | Defined |
| SYS-ACC-002 | BUY/SELL y operaciones monetarias               | TBD            | TBD                | Defined |
| SYS-ACC-003 | Transferencias, ingresos, gastos, comisiones    | TBD            | TBD                | Defined |
| SYS-ACC-004 | Proveniencia y referencias externas             | TBD            | TBD                | Defined |
| SYS-ACC-005 | Saldos y estados de cuenta                      | TBD            | TBD                | Defined |
| SYS-ACC-006 | Ganancias, pérdidas y resultado neto            | TBD            | TBD                | Defined |
| SYS-ACC-007 | Períodos y cierres contables inmutables         | TBD            | TBD                | Defined |
| SYS-ACC-008 | Ajustes/reversiones controlados                 | TBD            | TBD                | Defined |
| SYS-ACC-009 | Reconciliación con proveedores/medios de pago   | TBD            | TBD                | Defined |
| SYS-ACC-010 | Modelo de partida doble/general ledger evaluado | TBD            | TBD                | Defined |
| SYS-ACC-011 | Minimización y protección de datos de tarjetas  | TBD            | TBD                | Defined |
| SYS-ACC-012 | Informes reproducibles y evidencia de cierre    | TBD            | TBD                | Defined |

## Requisitos de cumplimiento contable

| ID               | Requisito                                                        | Estado  |
| ---------------- | ---------------------------------------------------------------- | ------- |
| SYS-COMP-ACC-001 | Determinar jurisdicción y marco contable aplicable               | Defined |
| SYS-COMP-ACC-002 | Determinar obligaciones fiscales/financieras y de medios de pago | Defined |
| SYS-COMP-ACC-003 | Mapear requisitos legales a controles y evidencia                | Defined |

## Gobernanza

Toda solución para SYS-AUD-* y SYS-ACC-* queda bloqueada por #270 hasta contar con Solution Card respaldada por ISO, autorización explícita y trazabilidad completa.

## Estados formales

Definido, Diseñado, Implementado, Probado, Verificado, Certificado, Fallido / Rechazado, Bloqueado.

Estos estados no son intercambiables. Un despliegue exitoso no implica certificación.
## Evidencia de producción de Account

### SYS-SEC-002

El despliegue #115, sobre el commit exacto `5638c7561e8535d7f11dc9195f9b034f528963fe`, obtuvo una sesión autenticada de producción y ejecutó `POST /api/account/sync` y `GET /api/account`.

La evidencia observó la identidad QvaPay `Osleyder`, la aplicación `d97f998e-a76c-4998-b664-e1f4f19138ef`, balance con estado `unavailable`, P2P con estado `verified` e integración general `degraded`. Esta evidencia verifica el requisito de identidad desde `/user`, pero no certifica la correlación propietario-aplicación pendiente de #196.

## Inventario normativo de documentos de requisitos

El Quality Gate considera normativo todo documento Markdown dentro de `docs/requirements`, excepto sus archivos `README.md`. Cada documento debe aparecer explícitamente en esta matriz para mantener trazabilidad documental completa.

| Documento normativo                                                | Alcance                                         | Estado   |
| ------------------------------------------------------------------ | ----------------------------------------------- | -------- |
| `docs/requirements/requirements-traceability-matrix.md`            | Matriz maestra de trazabilidad                  | Definido |
| `docs/requirements/software/initial-software-requirements.md`      | Requisitos iniciales de software                | Definido |
| `docs/requirements/system/functional/account-center.md`            | Requisitos funcionales del Centro de Cuenta     | Definido |
| `docs/requirements/system/functional/p2p-market-scanner.md`        | Requisitos funcionales de mercado y scanner P2P | Definido |
| `docs/requirements/system/integration/qvapay-p2p.md`               | Requisitos de integración P2P con QvaPay        | Definido |
| `docs/requirements/system/quality/initial-quality-requirements.md` | Requisitos iniciales de calidad                 | Definido |

La presencia en este inventario demuestra trazabilidad documental, no implementación ni certificación. Las contradicciones o requisitos obsoletos identificados en estos documentos deben reconciliarse mediante el proceso de cambio controlado correspondiente.
