# Contrato del feed de mercado P2P de QvaPay

## Propósito

Documentar el contrato externo verificado del feed P2P de QvaPay que utilizará QvaPay-AI como fuente de eventos de mercado.

## Canales

QvaPay documenta dos canales para el mismo feed:

| Canal | Transporte | Característica principal | Recuperación |
|---|---|---|---|
| Webhook | HTTP POST | Entrega firmada | Cola + reintentos |
| Stream | SSE | Eventos en vivo | No acumula eventos durante desconexión |

La misma suscripción habilita ambos canales.

## Suscripción

El feed del mercado P2P está documentado por QvaPay con un coste de **$10 por 30 días**, cobrado del saldo de la cuenta dueña de la aplicación.

La suscripción y su estado deben considerarse una dependencia operativa externa.

## Eventos

QvaPay documenta:

- `p2p.created`: se publica una oferta.
- `p2p.reopened`: una oferta tomada vuelve a estar disponible.
- `p2p.applied`: alguien aplica como contraparte.
- `p2p.paid`: el comprador marca el pago.
- `p2p.completed`: la operación termina.
- `p2p.cancelled`: la oferta se cancela.

Para mantener una copia del libro de ofertas, la documentación de QvaPay identifica `created` y `reopened` como eventos de entrada y `applied` y `cancelled` como eventos que retiran una oferta. `paid` y `completed` son relevantes principalmente para análisis de operaciones realizadas.

## Payload externo normalizado

Cada evento incluye:

- `event`
- `sent_at`
- `data.uuid`
- `data.type`
- `data.coin`
- `data.amount`
- `data.receive`
- `data.status`
- `data.updated_at`
- `data.only_vip`
- `data.offer_kind`
- `data.available_amount`
- `data.order_min`
- `data.order_max`
- `data.owner_uuid`
- `data.owner_vip`

Los valores económicos pueden llegar serializados como texto y no deben convertirse a `number` de JavaScript de forma que se pierda precisión.

## Webhook

### Seguridad

QvaPay documenta los headers:

- `x-qvapay-signature`
- `x-qvapay-timestamp`

La firma es HMAC-SHA256 del cuerpo HTTP crudo. La validación debe ejecutarse antes de interpretar el JSON.

El receptor debe rechazar solicitudes sin firma y considerar inválido un timestamp con más de cinco minutos de antigüedad.

### Entrega

QvaPay documenta reintentos:

| Intento | Espera |
|---|---:|
| 1 | inmediato |
| 2 | 30 s |
| 3 | 2 min |
| 4 | 10 min |
| 5 | 1 h |

Los reintentos ocurren ante errores de red, 5xx y 429. El receptor debe responder 2xx rápidamente y procesar posteriormente. QvaPay indica un límite de cinco segundos para la respuesta.

### Idempotencia

El mismo evento puede llegar más de una vez. La documentación recomienda usar `event + data.uuid` como clave de deduplicación.

### Implicación para QvaPay-AI

El endpoint webhook será delgado:

`receive → verify → deduplicate → persist/queue → 2xx`

La lógica de dominio no deberá depender del tiempo de respuesta del proveedor.

## Stream SSE

El endpoint documentado es:

`GET /v2/p2p/stream`

Autenticación mediante `app-id` y `app-secret`.

El stream devuelve eventos SSE, incluyendo un evento `init` con `expires_at`. Si la suscripción expira, QvaPay envía `subscription_expired` y cierra la conexión.

El stream es **en vivo**: los eventos que ocurren mientras estamos desconectados no se acumulan.

### Implicación para QvaPay-AI

El stream no será tratado como canal durable. Una desconexión debe activar recuperación mediante reconciliación y/o webhook.

## Reconciliación

`GET /p2p` permanecerá como mecanismo de recuperación.

La reconciliación deberá:

1. Obtener las ofertas abiertas relevantes.
2. Validar el contrato externo.
3. Normalizar mercados, lados, tasas y cantidades.
4. Comparar el estado observado con el snapshot interno.
5. Insertar, actualizar o retirar ofertas según corresponda.
6. Registrar la marca temporal propia de observación.
7. Mantener el último estado válido ante errores transitorios.

## Reglas de seguridad

- Credenciales de aplicación únicamente server-side.
- Secreto del feed únicamente server-side.
- Nunca registrar secretos, firmas completas ni cookies.
- Validar firma antes de parsear/usar el payload.
- Validar esquema y valores externos antes de entrar al dominio.
- Aplicar deduplicación e idempotencia.
- No ejecutar operaciones financieras como consecuencia de un evento de mercado en esta fase.

## Estado de verificación

Contrato documentado a partir de la documentación oficial de QvaPay consultada el 2026-10-04.

Las capacidades de producción deberán validarse posteriormente mediante pruebas de contrato y una suscripción de feed habilitada.

## Decisión de QvaPay-AI para Cloudflare

Para la arquitectura de producción en Cloudflare, el **webhook es el canal primario** y `GET /p2p` es la reconciliación obligatoria. El stream SSE queda como canal opcional/no crítico.

No se debe asumir que un Durable Object puede mantener indefinidamente una conexión SSE outbound mediante `fetch()`. La documentación de Cloudflare indica que los fetch outbound normales no mantienen un Durable Object vivo por el mero hecho de que el cuerpo de respuesta esté en streaming. Por ello, el stream no será una dependencia de disponibilidad del scanner.
