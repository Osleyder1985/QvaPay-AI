# Matriz de trazabilidad de requisitos

## Propósito

Relacionar requisitos con diseño, implementación, pruebas y evidencia de runtime.

| ID | Requisito | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático configurable | Scanner Runtime + Durable Object + Alarm | pruebas de runtime/scheduler + smoke | Verified |
| SYS-FR-002 | Ejecución 24/7 server-side | Durable Object + Alarm | Quality Gate + Cloudflare Deploy + smoke | Verified |
| SYS-FR-003 | Libro SELL | Market + Public App | pruebas de dominio/API + smoke | Verified |
| SYS-FR-004 | Libro BUY | Market + Public App | pruebas de dominio/API + smoke | Verified |
| SYS-INT-001 | GET /p2p | QvaPayP2PClient | pruebas de cliente | Tested |
| SYS-INT-002 | Separación type/coin | Client + Market | pruebas QvaPay | Tested |
| SYS-INT-003 | Paginación | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-004 | Secretos server-side | Worker + Cloudflare Secrets | Security Gate + smoke | Verified |
| SYS-INT-005 | Validación externa | p2p-contract | pruebas de contrato | Tested |
| SYS-INT-006 | Backoff 429 | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-007 | Clasificación de errores | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-008 | Precisión decimal | DTO + dominio | pruebas de contrato/dominio | Tested |
| SYS-INT-009 | Lectura del mercado | QvaPayP2PClient | pruebas QvaPay + smoke | Verified |
| SYS-INT-010 | observedAt | Mapper + Offer | pruebas QvaPay | Tested |
| SYS-INT-011 | Compatibilidad con caché | Documentación operativa | evidencia externa pendiente | Defined |
| SYS-INT-012 | Evolución segura | Contract parser | pruebas de contrato | Tested |
| SYS-FR-005 | Centro de Cuenta protegido | QvaPayAccountClient + `/api/account` | pruebas de cliente/ruta | Implemented |
| SYS-FR-006 | Registro completo de la cuenta QvaPay conectada | QvaPayAccountClient + account-contract | pruebas de completitud/proveniencia + smoke autenticado | Defined |
| SYS-SEC-001 | No pedir secretos operacionales al navegador | Public App + Worker | Security Gate + dashboard smoke | Verified |
| SYS-SEC-002 | Identidad de cuenta desde `/user` | QvaPayAccountClient | pruebas de cuenta | Verified |

## Evidencia de producción

### SYS-FR-006 — estado de auditoría

El contrato actual de Cuenta ya modela identidad, balance, aplicación, P2P propio y metadatos de proveniencia. La auditoría detectó que `completedAsOwner` y `completedAsPeer` permanecen siempre en `null` y que todavía no existe evidencia autenticada de producción para certificar el módulo. Por ello SYS-FR-006 permanece **Defined** y no se eleva por documentación o pruebas unitarias solamente.

La cadena de evidencia vigente es:

`PR → merge → main commit → Repository Quality Gate → Cloudflare Deploy → production smoke → criterion-specific production evidence`.

Para identidad de cuenta, la evidencia de producción exige además una sesión autenticada reproducible contra `/api/account`. La respuesta `403` sin sesión demuestra el límite de seguridad, pero **no demuestra la identidad del propietario** y no permite certificar SYS-SEC-002 ni Issue #97.

Para el commit de `main` `bac8500cc579e4277852e74cc3a247bf00ed0cc1`:

- Repository Quality Gate: **PASSED**.
- Security Gate: **PASSED**.
- Cloudflare Deploy #67: **PASSED**.
- Smoke de producción: dashboard HTTP 200, scanner operativo y snapshot no vacío.
- El smoke confirmó BUY y SELL no vacíos, `totalOffers > 0`, `snapshotAt`, `bestBuyRate` y `bestSellRate`.

## Estados formales

- **Defined**
- **Designed**
- **Implemented**
- **Tested**
- **Verified**
- **Certified**
- **Failed / Rejected**
- **Blocked**

`TBD` no es un estado formal; cuando falta información o evidencia, el requisito debe permanecer en el estado formal que corresponda (`Defined`, `Designed`, `Implemented`, `Tested`, `Verified` o `Blocked`) y la ausencia de evidencia debe quedar descrita explícitamente.

Estos estados no son intercambiables. Un deployment exitoso no implica certificación.

## Controles de seguridad

| Control | Issue | Implementación | Estado |
|---|---|---|---|
| El navegador nunca recibe secretos operacionales | #98, #101 | Dashboard público sin prompts ni headers de secretos | Verified |
| La identidad de cuenta proviene de `/user` | #97 | QvaPayAccountClient + API Token server-side | Verified |
| Cuenta requiere frontera de usuario | #100 | `/api/account` devuelve `403` sin sesión | Implemented |
| Scanner se inicializa server-side | #102 | Estado público asegura programación del Durable Object | Verified |
| Operaciones reales requieren frontera independiente | #98, #103 | Ruta pública bloqueada hasta autenticación | Implemented |

## Capacidades futuras

Webhook, SSE, ingestión event-driven completa, D1 como fuente operativa y motor de arbitraje no deben marcarse como implementados hasta que exista código, pruebas y evidencia correspondiente.
