# Matriz de trazabilidad de requisitos

## Propósito

Relacionar requisitos con implementación, pruebas y evidencia.

| ID | Requisito | Implementación | Prueba | Estado |
|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático configurable | Scanner Runtime + Durable Object + Alarm | `tests/application/scanner-runtime.test.ts`, `tests/infrastructure/cloudflare-scanner-scheduler.test.ts` | Tested |
| SYS-FR-002 | Ejecución 24/7 server-side | Durable Object + Alarm | pruebas de runtime/scheduler + smoke Cloudflare | Verified |
| SYS-FR-003 | Libro SELL | Market + Public App | `tests/domain/market.test.ts`, `tests/infrastructure/cloudflare-public-app.test.ts` | Tested |
| SYS-FR-004 | Libro BUY | Market + Public App | `tests/domain/market.test.ts`, `tests/infrastructure/cloudflare-public-app.test.ts` | Tested |
| SYS-INT-001 | GET /p2p | QvaPayP2PClient | `tests/infrastructure/qvapay-p2p-client.test.ts` | Tested |
| SYS-INT-002 | Separación type/coin | Client + Market | pruebas QvaPay | Tested |
| SYS-INT-003 | Paginación | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-004 | Secretos server-side | Worker + Cloudflare Secrets | Quality/production smoke | Implemented |
| SYS-INT-005 | Validación externa | p2p-contract | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Tested |
| SYS-INT-006 | Backoff 429 | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-007 | Clasificación de errores | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-008 | Precisión decimal | DTO + dominio | pruebas de contrato/dominio | Tested |
| SYS-INT-009 | Lectura del mercado | QvaPayP2PClient | pruebas QvaPay | Tested |
| SYS-INT-010 | observedAt | Mapper + Offer | pruebas QvaPay | Tested |
| SYS-INT-011 | Compatibilidad con caché | Documentación operativa | evidencia externa pendiente | Defined |
| SYS-INT-012 | Evolución segura | Contract parser | pruebas de contrato | Tested |
| SYS-FR-005 | Centro de Cuenta conectado | QvaPayAccountClient + protected `/api/account` + Public App | `tests/infrastructure/qvapay-account-client.test.ts`, `tests/infrastructure/cloudflare-public-app.test.ts` | Tested |

## Evidencia de producción

La cadena de evidencia vigente es:

`PR → merge → main commit → Repository Quality Gate → Cloudflare Deploy → production smoke`.

## Estados

- **Defined**
- **Designed**
- **Implemented**
- **Tested**
- **Verified**
- **Certified**
- **Failed / Rejected**
- **Blocked**

Estos estados no son intercambiables.

## Capacidades futuras

Los requisitos de webhook, SSE, ingestión event-driven, D1 y arbitraje no deben marcarse como implementados hasta que exista código y pruebas correspondientes.


## Security dashboard boundary update

| Control | Issue | Implementation | Evidence |
|---|---|---|---|
| Browser never receives operational secrets | #98, #101 | Public dashboard no longer prompts or sends P2P action credentials | Security Gate + dashboard contract tests |
| Account data requires authenticated application context | #100 | `/api/account` requires Cloudflare Access context | Worker authorization path + production smoke |
| Server-side scanner must self-initialize | #102 | Public status initializes the Durable Object schedule | Runtime integration and production smoke |
