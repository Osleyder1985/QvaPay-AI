# Contrato de la API P2P de QvaPay

## Propósito

Documentar el contrato que utiliza el adaptador de QvaPay-AI para consultar el mercado P2P.

## Endpoint

- Base URL: `https://api.qvapay.com`
- Método: `GET`
- Ruta: `/p2p`
- Autenticación: `app-id` + `app-secret` en server-side.

## Parámetros utilizados

| Parámetro   | Valor                                       |
| ----------- | ------------------------------------------- |
| `type`      | `buy` o `sell`                              |
| `coin`      | mercado configurado, actualmente `BANK_CUP` |
| `page`      | página actual                               |
| `take`      | hasta 100                                   |
| `orderBy`   | `updated_at`                                |
| `orderType` | `desc`                                      |

## Modelo interno

El adaptador valida:

- `uuid`;
- `type`;
- `coin`;
- `amount`;
- `receive`;
- `available_amount`;
- paginación;
- estado;
- timestamps;
- usuario;
- VIP.

La tasa interna se calcula:

`rate = receive / amount`

En el mercado configurado `BANK_CUP`, `amount` representa la cantidad del activo de cuenta expresada funcionalmente en QUSD y `receive` representa el importe fiat en CUP. Por tanto, la tasa presentada se interpreta como **CUP por QUSD**. `BANK_CUP` identifica el mercado P2P; no reemplaza la denominación QUSD del balance de cuenta.

## Semántica

- `buy` externo se mapea a `BUY`.
- `sell` externo se mapea a `SELL`.

En el dashboard:

- BUY: mayor tasa = mejor oferta;
- SELL: menor tasa = mejor oferta.

## Precisión

Los importes económicos llegan y se conservan como strings. El dominio compara decimales sin depender de floating point para ordenar.

El cálculo de la tasa se realiza actualmente mediante representación numérica para producir una tasa de presentación con hasta ocho decimales; cualquier ampliación de precisión deberá tratarse como cambio explícito.

## Errores

- `401`: autenticación;
- `4xx`: solicitud/contrato;
- `429`: rate limiting con backoff;
- `5xx`: fallo transitorio con reintentos limitados;
- timeout/red: fallo transitorio.

## Aplicación

La operación `POST /p2p/:uuid/apply` existe como capacidad independiente de lectura y requiere token de acción más credenciales server-side.

## Fuente externa

La documentación oficial de QvaPay continúa siendo la fuente normativa del proveedor. Este documento describe el contrato utilizado por QvaPay-AI.
