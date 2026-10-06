# Estado de implementación de arquitectura

## Propósito

Este documento identifica el estado verificable de los componentes presentes en el repositorio actual. No confunde arquitectura futura con implementación existente.

## Componentes implementados

| Área | Implementación | Estado |
|---|---|---|
| Dominio | `src/domain/market.ts`, `src/domain/offer.ts` | Tested |
| Caso de uso | `src/application/use-cases/scan-market.ts` | Tested |
| Runtime | `src/application/scanner-runtime.ts` | Tested |
| Puerto de mercado | `src/application/ports/market-provider.ts` | Implemented |
| Puerto de scheduler | `src/application/ports/scanner-scheduler.ts` | Implemented |
| Contrato QvaPay | `src/infrastructure/qvapay/p2p-contract.ts` | Tested |
| DTO QvaPay | `src/infrastructure/qvapay/p2p-types.ts` | Implemented |
| Mapper QvaPay | `src/infrastructure/qvapay/p2p-mapper.ts` | Tested |
| Cliente QvaPay | `src/infrastructure/qvapay/qvapay-p2p-client.ts` | Tested |
| Aplicación P2P | `QvaPayP2PClient.applyOffer()` | Implemented |
| Worker Cloudflare | `src/infrastructure/cloudflare/worker.ts` | Tested |
| Durable Object | `src/infrastructure/cloudflare/scanner-scheduler-do.ts` | Tested |
| Lógica del scheduler | `src/infrastructure/cloudflare/scanner-scheduler-do-logic.ts` | Tested |
| Dashboard público | `src/infrastructure/cloudflare/public-app.ts` | Tested |
| Estado público | `GET /api/scanner/status` | Tested |
| Aplicación de oferta | `POST /api/p2p/:uuid/apply` | Implemented |
| Configuración Wrangler | `wrangler.toml` | Implemented |
| CI/CD | `.github/workflows/*.yml` | Tested |

## Datos y comportamiento actualmente persistidos

El Durable Object mantiene:

- configuración de moneda;
- intervalo de ejecución;
- siguiente Alarm;
- último inicio;
- última finalización;
- último error;
- snapshot de mercado utilizado por el dashboard.

La persistencia es almacenamiento del Durable Object. **D1 todavía no está implementado en el repositorio actual.**

## Dashboard actual

La interfaz pública muestra:

- mejor BUY;
- mejor SELL;
- spread;
- liquidez;
- total de ofertas;
- estado del snapshot;
- estado operativo;
- cuenta regresiva;
- ofertas BUY/SELL;
- usuario;
- fecha de creación;
- QUSD;
- tasa;
- importe fiat;
- estado;
- VIP;
- acción correspondiente.

Las mejores ofertas reciben un heartbeat dorado y la acción semántica es:

- oferta **SELL** → **Comprar** → verde;
- oferta **BUY** → **Vender** → rojo.

## Elementos todavía no implementados

No deben presentarse como capacidades actuales:

- Cloudflare D1;
- repositorio D1 de snapshots;
- webhook P2P;
- stream SSE;
- Event Ingestion Boundary;
- reconciliación basada en eventos;
- motor de arbitraje automático;
- ejecución automática de estrategias de arbitraje.

## Evidencia

El estado de producción debe verificarse mediante:

**PR → merge → commit de `main` → Quality Gate → Cloudflare Deploy → smoke HTTP/runtime**.

La presencia de código o pruebas no constituye por sí sola certificación de producción.
