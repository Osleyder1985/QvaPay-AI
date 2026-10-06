# Gobierno del dashboard

## Propósito

El dashboard es el punto central de observabilidad y organización operativa de QvaPay-AI. Su función es presentar el estado real del runtime, del mercado P2P y de los controles operacionales sin inventar evidencia.

La interfaz adopta una estructura de gestión inspirada en **ISO 9001** para calidad y trazabilidad, **ISO/IEC 27001** para seguridad de la información e **ISO 22301** para continuidad. Esta alineación arquitectónica **no constituye una certificación ISO**.

## Organización funcional

| Área | Propósito | Evidencia actual |
|---|---|---|
| Inicio | Estado general del runtime | Estado público del scanner |
| Mercado P2P | Observación separada de BUY y SELL | Snapshot persistido |
| Operaciones | Acciones P2P explícitas | Ruta protegida de aplicación |
| Controles | Seguridad, calidad, continuidad y exposición | Controles documentados y comportamiento del runtime |
| Auditoría | Trazabilidad operacional | Inicio, finalización, error y siguiente Alarm |

## Principios de diseño

1. **Fuente única de estado:** el navegador consume `GET /api/scanner/status`.
2. **Server-side first:** el scanner no depende de la interfaz abierta.
3. **Separación de responsabilidades:** mercado, operación, controles y auditoría se presentan por áreas independientes.
4. **Trazabilidad:** cada dato de ejecución visible debe proceder del estado real del Durable Object.
5. **Seguridad por diseño:** ningún secreto de QvaPay ni token interno se entrega al cliente.
6. **No sobreafirmación:** el dashboard no declara certificación ISO ni controles que no puedan demostrarse.
7. **Acciones explícitas:** Comprar/Vender son acciones reales y requieren confirmación y token de operación.
8. **Arbitraje separado:** el dashboard no ejecuta estrategias automáticas de arbitraje.

## Controles visuales

- **Seguridad:** credenciales y tokens permanecen del lado servidor.
- **Calidad:** el proyecto utiliza Quality Gate, pruebas, lint, formato y validación Cloudflare.
- **Continuidad:** Durable Object + Alarm mantienen el ciclo del scanner.
- **Trazabilidad:** el snapshot conserva marcas temporales y estado de ejecución.
- **Exposición:** las rutas internas requieren autorización y el contrato público está sanitizado.

## Límites

El dashboard no sustituye:

- auditorías formales;
- gestión documental ISO;
- registro histórico completo de evidencias;
- gestión de riesgos;
- gestión de incidentes;
- revisión de accesos;
- certificación externa.

Estas capacidades pueden incorporarse progresivamente mediante módulos y fuentes de datos verificables.

## Modo operativo del dashboard público

El dashboard público de producción es de solo lectura para las operaciones P2P que cambian estado. Los controles BUY/SELL permanecen como elementos visuales del mercado, pero están deshabilitados hasta que exista un límite de operación autenticado de forma independiente. El navegador nunca recopila credenciales de infraestructura.
