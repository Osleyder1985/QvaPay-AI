# Estado de implementación de arquitectura

## Propósito

Este documento identifica exclusivamente los componentes que tienen implementación verificable en el repositorio actual.

## Implementado

| Área | Implementación verificable | Estado |
|---|---|---|
| Dominio | `src/domain/market.ts`, `src/domain/offer.ts` | Implemented |
| Caso de uso | `src/application/use-cases/scan-market.ts` | Implemented |
| Puerto de proveedor | `src/application/ports/market-provider.ts` | Implemented |
| Contrato QvaPay P2P | `src/infrastructure/qvapay/p2p-contract.ts` | Implemented |
| Tipos QvaPay P2P | `src/infrastructure/qvapay/p2p-types.ts` | Implemented |
| Mapper QvaPay P2P | `src/infrastructure/qvapay/p2p-mapper.ts` | Implemented |
| Cliente QvaPay P2P | `src/infrastructure/qvapay/qvapay-p2p-client.ts` | Implemented |
| Pruebas de dominio | `tests/domain/*` | Tested |
| Pruebas del adaptador | `tests/infrastructure/*` | Tested |

## No implementado todavía

Los siguientes elementos aparecen en la arquitectura objetivo, pero no tienen implementación identificable en el repositorio actual:

- Durable Object + Alarm.
- Scanner Runtime persistente.
- Persistencia D1 / Market Snapshot Repository.
- HTTP API.
- Web Interface.
- Webhook P2P.
- Stream SSE.
- Event Ingestion Boundary.
- Reconciliación persistente.
- Configuración persistente del intervalo.

## Regla

La presencia de un componente en un diagrama de arquitectura objetivo no constituye evidencia de implementación, prueba, verificación ni certificación.

La matriz de trazabilidad y el código son las fuentes para determinar el estado de implementación.