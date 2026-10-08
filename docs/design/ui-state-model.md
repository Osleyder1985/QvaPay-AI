# Modelo de estados de interfaz

## Propósito

QvaPay-AI utiliza un vocabulario común de estados para que una pantalla operativa no confunda ausencia de datos, datos desactualizados, degradación del servicio y errores de acceso.

## Estados cubiertos

- **loading:** todavía no existe una representación confiable para interactuar.
- **ready:** los datos disponibles pueden presentarse como actualizados.
- **stale:** existen datos, pero su actualidad debe quedar visible.
- **empty:** la consulta terminó sin datos.
- **partial:** sólo una parte de la información requerida está disponible.
- **degraded:** el servicio continúa disponible con capacidades reducidas.
- **error:** la consulta no pudo producir una representación confiable.
- **unauthorized:** se necesita una sesión válida.
- **forbidden:** la sesión existe, pero no tiene autorización.
- **offline:** no existe conectividad disponible.
- **reconnecting:** la interfaz está intentando recuperar conectividad.
- **success:** una operación permitida terminó correctamente.

## Regla de confianza

Los estados de presentación no autorizan operaciones financieras. El estado visual sólo comunica la condición conocida por las capas superiores. La autoridad sobre saldo, mercado, ofertas, órdenes y ejecución permanece en el servidor.

## Regla de interacción

Un estado que no representa datos confiables no debe ofrecer controles que aparenten permitir una decisión basada en esos datos.

## Trazabilidad

- Auditoría integral de interfaz: #355
- Arquitectura modular: #356
- Sistema de diseño: #357
- Verificación de accesibilidad, responsive, rendimiento y regresión visual: #359
