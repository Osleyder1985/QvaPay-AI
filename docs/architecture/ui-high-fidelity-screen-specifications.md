# Especificaciones visuales de alta fidelidad

**Estado:** DESIGNED — especificación previa a implementación.

## 1. Sistema de composición

La aplicación adopta una estructura persistente de tres niveles: navegación global; cabecera contextual de módulo; área de trabajo.

La navegación global identifica el módulo activo. La cabecera contextual identifica instrumento, cuenta, estado de frescura y permisos cuando sean relevantes. El área de trabajo contiene únicamente información y acciones pertenecientes al contexto activo.

No se utilizará una página única con todos los módulos.

## 2. Dashboard / Inicio

**Estructura:** navegación global; cabecera con estado de plataforma; tarjetas de salud de Cuenta, Market Feed y Scanner; alertas; resumen de mercado; actividad reciente; accesos a módulos.

**Prioridad:** integridad y seguridad → disponibilidad y frescura → métricas → actividad → navegación secundaria.

Las métricas sin fuente o timestamp se presentan como no disponibles.

## 3. Cuenta QvaPay

Identidad principal; estado de integración; correlación usuario-aplicación; balance; capacidades; fuentes; última sincronización; evidencia.

El balance muestra siempre moneda, fuente, timestamp y estado. Los estados no disponible, obsoleto, degradado y fallido no se representan como cero.

## 4. Market Feed

Selector de coin; selector de mercado; selector BUY/SELL; indicador de snapshot; métricas; filtros; tabla; panel de integridad.

Columnas mínimas: instrumento | lado | precio | cantidad | mínimo | máximo | origen | timestamp | frescura.

La interfaz mantiene visible el contexto del instrumento en todo momento. Los estados cargando, listo, vacío, parcial, obsoleto, degradado, fallido y bloqueado por integridad tienen representación propia.

Un snapshot parcial o inconsistente no se presenta como completo.

## 5. Arbitrage Workbench

Contexto: coin, mercado, lado y fuente. Entrada: oferta compatible, precio, cantidad y capital requerido. Salida: oferta compatible o escenario simulado, precio propuesto, margen y beneficio estimado. Controles: capital, límites, elegibilidad, frescura y riesgos. Evidencia: snapshot y timestamp utilizados.

La simulación se identifica como SIMULACIÓN. Una eventual operación real deberá aparecer en Operations Center y requerir un flujo de autorización independiente.

No se muestran controles de ejecución real mientras la capacidad no exista y no esté certificada.

## 6. Scanner / Monitor

Estado del servidor; última ejecución; próxima ejecución; intervalo; duración; resultado; error; frescura; historial.

El contador indica el tiempo hasta la próxima ejecución persistida. No controla el scanner. Consultar la pantalla no programa operaciones.

## 7. Operations Center

Filtros; resumen de estados; timeline; detalle; identificación de operación; correlación; actor; timestamps; resultado; reconciliación.

Los estados ambiguo y confirmado utilizan semánticas visuales incompatibles entre sí.

## 8. Audit & Evidence

Filtros; tabla de eventos; detalle; referencias; evidencia asociada; estado de completitud.

La evidencia se puede inspeccionar sin convertirla en una acción operativa.

## 9. Security Center

Postura; sesión; rol; capacidades; credenciales; controles; eventos; bloqueos; alertas.

Nunca se representan secretos ni tokens.

## 10. Administration

Usuarios; roles; capacidades; estado; acciones permitidas; confirmación; resultado; auditoría.

Toda mutación administrativa tiene una fase visual pendiente antes de mostrar resultado confirmado.

## 11. Configuration

Configuración efectiva; origen; valor actual; rango; estado; última modificación; edición; historial.

Los valores inválidos bloquean el guardado y muestran el motivo junto al campo afectado.

## 12. Navegación

Dashboard → Cuenta → Market Feed → Arbitrage → Scanner → Operations → Audit → Security → Administration → Configuration.

Los módulos no disponibles por rol permanecen ocultos o claramente bloqueados según el contrato de autorización.

Cada módulo enlaza únicamente a contextos compatibles. Un cambio de coin o mercado invalida los datos dependientes del contexto anterior.

## 13. Responsive

**Escritorio:** panel lateral persistente, paneles paralelos, tablas completas y detalle contextual.

**Portátil:** panel lateral compacto, densidad reducida y paneles adaptables.

**Tablet:** navegación compacta y bloques apilables.

**Móvil:** una columna, acciones agrupadas, tablas transformadas y contexto persistente. Nunca se elimina moneda, lado, timestamp o frescura.

## 14. Accesibilidad

Foco visible; navegación completa por teclado; orden lógico; etiquetas accesibles; errores asociados; estados no dependientes únicamente del color; contraste conforme a WCAG 2.2; diálogos con foco administrado; tablas navegables; objetivos táctiles adecuados.

## 15. Densidad de información

La densidad aumenta progresivamente: resumen → análisis → detalle → evidencia.

Las tablas financieras priorizan comparación y precisión. Las tarjetas no sustituyen información necesaria para decidir.

## 16. Trazabilidad visual

Cada pantalla se vincula mediante la cadena requisito → contrato → pantalla → componente → estado → prueba → evidencia.

Ningún elemento visual puede representar una capacidad sin una fuente contractual o de implementación que la respalde.

## 17. Criterios de aceptación

1. Las diez pantallas tienen composición definida.
2. La navegación global y contextual están definidas.
3. Los estados críticos tienen representación explícita.
4. Responsive está definido en cuatro escalas.
5. Accesibilidad está integrada en cada contrato.
6. Los datos financieros conservan contexto y precisión.
7. BUY/SELL y coin/mercado no se mezclan.
8. Simulación y ejecución están visualmente separadas.
9. Scanner permanece bajo autoridad server-side.
10. Existe trazabilidad requisito → evidencia.
11. La especificación no requiere modificar runtime para considerarse completa.
12. Ningún control visual autoriza ejecución financiera.

Esta especificación no habilita ejecución financiera ni sustituye los controles críticos del dominio.