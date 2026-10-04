# ADR-004: Event-Driven Market Ingestion

## Estado

Accepted as initial architectural direction, condicionada a las restricciones del runtime de producción.

## Contexto

QvaPay ofrece un feed P2P mediante webhook y stream SSE. El webhook proporciona entrega firmada con cola y reintentos. El stream proporciona eventos en vivo, pero no acumula eventos durante una desconexión y QvaPay indica que la conexión puede cortarse periódicamente.

QvaPay también expone `GET /p2p`, que se utilizará para reconciliación.

Cloudflare Durable Objects no debe utilizarse bajo la premisa de que un `fetch()` outbound SSE mantiene indefinidamente el objeto activo. Cloudflare documenta que los fetch outbound normales no mantienen el Durable Object vivo por el mero hecho de tener un cuerpo de respuesta en streaming. Los Durable Object Alarms tienen además un límite de 15 minutos por invocación.

## Decisión

Para producción sobre Cloudflare:

1. **Webhook P2P es el canal primario de ingestión de eventos.**
2. **GET /p2p es el mecanismo obligatorio de reconciliación y recuperación.**
3. **Stream SSE es opcional y no crítico.** Puede utilizarse únicamente cuando exista un runtime adecuado para mantener la conexión outbound y gestionar sus reconexiones sin convertirla en una dependencia de disponibilidad.
4. Webhook y reconciliación convergen en el mismo pipeline de validación, deduplicación, normalización y persistencia.
5. Durable Object + Alarm gestiona la programación de reconciliaciones y el estado operativo del scanner.
6. No se introduce infraestructura externa permanente únicamente para mantener el stream mientras webhook + reconciliación cubran el objetivo de disponibilidad.

## Flujo

```
                    QvaPay P2P
                        |
                +-------+--------+
                |                |
                v                v
        Webhook primario    Stream opcional
                |                |
                |          (no crítico)
                |                |
                +-------+--------+
                        v
             Event Ingestion Boundary
                        |
              Validate / Deduplicate
                        |
                    Normalize
                        |
                        v
                 Market State D1
                        ^
                        |
                 Reconciliation
                   GET /p2p
                        ^
                        |
              Durable Object Alarm
```

## Reconciliación

La reconciliación deberá ejecutarse con un intervalo configurable y validado. Su propósito es detectar y corregir:

- eventos perdidos;
- desconexiones;
- divergencias;
- ofertas que cambiaron mientras el canal de eventos estaba indisponible;
- expiración o fallo del feed.

El intervalo de configuración representa por tanto la **frecuencia máxima de reconciliación**, no la frecuencia primaria de detección.

## Idempotencia

Los eventos deberán procesarse de forma idempotente. La deduplicación utilizará la identidad documentada por QvaPay y el identificador de la oferta/evento disponible en el payload.

## Seguridad

- Credenciales y secretos únicamente server-side.
- Webhook autenticado antes de procesar el payload.
- Payload externo validado antes de entrar al dominio.
- Ningún secreto o firma completa en logs.
- Esta arquitectura no autoriza operaciones financieras automáticas.

## Consecuencias

### Positivas

- Cloudflare no depende de una conexión SSE outbound permanente.
- El webhook aprovecha la cola y los reintentos de QvaPay.
- La reconciliación permite recuperación determinista.
- El scanner permanece independiente del navegador.
- Stream puede añadirse posteriormente como acelerador sin convertirse en dependencia crítica.

### Negativas

- La actualización puede tener latencia adicional si depende de webhook + reconciliación.
- Se requiere implementación cuidadosa de idempotencia y reconciliación.
- El feed P2P es una capacidad de pago de QvaPay.

## Referencias

- Issue #12: Define event-driven P2P market ingestion strategy.
- Contrato: `docs/integration/qvapay-p2p-feed-contract.md`.
- QvaPay P2P webhooks y stream.
- Cloudflare Workers Limits y Durable Objects Lifecycle.
