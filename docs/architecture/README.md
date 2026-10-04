# Arquitectura

Este directorio contiene la línea base arquitectónica de QvaPay-AI.

## Principios

1. Los requisitos gobiernan la arquitectura.
2. El dominio no depende de infraestructura.
3. La integración con QvaPay se aísla mediante adaptadores.
4. El escáner se ejecuta server-side y no depende de usuarios conectados.
5. BUY y SELL se procesan como libros independientes.
6. La persistencia conserva snapshots verificables del mercado.
7. Las decisiones técnicas relevantes se registran mediante ADR.
8. No se introducen microservicios mientras los requisitos no los justifiquen.

## Línea base

QvaPay-AI se define inicialmente como un monolito modular con principios de arquitectura hexagonal/Clean Architecture, desplegado sobre Cloudflare.

Componentes principales:

- Frontend web.
- HTTP API.
- Application layer.
- Domain layer.
- QvaPay adapter.
- Persistence adapter.
- Scanner runtime.
- Durable Object con alarms.
- Cloudflare D1.

## Estado

Propuesto. La arquitectura deberá validarse contra las capacidades reales de la API de QvaPay antes de considerar cerradas las decisiones de integración.