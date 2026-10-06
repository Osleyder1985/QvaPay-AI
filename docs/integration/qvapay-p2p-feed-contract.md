# Contrato del feed de mercado P2P de QvaPay

## Estado

**No implementado en el repositorio actual.**

Este documento conserva la dirección futura del proyecto y no debe utilizarse como evidencia de una capacidad desplegada.

## Canales previstos

- Webhook HTTP.
- Stream SSE.

## Reconciliación prevista

`GET /p2p` seguirá siendo el mecanismo de recuperación cuando se implemente ingestión por eventos.

## Seguridad prevista

- validación de firma;
- validación de timestamp;
- deduplicación;
- idempotencia;
- credenciales exclusivamente server-side.

## Relación con la implementación actual

La implementación actual no contiene endpoint webhook ni consumidor SSE. El scanner funciona mediante Alarm + `GET /p2p`.

Cualquier incorporación de estos canales requiere actualización de arquitectura, requisitos, pruebas, Quality Gate y evidencia de producción.
