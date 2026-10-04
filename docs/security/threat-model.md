# Modelo inicial de amenazas

## Activos

- credenciales de integración;
- configuración del scanner;
- snapshots del mercado;
- integridad del procesamiento;
- disponibilidad del scanner.

## Amenazas iniciales

| Amenaza | Impacto | Control inicial |
|---|---|---|
| Exposición de credenciales | Alto | Gestión de secretos |
| Respuesta externa manipulada o inválida | Alto | Validación de esquema |
| Configuración no autorizada | Medio/Alto | Autenticación y autorización |
| Denegación por proveedor | Alto | Timeout, política de reintentos y protección de circuito |
| Datos BUY/SELL mezclados | Alto | Invariantes de dominio y pruebas |
| Logs con secretos | Alto | Sanitización de logs |
| Duplicación por reintentos | Medio | Idempotencia |

## Principio

La seguridad debe diseñarse antes de incorporar operaciones que puedan modificar o ejecutar órdenes en QvaPay.