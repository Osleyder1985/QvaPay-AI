# Matriz de trazabilidad de requisitos

## Propósito

Relacionar requisitos con diseño, implementación, pruebas y evidencia de runtime.

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático configurable | Scanner Runtime + Durable Object + Alarm | pruebas de runtime/scheduler + smoke | Verificado |
| SYS-FR-002 | Ejecución 24/7 server-side | Durable Object + Alarm | Quality Gate + Cloudflare Deploy + smoke | Verificado |
| SYS-FR-003 | Libro SELL | Market + Public App | pruebas de dominio/API + smoke | Verificado |
| SYS-FR-004 | Libro BUY | Market + Public App | pruebas de dominio/API + smoke | Verificado |
| SYS-INT-001 | GET /p2p | QvaPayP2PClient | pruebas de cliente | Probado |
| SYS-INT-002 | Separación type/coin | Client + Market | pruebas QvaPay | Probado |
| SYS-INT-003 | Paginación | QvaPayP2PClient | pruebas QvaPay | Probado |
| SYS-INT-004 | Secretos server-side | Worker + Cloudflare Secrets | Security Gate + smoke | Verificado |
| SYS-INT-005 | Validación externa | p2p-contract | pruebas de contrato | Probado |
| SYS-INT-006 | Backoff 429 | QvaPayP2PClient | pruebas QvaPay | Probado |
| SYS-INT-007 | Clasificación de errores | QvaPayP2PClient | pruebas QvaPay | Probado |
| SYS-INT-008 | Precisión decimal | DTO + dominio | pruebas de contrato/dominio | Probado |
| SYS-INT-009 | Lectura del mercado | QvaPayP2PClient | pruebas QvaPay + smoke | Verificado |
| SYS-INT-010 | observedAt | Mapper + Offer | pruebas QvaPay | Probado |
| SYS-INT-011 | Compatibilidad con caché | Documentación operativa | evidencia externa pendiente | Definido |
| SYS-INT-012 | Evolución segura | Contract parser | pruebas de contrato | Probado |
| SYS-FR-005 | Centro de Cuenta protegido | QvaPayAccountClient + `/api/account` | pruebas de cliente/ruta | Implementado |
| SYS-SEC-001 | No pedir secretos operacionales al navegador | Public App + Worker | Security Gate + dashboard smoke | Verificado |
| SYS-SEC-002 | Identidad de cuenta desde `/user` | QvaPayAccountClient | pruebas de cuenta | Verificado |

## Evidencia de producción

La cadena de evidencia vigente es:

`PR → merge → main commit → Control de Calidad del Repositorio → Cloudflare Deploy → production smoke → criterion-specific production evidence`.

Para identidad de cuenta, la evidencia de producción exige además una sesión autenticada reproducible contra `/api/account`. La respuesta `403` sin sesión demuestra el límite de seguridad, pero **no demuestra la identidad del propietario** y no permite certificar SYS-SEC-002 ni Issue #97.

Para el commit de `main` `bac8500cc579e4277852e74cc3a247bf00ed0cc1`:

- Control de Calidad del Repositorio: **PASSED**.
- Security Gate: **PASSED**.
- Despliegue de Cloudflare #67: **PASADO**.
- Smoke de producción: dashboard HTTP 200, scanner operativo y snapshot no vacío.
- El smoke confirmó BUY y SELL no vacíos, `totalOffers > 0`, `snapshotAt`, `bestBuyRate` y `bestSellRate`.

## Inventario normativo

Los siguientes documentos constituyen el inventario normativo que debe permanecer representado en esta matriz:

- `docs/requirements/software/initial-software-requirements.md`
- `docs/requirements/system/functional/p2p-market-scanner.md`
- `docs/requirements/system/functional/account-center.md`
- `docs/requirements/system/integration/qvapay-p2p.md`
- `docs/requirements/system/quality/initial-quality-requirements.md`
- `docs/requirements/requirements-traceability-matrix.md`

El Quality Gate descubre automáticamente los documentos Markdown bajo `docs/requirements/` y falla si un documento normativo queda fuera de esta matriz.

## Estados formales

- **Definido**
- **Diseñado**
- **Implementado**
- **Probado**
- **Verificado**
- **Certificado**
- **Fallido / Rechazado**
- **Bloqueado**

`TBD` no es un estado formal; cuando falta información o evidencia, el requisito debe permanecer en el estado formal que corresponda (`Definido`, `Diseñado`, `Implementado`, `Probado`, `Verificado` o `Bloqueado`) y la ausencia de evidencia debe quedar descrita explícitamente.

Estos estados no son intercambiables. Un deployment exitoso no implica certificación.

## Controles de seguridad

| Control | Issue | Implementación | Estado |
|---|---|---|---|
| El navegador nunca recibe secretos operacionales | #98, #101 | Dashboard público sin prompts ni headers de secretos | Verificado |
| La identidad de cuenta proviene de `/user` | #97 | QvaPayAccountClient + API Token server-side | Verificado |
| Cuenta requiere frontera de usuario | #100 | `/api/account` devuelve `403` sin sesión | Implementado |
| Scanner se inicializa server-side | #102 | Estado público asegura programación del Durable Object | Verificado |
| Operaciones reales requieren frontera independiente | #98, #103 | Ruta pública bloqueada hasta autenticación | Implementado |

## Capacidades futuras

Webhook, SSE, ingestión event-driven completa, D1 como fuente operativa y motor de arbitraje no deben marcarse como implementados hasta que exista código, pruebas y evidencia correspondiente.
