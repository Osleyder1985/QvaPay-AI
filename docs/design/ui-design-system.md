# Sistema de diseño de interfaz

## Propósito

QvaPay-AI adopta un sistema de diseño explícito para que la evolución visual no dependa de estilos aislados dentro de módulos funcionales. La interfaz debe conservar una jerarquía clara para información financiera, estados operacionales y acciones sensibles.

## Capas

- **Tokens:** variables semánticas para color, tipografía, espaciado, forma, profundidad y movimiento.
- **Primitivas:** controles pequeños y reutilizables con contratos de accesibilidad.
- **Componentes:** unidades visuales con una responsabilidad clara.
- **Patrones:** composiciones para tareas repetibles como tablas de mercado, estados del scanner y trazabilidad.
- **Módulos:** experiencias funcionales completas que consumen las capas anteriores.
- **Application Shell:** navegación, encabezado, estado global y punto de montaje.

## Reglas de diseño

1. La información financiera tiene prioridad visual sobre el ornamento.
2. BUY, SELL, moneda y mercado se representan con semántica explícita y no se mezclan.
3. Observación, recomendación y ejecución deben tener estados visuales inequívocos.
4. Las acciones sensibles requieren intención explícita y retroalimentación inmediata.
5. El movimiento debe aportar comprensión; nunca debe ocultar cambios de estado.
6. La preferencia de movimiento reducido debe respetarse globalmente.
7. Los controles interactivos deben mantener un objetivo táctil mínimo de 44 px.
8. El foco de teclado debe permanecer visible.
9. Los números financieros deben utilizar una tipografía de datos estable y legible.
10. Los tokens deben ser la fuente preferente de valores visuales compartidos.

## Alcance actual

Esta etapa establece la base de tokens, movimiento y accesibilidad. No constituye todavía la implementación completa del rediseño visual ni evidencia de conformidad WCAG 2.2 AA.

## Gobernanza

Toda nueva interfaz debe justificar excepciones a los tokens existentes. Las decisiones de diseño deben permanecer separadas de la infraestructura Cloudflare y de la autoridad financiera server-side.

## Trazabilidad

- Auditoría integral de interfaz: #355
- Arquitectura modular: #356
- Sistema de diseño: #357
- Verificación de accesibilidad, responsive, rendimiento y regresión visual: #359
