# Arquitectura

## Propósito

Este directorio contiene la arquitectura documentada de QvaPay-AI y distingue de forma explícita la implementación actual de las capacidades futuras.

## Arquitectura implementada

La implementación vigente es un monolito modular sobre Cloudflare:

```text
Cloudflare Worker
      │
      ├── Public Web Application
      ├── Public Scanner Status
      ├── Protected P2P Apply Boundary
      └── Protected Scanner Control
              │
              ▼
       Durable Object
              │
             Alarm
              │
              ▼
       Scanner Runtime
              │
              ▼
        QvaPay P2P Client
```

## Principios

1. El dominio no depende de infraestructura.
2. QvaPay se aísla mediante un adaptador.
3. BUY y SELL son libros independientes.
4. Cada mercado se identifica mediante `coin`.
5. El scanner se ejecuta server-side.
6. El navegador consume el estado público; no controla el ciclo del scanner.
7. Los secretos permanecen en infraestructura.
8. La arquitectura futura no se presenta como implementación actual.

## Estado

El Worker, Durable Object, Alarm, runtime, cliente QvaPay, dashboard público y estado persistido del scheduler están implementados y cubiertos por pruebas.

D1, webhook, SSE, ingestión event-driven completa y arbitraje permanecen como arquitectura futura.
