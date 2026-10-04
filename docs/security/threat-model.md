# Initial Threat Model

## Activos

- credenciales de integración;
- configuración del scanner;
- snapshots del mercado;
- integridad del procesamiento;
- disponibilidad del scanner.

## Amenazas iniciales

| Threat | Impacto | Control inicial |
|---|---|---|
| Exposición de credenciales | Alto | Secret management |
| Respuesta externa manipulada o inválida | Alto | Schema validation |
| Configuración no autorizada | Medio/Alto | Authentication and authorization |
| Denegación por proveedor | Alto | Timeout, retry policy y circuit protection |
| Datos BUY/SELL mezclados | Alto | Domain invariants y tests |
| Logs con secretos | Alto | Log sanitization |
| Duplicación por reintentos | Medio | Idempotencia |

## Principio

La seguridad debe diseñarse antes de incorporar operaciones que puedan modificar o ejecutar órdenes en QvaPay.