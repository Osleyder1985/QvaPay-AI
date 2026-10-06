# ADR-004: Ingestión de mercado orientada a eventos

## Estado

Dirección arquitectónica futura; no implementada.

## Contexto

La documentación histórica del proyecto contempló webhook y stream SSE de QvaPay. Sin embargo, el repositorio actual implementa consulta periódica mediante `GET /p2p`.

## Decisión

Mantener webhook + reconciliación + SSE como arquitectura futura, sin describirla como capacidad operativa actual.

La implementación vigente utiliza:

`Durable Object Alarm → GET /p2p → snapshot`

## Implicaciones

- no existe todavía un receptor webhook;
- no existe consumidor SSE;
- no existe deduplicación de eventos de feed;
- el intervalo actual representa la frecuencia del scanner basado en consulta.

Cuando se implemente ingestión event-driven, esta ADR deberá revisarse y la matriz de trazabilidad deberá actualizarse.

## Seguridad futura

Las futuras entradas webhook deberán validar firma y timestamp antes de procesar el payload.
