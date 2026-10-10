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

La tabla utiliza el mercado activo comunicado por el snapshot del scanner. La tasa del contrato P2P es `ratio = receive / amount`, es decir, unidades de la moneda seleccionada por QUSD. Los ticks `BANK_CUP`, `BANK_MLC` y `BANK_EUR` tienen respaldo en la documentación pública del proveedor y se presentan respectivamente como `CUP/QUSD`, `MLC/QUSD` y `EUR/QUSD`. El encabezado de cantidad del activo se mantiene como QUSD.

El mapeo de etiquetas debe limitarse a ticks documentados explícitamente. Cuando el identificador de mercado no tenga una unidad validada en el contrato disponible, la interfaz debe mostrar una etiqueta genérica basada en la semántica `receive / amount`, conservar visible el mercado activo y no reutilizar CUP por defecto. No se realizan conversiones ni cambios de cálculo por formato de presentación.

Fuentes contractuales consultadas: [listado P2P y semántica de ratio](https://www.qvapay.com/docs/p2p/list), [promedios por moneda, incluidos BANK_MLC](https://www.qvapay.com/docs/p2p/averages) y [ficha pública BANK_EUR](https://www.qvapay.com/coins/BANK_EUR).

## Justificación normativa

- ISO/IEC 25012: exactitud y consistencia de unidades frente al contrato de origen.
- ISO 9241-110: autodescriptividad de las etiquetas para evitar ambigüedad en la lectura de datos financieros.

## Fuente externa

La documentación oficial de QvaPay continúa siendo la fuente normativa del proveedor. Este documento describe el contrato utilizado por QvaPay-AI.
