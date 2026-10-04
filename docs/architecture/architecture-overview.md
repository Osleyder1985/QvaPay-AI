# Resumen de arquitectura

> **Estado documental:** arquitectura objetivo/propuesta. Este documento no implica que todos los componentes descritos estén implementados.

## Objetivo

Definir la arquitectura lógica y física inicial de QvaPay-AI para satisfacer SYS-FR-001 a SYS-FR-004.

## Clasificación del estado

La arquitectura objetivo descrita a continuación representa la evolución prevista del sistema. La implementación actualmente verificable se limita al dominio, caso de uso de escaneo y adaptador QvaPay P2P documentados en la matriz de trazabilidad.

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

## Ejecución 24/7 (objetivo)

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

## Ingestión de mercado orientada a eventos (objetivo)

La ingestión de producción seguirá una estrategia event-driven con reconciliación. El **webhook P2P será el canal primario**; el stream SSE será opcional y no crítico. Ambos pueden converger en la misma frontera de validación, deduplicación, normalización y persistencia.

```
QvaPay P2P
   |------------------|
   v                  v
Webhook primario   Stream opcional
   |                  |
   +--------+---------+
            v
   Event Ingestion Boundary
            |
   Validate / Deduplicate
            |
         Normalize
            |
            v
      Market State (D1)
            ^
            |
   GET /p2p Reconciliation
            ^
            |
   Durable Object Alarm
```

El navegador no mantiene vivo el scanner. Durable Object + Alarm programa reconciliaciones server-side. El sistema no depende de mantener una conexión SSE outbound permanente en Cloudflare.

La definición detallada se encuentra en ADR-004 y en el contrato documentado del feed P2P.
