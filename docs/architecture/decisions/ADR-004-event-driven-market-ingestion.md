# ADR-004: Event-Driven Market Ingestion

## Estado

Accepted as initial architectural direction.

## Contexto

El listado P2P `GET /p2p` de QvaPay está cacheado y el proveedor documenta que consultar más rápido que la caché no garantiza datos más frescos. QvaPay ofrece además un feed del mercado P2P mediante webhook y stream SSE. El webhook dispone de cola y reintentos; el stream es en vivo y no acumula eventos durante una desconexión.

Para QvaPay-AI, cuyo objetivo es observar el mercado de forma continua, un modelo basado exclusivamente en polling introduce consultas repetitivas y no ofrece la mejor latencia de detección.

## Decisión

QvaPay-AI adoptará una estrategia **event-driven con reconciliación**:

1. **Webhook P2P** como canal durable de eventos cuando esté habilitado.
2. **Stream SSE** como canal de baja latencia para reacción inmediata cuando resulte operativo.
3. **GET /p2p** como mecanismo de reconciliación y recuperación de estado, no como mecanismo primario de detección.
4. Todos los canales convergerán en el mismo pipeline interno de validación, normalización, deduplicación y persistencia.
5. El estado persistido en D1 será la representación interna observable del mercado; ningún canal externo será tratado como fuente de verdad permanente sin validación.
6. El sistema deberá tolerar eventos duplicados, pérdida temporal del stream, errores del proveedor y expiración de la suscripción.

## Razones

- El webhook ofrece cola y reintentos documentados por QvaPay.
- El stream evita exponer un endpoint público y permite reaccionar en vivo.
- La reconciliación con `GET /p2p` permite recuperar divergencias producidas por pérdida de eventos o indisponibilidad temporal.
- La separación de canales evita acoplar el dominio a una única modalidad de transporte.

## Consecuencias

### Positivas

- Menor dependencia del polling frecuente.
- Menor presión sobre los límites de consultas del proveedor.
- Menor latencia potencial para detectar cambios.
- Recuperación explícita ante pérdida de eventos.
- Un único pipeline interno para múltiples fuentes de ingestión.

### Negativas

- Mayor complejidad operacional que un polling simple.
- Se requiere deduplicación e idempotencia.
- Se requiere reconciliación periódica.
- El feed es una capacidad de pago de QvaPay y debe gestionarse su ciclo de suscripción.

## Límites de esta decisión

Esta decisión **no autoriza** creación, edición, aplicación, cancelación ni ejecución automática de ofertas P2P.

La semántica exacta del intervalo configurable del scanner deberá redefinirse como frecuencia de reconciliación si la implementación confirma el modelo event-driven.

## Referencias

- Issue #12: Define event-driven P2P market ingestion strategy.
- Contrato oficial QvaPay P2P feed: webhook y stream.
