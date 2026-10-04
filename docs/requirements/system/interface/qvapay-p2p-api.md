# QvaPay P2P API Interface Requirements

## Base URL

La API documentada utiliza:

`https://api.qvapay.com`

## Operación de lectura

- Método: `GET`
- Ruta: `/p2p`
- Autenticación admitida: Bearer Token o credenciales de aplicación, según la configuración y permisos de la integración.

## Parámetros relevantes

| Parámetro | Tipo | Uso |
|---|---|---|
| `page` | number | Página |
| `take` | number | Cantidad por página; máximo documentado: 100 |
| `type` | string | `buy` o `sell` |
| `coin` | string | Tick de la moneda/mercado |
| `orderBy` | string | Incluye `ratio` y `best_rate` |
| `orderType` | string | `asc` o `desc` |

Para `best_rate`, QvaPay exige `type` y `coin`.

## Respuesta

La respuesta utiliza paginación estilo Laravel y contiene un arreglo `data`.

Campos relevantes de cada oferta:

- `uuid`
- `type`
- `coin`
- `amount`
- `receive`
- `status`
- `created_at`
- `updated_at`
- `offer_kind`
- `available_amount`
- `reserved_amount`
- `order_min`
- `order_max`

También puede incluir información del usuario y de la moneda.

Los valores decimales se serializan como strings; el adaptador deberá evitar asumir que llegan como números JSON.

## Semántica de tasa

QvaPay define `ratio = receive / amount`.

- En `sell`, el ratio representa lo que paga quien compra QUSD por unidad y una tasa más baja es mejor para el tomador.
- En `buy`, el ratio representa lo que recibe quien vende QUSD por unidad y una tasa más alta es mejor para el tomador.
- `best_rate` normaliza esta perspectiva.

El sistema de QvaPay-AI no deberá usar la semántica de `ratio` de forma global sin considerar `type` y `coin`.

## Autenticación y secretos

Para una ejecución server-to-server, QvaPay documenta `app-id` y `app-secret` como mecanismo apropiado para integraciones autónomas y recomienda esta modalidad para bots de arbitraje y sistemas automáticos.

Las credenciales deberán permanecer exclusivamente en infraestructura server-side.

## Estado

Contrato documentado a partir de la documentación oficial de QvaPay. Las pruebas de contrato deberán verificar el comportamiento real antes de considerar esta especificación cerrada.
