# Architecture Overview

## Objetivo

Definir la arquitectura lógica y física inicial de QvaPay-AI para satisfacer SYS-FR-001 a SYS-FR-004.

## Flujo principal

```
QvaPay P2P API
      |
      v
QvaPay Adapter
      |
      v
Application: ScanMarket
      |
      +--> Domain: Market / Offer
      |
      v
Persistence Adapter
      |
      v
Cloudflare D1
      |
      v
HTTP API
      |
      v
Web UI
```

## Ejecución 24/7

El navegador no ejecuta el ciclo principal del scanner.

```
Durable Object
      |
      +--> Alarm
             |
             v
        ScanMarket
             |
             v
        QvaPay API
             |
             v
        D1 Snapshot
```

El usuario puede no estar conectado y el proceso debe continuar.

## Separación de mercados

Cada oferta deberá conservar como mínimo market/pair, currency, side, rate, amount, available amount y timestamp de captura.

BUY y SELL nunca se deben mezclar durante clasificación ni presentación.

## Dependencias

Las dependencias externas principales son QvaPay, Cloudflare y GitHub. Las capacidades exactas de QvaPay quedan sujetas a validación mediante documentación y pruebas de contrato.
## Event-driven market ingestion

La ingestión del mercado seguirá una estrategia event-driven con reconciliación. El webhook P2P aporta entrega firmada con cola y reintentos; el stream SSE aporta eventos en vivo pero no acumula eventos durante desconexiones. Ambos convergen en la misma frontera de validación, deduplicación, normalización y persistencia.

```
QvaPay P2P
   |------------------|
   v                  v
Webhook            Stream SSE
   |                  |
   +--------+---------+
            v
   Event Ingestion Boundary
            |
            v
 Validate / Deduplicate
            |
            v
      Market State (D1)
            ^
            |
   GET /p2p Reconciliation
```

El navegador no mantiene vivo el scanner. La reconciliación se ejecuta server-side y permite recuperar divergencias por pérdida de eventos o desconexiones.

La definición detallada se encuentra en ADR-004 y en el contrato documentado del feed P2P.
