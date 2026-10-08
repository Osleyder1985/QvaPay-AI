# Gobierno del dashboard

## Propósito

El dashboard es el punto central de observabilidad y organización operativa de QvaPay-AI. Presenta el estado real del runtime y del mercado P2P sin inventar evidencia.

La estructura toma como referencia prácticas de **ISO 9001**, **ISO/IEC 27001** e **ISO 22301**. Esta alineación no constituye certificación ISO.

## Organización funcional

| Área | Propósito | Evidencia actual |
|---|---|---|
| Inicio | Estado general del runtime | Estado público del scanner |
| Mercado P2P | Observación separada de BUY y SELL | Snapshot persistido |
| Operaciones | Acciones P2P | Frontera de operación aún bloqueada en el dashboard público |
| Controles | Seguridad, calidad y continuidad | CI/CD + controles documentados |
| Auditoría | Trazabilidad operacional | Inicio, finalización, error y siguiente Alarm |

## Principios

1. **Fuente única de estado:** el navegador consume `GET /api/scanner/status`.
2. **Server-side first:** el scanner no depende de la interfaz abierta.
3. **Separación de responsabilidades:** mercado, cuenta, operación, controles y auditoría tienen límites explícitos.
4. **Trazabilidad:** los datos visibles proceden del estado persistido del Durable Object o de una fuente QvaPay identificada.
5. **Seguridad por diseño:** ningún secreto de QvaPay ni token interno se entrega al cliente.
6. **No sobreafirmación:** el dashboard no declara certificación ISO ni capacidades que estén bloqueadas.
7. **Acciones explícitas:** los controles BUY/SELL son representación visual del mercado; no ejecutan operaciones desde el dashboard público.
8. **Arbitraje separado:** el dashboard no ejecuta estrategias automáticas de arbitraje.

## Modo operativo público

El dashboard público es **solo lectura** respecto de operaciones P2P que cambian estado. Las acciones Comprar/Vender se presentan como información contextual del mercado y permanecen deshabilitadas hasta que exista una frontera de operación autenticada de forma independiente.

El navegador no solicita, almacena ni transmite secretos operacionales.

## Límites

El dashboard no sustituye auditorías formales, gestión documental ISO, gestión de riesgos, gestión de incidentes, revisión de accesos ni certificación externa. Estas capacidades requieren módulos y evidencias específicas.


## Navegación modular y diseño visual — 2026-10

La interfaz autenticada introduce rutas dedicadas bajo `/app/{module}`. El Worker valida sesión antes de servir cualquier ruta modular y exige el rol `ADMINISTRATION` para `/app/usuarios`; la autorización de las API sigue siendo obligatoria y no se delega al cliente.

El shell conserva navegación, encabezado contextual, estado de sesión y el área de contenido. El contenido visible se limita al módulo activo. Los módulos funcionales aún no implementados se muestran explícitamente como pendientes, sin datos ficticios ni acciones simuladas.

La dirección visual usa superficies coherentes, jerarquía tipográfica, navegación activa, paneles contextuales y estados de implementación. Las animaciones deben respetar `prefers-reduced-motion`; los emojis son apoyo visual, nunca sustituyen etiquetas accesibles. La alineación con ISO 9241-210, ISO/IEC 25010 y WCAG 2.2 AA es un objetivo de diseño y verificación, no una declaración de certificación.

### Trazabilidad
- Requisito funcional: #474.
- Solution Card visual: #475.
- Gobernanza de diseño: #270.
- Verificación pendiente: Quality Gate, Security Gate, pruebas de rutas y roles, accesibilidad, responsive y smoke autenticado de producción.
