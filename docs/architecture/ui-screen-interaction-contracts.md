# Contratos de pantallas e interacción de QvaPay-AI

**Estado:** DESIGNED — especificación previa a implementación.

## 1. Propósito

Este documento convierte la arquitectura de información y el Design System en contratos verificables de pantalla e interacción. Ningún contrato visual habilita por sí mismo ejecución financiera.

## 2. Reglas transversales

- Cada pantalla declara propósito, datos requeridos, fuente, frescura, permisos y capacidades disponibles.
- Toda capacidad no soportada por el backend se presenta como no disponible o bloqueada; nunca como ejecutable.
- Los datos financieros conservan moneda, mercado, lado BUY/SELL, precisión decimal, origen, timestamp y estado de integridad.
- Los estados mínimos son loading, empty, partial, stale, degraded, failed y blocked.
- Las acciones protegidas muestran autorización, precondiciones y resultado; una acción visible no implica autorización.
- Scanner/Monitor representa estado persistido por servidor; la navegación y el refresco no programan ni ejecutan ciclos.
- Las tablas financieras no convierten valores a IEEE-754 para cálculos.
- Toda vista debe ser utilizable con teclado y conservar información crítica en móvil.

## 3. Contratos por pantalla

### 3.1 Dashboard / Inicio

**Objetivo:** ofrecer una lectura ejecutiva del sistema.

**Debe mostrar:** estado de cuenta, estado de integración, salud del scanner, frescura del mercado, oportunidades analíticas y alertas de integridad.

**No debe mostrar:** una operación financiera como ejecutable si sus precondiciones no están satisfechas.

**Acciones:** navegar a módulos; no ejecutar operaciones financieras directamente.

### 3.2 Cuenta QvaPay

**Objetivo:** mostrar identidad, integración y evidencia de la cuenta conectada.

**Datos:** identidad autenticada, aplicación, estado de correlación, balance y metadatos de fuente/frescura.

**Estados:** verificado, degradado, no disponible, fallido.

**Regla:** ausencia o inconsistencia de una fuente crítica impide presentar la cuenta como íntegramente verificada.

### 3.3 Market Feed

**Objetivo:** observación de mercado sin mezclar instrumentos.

**Contrato mínimo:** coin, mercado, lado BUY/SELL, precio, cantidad disponible, límites, origen, timestamp y frescura.

**Regla de integridad:** respuestas paginadas inconsistentes, duplicadas o de coin/side incorrectos no se presentan como snapshot autoritativo.

**Interacción:** filtros por coin/mercado/side, ordenación y búsqueda sin alterar la identidad del instrumento.

### 3.4 Arbitrage Workbench

**Objetivo:** análisis de oportunidades por instrumento aislado.

**Debe separar:** capital, entrada, salida, margen, beneficio estimado, límites, liquidez, elegibilidad y riesgos.

**Regla:** nunca mezclar monedas o mercados. Una simulación no equivale a una orden real.

**Ejecución:** cualquier futura acción financiera requiere un contrato operativo independiente y autorización gobernada.

### 3.5 Scanner / Monitor

**Objetivo:** observar el proceso server-side.

**Debe mostrar:** estado explícito, última ejecución, próxima ejecución, duración, resultado, error, intervalo configurado, frescura y evidencia histórica disponible.

**Regla:** el navegador nunca inicia, duplica, reprograma ni detiene el scanner mediante una consulta de estado.

### 3.6 Operations Center

**Objetivo:** seguimiento operacional de operaciones y estados.

**Debe mostrar:** operation ID, correlation ID, actor, timestamps, estado, resultado, error, evidencia y reconciliación cuando exista.

**Estados:** pendiente, en curso, confirmado, rechazado, ambiguo, reconciliado, fallido.

**Regla:** estado ambiguo nunca se representa como confirmado.

### 3.7 Audit & Evidence

**Objetivo:** consultar evidencia trazable.

**Debe mostrar:** actor, acción, recurso, tiempo, resultado, correlation ID y referencias de evidencia.

**Regla:** no convertir evidencia documental en afirmación de capacidad runtime.

### 3.8 Security Center

**Objetivo:** visibilidad de autenticación, autorización e integración.

**Debe mostrar:** rol, capacidades, sesiones, estado de credenciales, controles de seguridad, eventos y bloqueos.

**Regla:** secretos y tokens nunca se muestran; las respuestas de API no deben filtrar credenciales.

### 3.9 Administration

**Objetivo:** administración de usuarios y configuración autorizada.

**Regla:** cada mutación requiere autorización explícita y debe reflejar resultado y auditoría. La UI no debe asumir éxito antes de la confirmación del servidor.

### 3.10 Configuration

**Objetivo:** administrar configuración gobernada.

**Debe distinguir:** valor efectivo, origen, rango permitido, última modificación y estado.

**Regla:** cambios que afecten procesos server-side deben reflejarse como configuración persistida y no depender de la sesión del navegador.

## 4. Contrato de interacción

### Navegación

- navegación principal estable;
- retorno preservando contexto no sensible;
- rutas profundas reproducibles;
- estado activo visible;
- ningún cambio de pantalla altera procesos server-side.

### Carga y error

Toda carga debe tener estado explícito. Los errores deben distinguir fallo de red, ausencia de datos, degradación, autorización insuficiente e integridad comprometida.

### Tablas

- encabezados accesibles;
- ordenación determinista;
- filtros visibles;
- columnas financieras con unidad/moneda;
- frescura y origen identificables;
- adaptación progresiva en móvil.

### Formularios

Cada campo declara formato, rango, unidad, obligatoriedad y error. Los valores financieros preservan representación decimal exacta.

### Confirmaciones

Una confirmación solo aparece cuando existe una operación real soportada por backend. Para simulaciones y análisis debe quedar explícito que no se envía ninguna orden.

## 5. Responsive

**Desktop/laptop:** navegación completa, tablas densas y paneles simultáneos.

**Tablet:** navegación compacta y priorización de columnas.

**Móvil:** una columna, acciones críticas accesibles, tablas transformadas sin pérdida de moneda/side/frescura.

## 6. Accesibilidad

- foco visible y orden lógico;
- navegación completa por teclado;
- nombres accesibles;
- contraste conforme a WCAG 2.2;
- estados no comunicados únicamente mediante color;
- mensajes de error asociados a controles;
- tablas y diálogos utilizables con tecnologías de asistencia.

## 7. Trazabilidad

Cada contrato debe poder relacionarse con:

**requisito → pantalla → componente → estado → interacción → prueba → evidencia → certificación.**

## 8. Criterios de salida

El contrato se considera listo para implementación cuando:

1. todas las pantallas objetivo tienen propósito y datos definidos;
2. todos los estados relevantes están especificados;
3. los permisos y capacidades están diferenciados;
4. las reglas financieras y de integridad están preservadas;
5. responsive y accesibilidad están definidos;
6. no existe interacción que presuponga ejecución financiera no autorizada;
7. existe trazabilidad con requisitos y Design System.
