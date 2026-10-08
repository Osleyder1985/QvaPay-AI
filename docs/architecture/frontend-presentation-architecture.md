# Arquitectura de presentación del frontend

## Propósito

Definir la separación arquitectónica de la interfaz web de QvaPay-AI y evitar que la infraestructura Cloudflare sea propietaria de la experiencia visual.

## Dirección de dependencias

```text
Application Shell / infraestructura
        |
        +--> presentación de módulos
                |
                +--> contratos HTTP públicos
```

La capa de presentación no debe conocer Cloudflare Workers, Durable Objects, D1, secretos ni detalles internos de infraestructura.

## Primera separación implementada

El Dashboard se divide en tres recursos de presentación:

- `src/presentation/dashboard/dashboard-view.ts`: estructura HTML funcional;
- `src/presentation/dashboard/dashboard-styles.ts`: lenguaje visual y estilos;
- `src/presentation/dashboard/dashboard-client.ts`: comportamiento del navegador.

`src/infrastructure/cloudflare/public-app.ts` conserva la composición del documento, el Application Shell y los contratos públicos necesarios para el runtime.

## Regla de evolución

La separación anterior es una primera etapa. No constituye por sí sola el diseño final de clase mundial.

Las siguientes etapas deben introducir:

1. primitives y componentes reutilizables;
2. tokens semánticos;
3. patrones de interacción;
4. módulos funcionales independientes;
5. estados de interfaz gobernados;
6. accesibilidad WCAG 2.2 AA;
7. pruebas visuales y de interacción;
8. presupuesto de rendimiento;
9. motion y `prefers-reduced-motion`;
10. verificación responsive.

## Restricciones financieras

La presentación es consumidora de información. No es autoridad financiera.

No debe:

- calcular o persistir un saldo financiero como autoridad;
- duplicar estado financiero mutable;
- mezclar monedas o mercados;
- mezclar lados BUY/SELL;
- ejecutar operaciones por efectos visuales o eventos implícitos;
- recibir secretos de QvaPay.

Las acciones financieras, cuando estén habilitadas por los límites del producto, deben permanecer bajo autorización y validación server-side.

## Gobierno y trazabilidad

Este diseño se ejecuta dentro de la auditoría integral de interfaz #355 y su primera refactorización se controla mediante #356.

Las decisiones de diseño deben poder trazarse:

`Hallazgo → Requisito → Diseño → Implementación → Prueba → Quality → Security → Runtime → Evidencia`

ISO 9241-210 se utiliza como referencia para el diseño centrado en las personas; ISO/IEC 25010 para calidad del producto; WCAG 2.2 para accesibilidad; e ISO/IEC 27001 para controles aplicables de seguridad. Estas referencias no constituyen una declaración de certificación.
