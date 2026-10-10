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

## Etiquetas monetarias de la tabla

La tabla utiliza el mercado activo comunicado por el snapshot del scanner. Para `BANK_CUP`, la documentación oficial del proveedor identifica la moneda seleccionada como Transferencia CUP y define `ratio = receive / amount`; por ello la presentación de tasa es `CUP/QUSD`. El encabezado de cantidad del activo se mantiene como QUSD.

Cuando el identificador de mercado no tiene una unidad de moneda validada en el contrato disponible, la interfaz debe mostrar una etiqueta genérica basada en la semántica `receive / amount` y no reutilizar CUP por defecto. La identidad del mercado activo debe seguir visible. La ampliación a otros mercados requiere evidencia contractual explícita y pruebas de regresión para cada par; no se realizan conversiones ni cambios de cálculo por formato de presentación.

## Justificación normativa

- ISO/IEC 25012: exactitud y consistencia de unidades frente al contrato de origen.
- ISO 9241-110: autodescriptividad de las etiquetas para evitar ambigüedad en la lectura de datos financieros.

## Fuente externa

La documentación oficial de QvaPay continúa siendo la fuente normativa del proveedor. Este documento describe el contrato utilizado por QvaPay-AI.
