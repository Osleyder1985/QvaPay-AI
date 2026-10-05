# Estado de implementación de arquitectura

## Propósito

Este documento identifica exclusivamente los componentes que tienen implementación verificable en el repositorio actual.

## Implementado

| Área | Implementación verificable | Estado |
|---|---|---|
| Dominio | `src/domain/market.ts`, `src/domain/offer.ts` | Implemented |
| Caso de uso | `src/application/use-cases/scan-market.ts` | Implemented |
| Scanner Runtime | `src/application/scanner-runtime.ts` | Tested |
| Puerto de scheduler | `src/application/ports/scanner-scheduler.ts` | Implemented |
| Puerto de proveedor | `src/application/ports/market-provider.ts` | Implemented |
| Contrato QvaPay P2P | `src/infrastructure/qvapay/p2p-contract.ts` | Implemented |
| Tipos QvaPay P2P | `src/infrastructure/qvapay/p2p-types.ts` | Implemented |
| Mapper QvaPay P2P | `src/infrastructure/qvapay/p2p-mapper.ts` | Implemented |
| Cliente QvaPay P2P | `src/infrastructure/qvapay/qvapay-p2p-client.ts` | Implemented |
| Cloudflare scheduler adapter | `src/infrastructure/cloudflare/scanner-scheduler.ts` | Tested |
| Cloudflare Durable Object + Alarm | `src/infrastructure/cloudflare/scanner-scheduler-do.ts` | Implemented |
| Public web application | `src/infrastructure/cloudflare/public-app.ts`, `worker.ts` | Tested |\n| Live market dashboard | `src/infrastructure/cloudflare/public-app.ts` | Tested |\n| Persisted market snapshot | `src/infrastructure/cloudflare/scanner-scheduler-do-logic.ts` | Tested |\n| Ranked BUY/SELL market view | `src/infrastructure/cloudflare/public-app.ts` | Tested |
| Public scanner status | `GET /api/scanner/status` | Tested |
| Worker control boundary | `src/infrastructure/cloudflare/worker.ts` | Implemented |
| Wrangler deployment configuration | `wrangler.toml` | Implemented |
| Pruebas de dominio | `tests/domain/*` | Tested |
| Pruebas del adaptador QvaPay | `tests/infrastructure/*` | Tested |
| Pruebas del scheduler Cloudflare | `tests/infrastructure/cloudflare-scanner-scheduler.test.ts` | Tested |

## Criterios de observabilidad del dashboard\n\nEl dashboard utiliza métricas operativas alineadas con conceptos de calidad y seguridad habituales en ISO 9001 e ISO/IEC 25010, sin afirmar certificación ISO del producto. La interfaz muestra disponibilidad del runtime, frescura del snapshot, integridad de la identidad de mercado, trazabilidad temporal mediante `observedAt`/`lastCompletedAt`, estado de error, conteo de ofertas, liquidez disponible, mejor BUY, mejor SELL y spread. La separación por moneda evita mezclar mercados.\n\nLas métricas son de observabilidad y análisis; no constituyen por sí mismas una decisión financiera ni una orden de mercado.\n\n## No implementado todavía

Los siguientes elementos aparecen en la arquitectura objetivo, pero no tienen implementación identificable en el repositorio actual:

- Persistencia D1 / Market Snapshot Repository.
- Webhook P2P.
- Stream SSE.
- Event Ingestion Boundary.
- Reconciliación persistente.
- Configuración persistente de usuario del intervalo.
- Arbitrage engine.
- Ejecución de órdenes.

## Estado operativo

La implementación de Durable Object + Alarm establece la frontera de ejecución server-side. El workflow de Cloudflare debe verificar el bootstrap del scanner y el HTTP 200 de la aplicación pública después de cada deployment de `main`.

La configuración del scheduler se persiste en el almacenamiento del Durable Object para sobrevivir a evicciones o reinicios. Esto no sustituye la futura persistencia funcional de snapshots en D1.

La implementación de la interfaz pública y su verificación automatizada se realizan bajo el Issue #61 y el Pull Request #62.

## Regla

La presencia de un componente en un diagrama de arquitectura objetivo no constituye evidencia de implementación, prueba, verificación ni certificación.

La matriz de trazabilidad, el código, las pruebas y la evidencia operacional son las fuentes para determinar el estado correspondiente.
