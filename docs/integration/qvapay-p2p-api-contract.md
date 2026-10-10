# Contrato de la API P2P de QvaPay

## Propósito

Documentar el contrato que utiliza el adaptador de QvaPay-AI para consultar el mercado P2P, conservando las unidades económicas declaradas por el proveedor.

## Endpoint

- Base URL: `https://api.qvapay.com`
- Método: `GET`
- Ruta: `/p2p`
- Autenticación: `app-id` + `app-secret` en server-side.

## Parámetros utilizados

| Parámetro   | Valor                                       |
| ----------- | ------------------------------------------- |
| `type`      | `buy` o `sell`                              |
| `coin`      | Mercado configurado, actualmente `BANK_CUP` |
| `page`      | Página actual                               |
| `take`      | Hasta 100                                   |
| `orderBy`   | `updated_at`                                |
| `orderType` | `desc`                                      |

## Modelo interno y unidades

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

La documentación oficial del proveedor establece las unidades de estos campos:

- `amount`: cantidad en QUSD.
- `receive`: cantidad en la moneda seleccionada por `coin`.
- `coin`: identificador de la moneda o mercado, por ejemplo `BANK_CUP`; en el ejemplo oficial, el objeto `Coin` describe ese tick como «Transferencia CUP».
- `ratio`: relación calculada como `receive / amount`.

Fuentes normativas del proveedor:

- [Crear Oferta P2P](https://www.qvapay.com/docs/p2p/create): documenta `amount` en QUSD y `receive` en la moneda seleccionada.
- [Listar Ofertas P2P](https://www.qvapay.com/docs/p2p/list): documenta `ratio = receive / amount`, el tick `BANK_CUP` y el objeto `Coin` asociado.

En consecuencia, para el mercado `BANK_CUP`, la tasa derivada `receive / amount` se expresa en CUP por QUSD. Esta conclusión procede del contrato documentado por QvaPay, no de la clave `coin` por sí sola. Si se habilitan otros mercados, la etiqueta de la tasa debe derivarse de los metadatos contractuales de la moneda activa; no se debe reutilizar automáticamente «CUP».

El balance de cuenta obtenido mediante el contrato independiente `/v2/balance` se presenta funcionalmente como QUSD en QvaPay-AI. No se deben convertir ni comparar directamente valores de mercado y balance sin respetar sus unidades y la semántica del campo.

## Semántica

- `buy` externo se mapea a `BUY`.
- `sell` externo se mapea a `SELL`.

En el dashboard:

- BUY: mayor tasa = mejor oferta.
- SELL: menor tasa = mejor oferta.

La tasa interna se calcula como `rate = receive / amount`; su unidad de presentación depende de la moneda seleccionada. Para `BANK_CUP`, es CUP/QUSD.

## Precisión

Los importes económicos llegan y se conservan como strings. El dominio compara decimales sin depender de floating point para ordenar.

El cálculo de la tasa se realiza actualmente mediante representación numérica para producir una tasa de presentación con hasta ocho decimales; cualquier ampliación de precisión deberá tratarse como cambio explícito. El redondeo de presentación no debe modificar las decisiones de ordenamiento ni los cálculos financieros.

## Errores

- `401`: autenticación;
- `4xx`: solicitud/contrato;
- `429`: rate limiting con backoff;
- `5xx`: fallo transitorio con reintentos limitados;
- timeout/red: fallo transitorio.

## Aplicación

La operación `POST /p2p/:uuid/apply` existe como capacidad independiente de lectura y requiere token de acción más credenciales server-side.

## Aplicación de cambios

Este documento especifica unidades y procedencia de datos; no cambia las reglas de negocio, el cálculo de tasa, el orden BUY/SELL ni los permisos de aplicación. Las etiquetas visuales de mercados adicionales deben implementarse a partir de metadatos contractuales validados y con pruebas de regresión.

## Referencias normativas de calidad

- ISO/IEC 25012: modelo de calidad de datos, aplicado a la exactitud y consistencia de unidades con respecto al contrato de origen.
- ISO 9241-110: principios de diálogo, aplicado a la autodescriptividad de las etiquetas financieras para reducir interpretaciones ambiguas.

## Alcance de la validación monetaria por fases

La fase actual valida exclusivamente el mercado configurado `BANK_CUP`. En este mercado, el contrato P2P define `ratio = receive / amount`; `amount` representa QUSD y `receive` representa la moneda seleccionada. Por ello, la tabla rotula la tasa como `CUP/QUSD`, la cantidad base como QUSD y el importe recibido/pagado como CUP.

La identificación de otros mercados y la validación de sus unidades quedan expresamente fuera de esta fase y se abordarán después, mercado por mercado, usando el catálogo y la documentación oficial de QvaPay. No debe interpretarse que esos mercados sean desconocidos para QvaPay. Mientras no se haya validado su contrato, la interfaz evita atribuirles CUP u otra unidad por defecto y utiliza una etiqueta genérica segura.

No se realizan conversiones ni cambios de cálculo, ordenación o fórmula de spread en esta fase.

Fuentes oficiales para la fase BANK_CUP: [listado P2P y semántica de ratio](https://www.qvapay.com/docs/p2p/list) y [promedios por moneda, incluido BANK_CUP](https://www.qvapay.com/docs/p2p/averages).

## Justificación normativa

- ISO/IEC 25012: exactitud y consistencia de unidades frente al contrato de origen.
- ISO 9241-110: autodescriptividad de etiquetas financieras y prevención de ambigüedad.
- ISO/IEC/IEEE 29119: regresión automatizada de la unidad validada en esta fase.
