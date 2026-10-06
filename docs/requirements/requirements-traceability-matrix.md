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
| SYS-SEC-001 | No pedir secretos operacionales al navegador | Public App + Worker | Security Gate + dashboard smoke | Verified |
| SYS-SEC-002 | Identidad de cuenta desde `/user` | QvaPayAccountClient | pruebas de cuenta | Verified |

## Evidencia de producción

La cadena de evidencia vigente es:

`PR → merge → main commit → Repository Quality Gate → Cloudflare Deploy → production smoke`.

Para el commit `bde3b567120d2671d3f8cb8136fab1675ef1136a`:

- Repository Quality Gate: **PASSED**.
- Security Gate: **PASSED**.
- Cloudflare Deploy #60: **PASSED**.
- Smoke de producción: dashboard HTTP 200, scanner operativo y snapshot no vacío.
- El smoke confirmó BUY y SELL no vacíos, `totalOffers > 0`, `snapshotAt`, `bestBuyRate` y `bestSellRate`.

## Estados

- **Defined**
- **Designed**
- **Implemented**
- **Tested**
- **Verified**
- **Certified**
- **Failed / Rejected**
- **Blocked**

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
