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