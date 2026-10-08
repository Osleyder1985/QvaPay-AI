# Design System y contratos de componentes

## Propósito

Definir el lenguaje visual, las reglas de interacción y los contratos mínimos de los componentes que formarán la interfaz objetivo de QvaPay-AI.

Este documento precede a la implementación visual y no autoriza ejecución financiera.

## Principios

1. La interfaz debe priorizar claridad operativa sobre ornamentación.
2. Los datos financieros deben conservar precisión, contexto y origen.
3. Lectura, análisis y ejecución deben permanecer visualmente diferenciados.
4. Los estados críticos nunca deben depender exclusivamente del color.
5. Los componentes deben tener comportamiento consistente en escritorio, portátil, tablet y móvil.
6. La interfaz debe hacer visible la frescura y la integridad del dato.
7. Una capacidad no autorizada debe mostrarse como no disponible, no como una acción parcialmente funcional.

## Design Tokens

### Tipografía

El sistema debe definir una escala tipográfica consistente para:

- navegación;
- títulos de módulo;
- encabezados de sección;
- métricas;
- etiquetas;
- valores financieros;
- texto auxiliar;
- mensajes de error y advertencia.

Los valores financieros deben utilizar una tipografía y alineación que faciliten comparación vertical y lectura de precisión decimal.

### Espaciado

Debe existir una escala base reutilizable para:

- separación entre módulos;
- separación entre tarjetas;
- densidad de tablas;
- formularios;
- diálogos;
- navegación.

No se deben introducir valores arbitrarios por componente sin justificación.

### Grid y responsive

El sistema debe definir:

- ancho máximo de contenido;
- columnas;
- gutters;
- breakpoints;
- comportamiento de paneles;
- prioridades de contenido en pantallas pequeñas.

Las tablas financieras no deben ocultar silenciosamente columnas críticas. Deben disponer de una representación alternativa que preserve moneda, mercado, lado, cantidad, tasa, estado y frescura.

### Radios y elevación

Los radios, bordes y niveles de elevación deben ser limitados y consistentes. La jerarquía debe provenir principalmente de estructura, espaciado y tipografía.

## Estados semánticos

Todo componente que represente estado debe admitir como mínimo:

- disponible;
- cargando;
- vacío;
- datos antiguos;
- datos incompletos;
- integridad comprometida;
- error recuperable;
- error permanente;
- sin autorización;
- capacidad no disponible;
- pendiente;
- confirmado;
- rechazado;
- ambiguo;
- reconciliación pendiente.

Cada estado debe tener:

- texto;
- semántica accesible;
- iconografía cuando corresponda;
- tratamiento visual consistente.

El color sólo complementa el significado.

## Componentes base

### Navegación

Debe soportar:

- módulo activo;
- navegación por teclado;
- foco visible;
- capacidades condicionadas por autorización;
- versión responsive.

### Tarjetas de estado

Deben mostrar:

- título;
- valor;
- estado;
- timestamp o frescura cuando aplique;
- origen;
- acción autorizada, si existe.

### Métricas

Deben diferenciar:

- valor actual;
- variación;
- unidad;
- moneda;
- período;
- origen.

No deben convertir un valor financiero ambiguo en una métrica aparentemente precisa.

### Tablas financieras

Contrato mínimo de una fila:

- identificador estable;
- moneda;
- mercado;
- lado BUY/SELL;
- estado;
- cantidad disponible;
- tasa;
- timestamp;
- frescura;
- origen;
- elegibilidad cuando corresponda.

Reglas:

- no mezclar monedas ni mercados en una misma semántica;
- no mezclar BUY y SELL sin una separación explícita;
- mantener precisión decimal;
- evitar `Number()` para cálculos financieros;
- mostrar unidades y contexto;
- indicar snapshots incompletos o antiguos;
- conservar ordenamiento y filtros coherentes.

### Filtros

Los filtros deben:

- representar el ámbito actual;
- indicar filtros activos;
- permitir limpiar;
- conservar contexto de moneda y mercado;
- evitar combinaciones semánticamente inválidas.

### Indicador de frescura

Debe distinguir al menos:

- actualizado;
- reciente;
- antiguo;
- vencido;
- desconocido.

Debe mostrar el timestamp cuando la precisión temporal sea relevante.

### Banner de integridad

Debe comunicar:

- qué dato está afectado;
- motivo;
- impacto;
- acción segura disponible;
- timestamp.

No debe ocultar una inconsistencia del snapshot detrás de un mensaje genérico.

### Estado de autorización

Debe diferenciar:

- autenticado;
- autorizado;
- capacidad disponible;
- capacidad no disponible;
- operación no autorizada.

La presentación visual nunca sustituye la autorización server-side.

### Formularios

Deben incluir:

- etiqueta explícita;
- unidad;
- restricciones;
- valor actual;
- valor propuesto;
- validación;
- mensaje de error;
- estado de guardado;
- evidencia cuando el cambio sea gobernado.

### Diálogos

Los diálogos críticos deben:

- explicar la consecuencia;
- identificar el objeto afectado;
- mostrar moneda/mercado/lado cuando aplique;
- exigir una acción explícita;
- permitir cancelación segura;
- no convertir estados ambiguos en errores definitivos.

## Contratos de módulos

### Market Feed

Debe consumir un contrato que identifique inequívocamente:

**moneda + mercado + lado + snapshot + timestamp + estado de integridad.**

### Arbitrage Workbench

Debe recibir oportunidades con:

**oferta origen + oferta destino + capital + cantidad + tasas + margen + beneficio estimado + límites + elegibilidad + frescura + riesgos.**

La presentación de una oportunidad no implica autorización para ejecutarla.

### Scanner / Monitor

Debe ser observacional. El contrato debe distinguir:

- estado persistente;
- ejecución;
- próximo ciclo;
- último resultado;
- error;
- snapshot;
- configuración.

La actualización de la pantalla no debe iniciar el scanner.

### Operations Center

Debe reservar el espacio contractual para:

- operation ID;
- correlation ID;
- actor;
- capacidad;
- objeto;
- estado;
- resultado;
- evidencia;
- reconciliación.

La implementación financiera futura deberá seguir las Solution Cards gobernadas y su autorización explícita.

### Audit & Evidence

Debe mostrar evidencia existente, no inferir certificación desde un estado visual.

### Security Center

Nunca debe renderizar secretos, tokens, material criptográfico ni valores sensibles innecesarios.

## Reglas de interacción

- Las acciones destructivas requieren confirmación.
- Las acciones financieras futuras requieren contexto completo antes de confirmar.
- Los errores recuperables deben ofrecer recuperación segura.
- Los estados ambiguos deben permanecer visibles como ambiguos.
- Las operaciones en curso no deben duplicarse por doble clic o refresco.
- El refresco de datos no debe mutar recursos cuando la operación solicitada es de lectura.
- La navegación no debe alterar el estado de ejecución del scanner.

## Accesibilidad

La implementación debe considerar WCAG 2.2:

- teclado completo;
- foco visible;
- orden de foco lógico;
- nombres accesibles;
- semántica HTML;
- contraste suficiente;
- mensajes asociados a controles;
- estados anunciables;
- alternativa textual al color;
- reducción de movimiento;
- tablas navegables.

## Trazabilidad

Cada componente deberá poder relacionarse con:

**componente → capacidad → requisito → contrato → implementación → prueba → evidencia.**

## Criterios de salida

El Design System queda en estado:

**DESIGNED — tokens y contratos de componentes definidos.**

Antes de la implementación visual deben cerrarse los contratos de datos y los estados que todavía dependan de controles de backend pendientes.

Este documento no autoriza ejecución financiera.
