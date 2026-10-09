# Estado de implementación de arquitectura

## Propósito

Este documento identifica el estado verificable de los componentes presentes en el repositorio actual. No confunde arquitectura futura con implementación existente ni implementación local con evidencia de producción.

## Política de estados

Los estados se interpretan en esta secuencia:

**Defined → Designed → Implemented → Tested → Verified → Certified**

`Implemented` indica presencia de implementación en el código. `Tested` requiere pruebas automatizadas pertinentes. `Verified` requiere evidencia operacional suficiente. `Certified` requiere evidencia de producción y el cumplimiento de los controles aplicables.

## Componentes implementados

| Área                         | Implementación                                                | Estado      |
| ---------------------------- | ------------------------------------------------------------- | ----------- |
| Dominio                      | `src/domain/market.ts`, `src/domain/offer.ts`                 | Tested      |
| Caso de uso                  | `src/application/use-cases/scan-market.ts`                    | Tested      |
| Runtime                      | `src/application/scanner-runtime.ts`                          | Tested      |
| Puerto de mercado            | `src/application/ports/market-provider.ts`                    | Implemented |
| Puerto de scheduler          | `src/application/ports/scanner-scheduler.ts`                  | Implemented |
| Contrato QvaPay              | `src/infrastructure/qvapay/p2p-contract.ts`                   | Tested      |
| DTO QvaPay                   | `src/infrastructure/qvapay/p2p-types.ts`                      | Implemented |
| Mapper QvaPay                | `src/infrastructure/qvapay/p2p-mapper.ts`                     | Tested      |
| Cliente QvaPay               | `src/infrastructure/qvapay/qvapay-p2p-client.ts`              | Tested      |
| Aplicación P2P en el cliente | `QvaPayP2PClient.applyOffer()`                                | Implemented |
| Worker Cloudflare            | `src/infrastructure/cloudflare/worker.ts`                     | Tested      |
| Durable Object               | `src/infrastructure/cloudflare/scanner-scheduler-do.ts`       | Tested      |
| Lógica del scheduler         | `src/infrastructure/cloudflare/scanner-scheduler-do-logic.ts` | Tested      |
| Dashboard público            | `src/infrastructure/cloudflare/public-app.ts`                 | Tested      |
| Estado público               | `GET /api/scanner/status`                                     | Tested      |
| Aplicación HTTP de oferta    | `POST /api/p2p/:uuid/apply`                                   | Blocked     |
| Configuración Wrangler       | `wrangler.toml`                                               | Implemented |
| CI/CD                        | `.github/workflows/*.yml`                                     | Tested      |

## Datos y comportamiento actualmente persistidos

El Durable Object mantiene:

- configuración de moneda;
- intervalo de ejecución;
- siguiente Alarm;
- último inicio;
- última finalización;
- último error;
- snapshot de mercado utilizado por el dashboard.

Cloudflare D1 se utiliza actualmente para identidad, auditoría de seguridad y snapshots de Cuenta. El repositorio de snapshots de Cuenta está implementado en `src/infrastructure/cloudflare/qvapay-account-snapshot-store.ts`.

La existencia de la implementación D1 no implica por sí sola evidencia de producción ni certificación.

## Cuenta

La lectura observacional y la sincronización externa están separadas:

```text
GET /api/account
      │
      └── lee el snapshot persistido más reciente
          sin llamar a QvaPay ni mutar D1

POST /api/account/sync
      │
      ├── autenticación de Administración
      ├── consulta QvaPay
      ├── persiste el snapshot
      └── registra el evento de auditoría
```

La lectura de Cuenta está autorizada para los roles Administración y Observador. La sincronización explícita requiere el rol Administración.

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

## Elementos todavía no implementados o bloqueados

No deben presentarse como capacidades productivas certificadas:

- aplicación HTTP de ofertas P2P;
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
