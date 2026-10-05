# Contrato de la API P2P de QvaPay

## Propósito

Este documento define el contrato externo verificado que QvaPay-AI utilizará para consultar el mercado P2P de QvaPay en modo de solo lectura.

La fuente normativa para los detalles del proveedor es la documentación oficial de QvaPay. Este documento traduce ese contrato a reglas internas del proyecto y no sustituye la documentación del proveedor.

## Endpoint de mercado

- Base URL: `https://api.qvapay.com`
- Método: `GET`
- Ruta: `/p2p`
- Autenticación soportada: Bearer Token o credenciales de aplicación `app-id` + `app-secret`.
- Para un proceso servidor 24/7, las credenciales deben permanecer exclusivamente en infraestructura de servidor y nunca exponerse al navegador.

### Parámetros relevantes

| Parámetro | Tipo | Uso |
|---|---|---|
| `page` | number | Página; valor predeterminado 1 |
| `take` | number | Elementos por página; máximo 100 |
| `type` | string | `buy` o `sell` |
| `coin` | string | Tick de mercado, por ejemplo `BANK_CUP` |
| `orderBy` | string | Incluye `updated_at`, `created_at`, `amount`, `receive`, `ratio`, `best_rate`, `rating`, `trades` |
| `orderType` | string | `asc` o `desc` |

Para `best_rate`, QvaPay exige `type` y `coin`.

## Semántica de las ofertas

La respuesta pública del mercado contiene, entre otros:

Los campos de paginación deben interpretarse como enteros; el proveedor puede serializarlos como números o como cadenas decimales sin parte fraccionaria. El adaptador normaliza ambos formatos a enteros seguros y rechaza valores no enteros. Si `last_page` no está presente, el adaptador lo deriva de `total` y `per_page`.

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
- información del usuario ofertante
- información de la moneda

Los valores decimales pueden llegar serializados como **strings**. El adaptador no debe convertirlos a `number` de forma ingenua cuando eso pueda introducir pérdida de precisión.

El ratio del proveedor es:

`ratio = receive / amount`

La dirección económica del ratio depende del tipo de oferta:

- `sell`: quien toma la oferta compra QUSD pagando la moneda; una tasa menor es mejor para quien compra.
- `buy`: quien toma la oferta vende QUSD y recibe la moneda; una tasa mayor es mejor para quien vende.

Por tanto, BUY y SELL son libros independientes y nunca deben combinarse para ordenar o comparar tasas.

## Paginación

El endpoint utiliza paginación estilo Laravel. El adaptador deberá recorrer las páginas necesarias para construir un snapshot completo del conjunto consultado.

El criterio de completitud debe basarse en los metadatos de paginación de la respuesta, no en asumir que una sola página representa todo el mercado.

## Frescura y límites

La documentación oficial indica que el listado público puede estar cacheado durante unos segundos y que consultas más frecuentes no necesariamente producen datos más frescos.

También existe rate limiting para el listado P2P. Ante `429`, el cliente debe aplicar backoff y respetar el límite indicado por QvaPay.

El monitor interno no debe generar reintentos agresivos ni bucles sin límite.

## Errores mínimos a manejar

| HTTP | Tratamiento |
|---|---|
| `400` | Marcar intento inválido por parámetros/contrato y no reintentar ciegamente |
| `401` | Señalar fallo de autenticación/configuración; no repetir indefinidamente |
| `429` | Aplicar backoff y respetar el límite |
| `5xx` | Tratar como fallo transitorio según política de reintento |
| Timeout/red | Tratar como fallo transitorio según política de reintento |

Los mensajes de error del proveedor no deben ser el único mecanismo para clasificar errores cuando exista un código estable.

## Reglas de integración para QvaPay-AI

1. El dominio no dependerá de los DTO de QvaPay.
2. El adaptador validará el esquema externo antes de mapearlo.
3. El adaptador preservará la identidad del mercado mediante `coin`.
4. BUY y SELL se procesarán de forma independiente.
5. La UI no almacenará ni enviará credenciales de proveedor.
6. La captura de mercado será de solo lectura en esta fase.
7. Los snapshots conservarán `observedAt` y los timestamps de proveedor disponibles.
8. La lógica de ordenamiento de presentación no modificará los datos recibidos.
9. El escáner no asumirá que `created_at` representa frescura actual; la frescura de observación será determinada por `observedAt`.
10. El cliente debe tolerar evolución compatible del contrato y fallar de forma segura ante campos obligatorios inválidos.

## Fuente oficial

- Listado P2P: https://www.qvapay.com/docs/p2p/list
- Credenciales de aplicación: https://www.qvapay.com/docs/p2p/app-credentials
- Introducción API: https://www.qvapay.com/docs

Fecha de verificación: 2026-10-04.
