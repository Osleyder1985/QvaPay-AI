# Blueprints visuales de pantallas e interacción

**Estado:** DESIGNED — blueprint previo a implementación.

## 1. Principios visuales

La interfaz prioriza jerarquía, legibilidad, densidad operativa controlada y evidencia visible. Las acciones tienen menor jerarquía que la información crítica cuando una capacidad está bloqueada o no disponible.

Cada pantalla mantiene una cabecera contextual con título, propósito, frescura y permisos relevantes. El contenido se organiza en bloques semánticos, no en una página monolítica.

## 2. Dashboard / Inicio

**Composición:** cabecera contextual; estado global; métricas ejecutivas; Cuenta QvaPay; Scanner; Market Feed; alertas de integridad y seguridad; accesos a módulos.

**Jerarquía:** salud e integridad → datos recientes → análisis → navegación.

## 3. Cuenta QvaPay

Identidad y avatar; estado de integración; correlación usuario-aplicación; balance con moneda y frescura; fuentes; capacidades; última sincronización. Los valores no disponibles nunca se sustituyen por cero.

## 4. Market Feed

Selector inequívoco de coin/mercado; BUY/SELL; snapshot y frescura; spread y liquidez; tabla; filtros; integridad.

Tabla: identidad del instrumento → precio → cantidad → límites → origen → timestamp → frescura. BUY y SELL permanecen separados. Los filtros nunca mezclan instrumentos.

## 5. Arbitrage Workbench

Contexto del instrumento; capital; evidencia de entrada; escenario de salida; margen; beneficio estimado; límites; elegibilidad; riesgos; evidencia; resultado de simulación.

La simulación se identifica persistentemente como análisis. Cualquier futura ejecución requiere un flujo operativo separado.

## 6. Scanner / Monitor

Estado actual; última ejecución; próxima ejecución; intervalo; duración; resultado; error; frescura; historial.

El contador visual es informativo. Consultar la pantalla no inicia ni reprograma el scanner.

## 7. Operations Center

Resumen; filtros; lista/timeline; detalle; correlation ID; operation ID; actor; timestamps; resultado; reconciliación.

El estado ambiguo nunca comparte la semántica visual de confirmado.

## 8. Audit & Evidence

Filtros por actor, evento, resultado y tiempo; tabla; panel de evidencia; trazabilidad; completitud. La evidencia se presenta como evidencia y no como sustituto de una capacidad runtime.

## 9. Security Center

Postura de seguridad; sesión; rol y capacidades; credenciales; controles; eventos; bloqueos; alertas. Secretos y tokens nunca forman parte de la representación.

## 10. Administration

Usuarios; rol; estado; capacidades; acciones; confirmación; resultado; auditoría. Las mutaciones permanecen pendientes hasta confirmación del servidor.

## 11. Configuration

Configuración efectiva; origen; rango; estado; última modificación; edición; historial. Los cambios server-side muestran su efecto persistido.

## 12. Flujo visual de estados

Estados operativos mínimos: loading → ready → stale/degraded → failed.

Cuando corresponda: ready → blocked → authorized/preconditioned → submitted → confirmed/rejected/ambiguous → reconciled.

No se representa una transición como completada antes de la evidencia correspondiente.

## 13. Responsive

**Desktop/laptop:** navegación lateral, cabecera contextual, paneles paralelos y tablas completas.

**Tablet:** navegación compacta, paneles apilables y reducción controlada de columnas.

**Móvil:** una columna, navegación adaptada, tarjetas de contexto y tablas transformadas sin perder moneda, BUY/SELL, timestamp ni frescura.

## 14. Accesibilidad

Foco visible; orden lógico de teclado; objetivos táctiles adecuados; etiquetas accesibles; errores asociados; estados no dependientes solo del color; tablas y diálogos navegables; contenido crítico disponible en todos los tamaños.

## 15. Matriz de trazabilidad

| Pantalla | Contrato | Componentes | Estados | Evidencia |
|---|---|---|---|---|
| Dashboard | Inicio | métricas, alertas, tarjetas | loading/degraded/stale/failed | estado agregado |
| Cuenta | Cuenta | identidad, integración, balance | verified/degraded/failed | snapshot |
| Market Feed | Mercado | filtros, tabla, frescura | ready/stale/partial/failed | snapshot |
| Arbitrage | Análisis | escenario, margen, riesgos | calculable/blocked/degraded | evidencia de mercado |
| Scanner | Monitor | estado, contador, historial | running/idle/failed | ejecución persistida |
| Operations | Operacional | timeline, detalle | pending/confirmed/ambiguous/reconciled | operación |
| Audit | Evidencia | tabla, detalle | complete/partial | eventos |
| Security | Seguridad | capacidades, controles | secure/degraded/blocked | eventos |
| Administration | Administrativo | usuarios, acciones | authorized/blocked/pending | auditoría |
| Configuration | Configuración | formularios, historial | valid/invalid/pending | configuración persistida |

## 16. Criterios de salida

1. Cada pantalla tiene composición definida.
2. La jerarquía visual no contradice el Design System.
3. Todos los estados críticos tienen representación.
4. Responsive y accesibilidad están definidos.
5. Los datos financieros mantienen contexto e integridad.
6. Las simulaciones no se confunden con ejecución.
7. La UI no controla procesos server-side.
8. Existe trazabilidad con los contratos aprobados.

Este documento no autoriza ejecución financiera ni cambios críticos del dominio financiero.