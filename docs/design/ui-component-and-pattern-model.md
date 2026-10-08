# Modelo de componentes y patrones de interfaz

## Objetivo

Esta capa convierte los tokens, las políticas de accesibilidad, el modelo de estados y las primitivas en componentes y patrones reutilizables para la interfaz operativa.

## Reglas

- Los componentes pertenecen exclusivamente a presentación.
- Reciben datos ya preparados por capas superiores.
- No acceden a Cloudflare Workers, D1, Durable Objects, credenciales ni clientes de QvaPay.
- No calculan balances, precios, rentabilidad, cantidades ni resultados financieros.
- No crean órdenes ni ejecutan operaciones.
- Los estados visuales usan el vocabulario central de `UiState`.
- Los valores financieros se presentan tal como fueron entregados por la fuente autorizada.
- El marcado dinámico debe escapar contenido textual antes de insertarlo en HTML.
- Las tablas deben conservar encabezados semánticos y permitir desplazamiento horizontal en pantallas pequeñas.

## Componentes

- `section-header`: jerarquía de sección.
- `metric-card`: métrica recibida de una fuente autorizada.
- `status-panel`: estado y límites de interacción.
- `empty-state`: ausencia de datos.
- `alert`: comunicación de severidad.
- `data-table`: presentación tabular accesible.

## Patrones

- `operational-panel`: sección + estado + contenido.
- `decision-card`: contexto + dato + estado, sin ejecución.

## Criterio de evolución

Los módulos funcionales deben consumir estos componentes y patrones en lugar de duplicar marcado y estilos. Una refactorización posterior puede sustituir progresivamente la composición histórica del Dashboard sin mezclar infraestructura con presentación.

## Referencias de gobierno

- WCAG 2.2, objetivo AA.
- ISO 9241-210:2019, diseño centrado en las personas.
- ISO/IEC 25010:2023, calidad del producto.
- ISO/IEC 27001:2022, controles de seguridad aplicables.
