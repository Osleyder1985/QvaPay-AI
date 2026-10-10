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

## Alcance de la validación monetaria por fases

La fase actual valida exclusivamente el mercado configurado `BANK_CUP`. En este mercado, el contrato P2P define `ratio = receive / amount`; `amount` representa QUSD y `receive` representa la moneda seleccionada. Por ello, la tabla rotula la tasa como `CUP/QUSD`, la cantidad base como QUSD y el importe recibido/pagado como CUP.

La identificación de otros mercados y la validación de sus unidades quedan expresamente fuera de esta fase y se abordarán después, mercado por mercado, usando el catálogo y la documentación oficial de QvaPay. No debe interpretarse que esos mercados sean desconocidos para QvaPay. Mientras no se haya validado su contrato, la interfaz evita atribuirles CUP u otra unidad por defecto y utiliza una etiqueta genérica segura.

No se realizan conversiones ni cambios de cálculo, ordenación o fórmula de spread en esta fase.

Fuentes oficiales para la fase BANK_CUP: [listado P2P y semántica de ratio](https://www.qvapay.com/docs/p2p/list) y [promedios por moneda, incluido BANK_CUP](https://www.qvapay.com/docs/p2p/averages).

## Justificación normativa

- ISO/IEC 25012: exactitud y consistencia de unidades frente al contrato de origen.
- ISO 9241-110: autodescriptividad de etiquetas financieras y prevención de ambigüedad.
- ISO/IEC/IEEE 29119: regresión automatizada de la unidad validada en esta fase.

## Fuente externa

La documentación oficial de QvaPay continúa siendo la fuente normativa del proveedor. Este documento describe el contrato utilizado por QvaPay-AI.
