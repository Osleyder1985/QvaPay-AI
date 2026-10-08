# Arquitectura de implementación de la nueva interfaz

**Estado:** DESIGNED — arquitectura previa a implementación de runtime.

## 1. Objetivo

Sustituir progresivamente la interfaz monolítica por un shell de aplicación gobernado, manteniendo los contratos existentes y evitando una migración de alto riesgo.

## 2. Capas

1. **Shell:** navegación global, sesión, permisos, tema y composición.
2. **Módulos:** Dashboard, Cuenta, Market Feed, Arbitrage, Scanner, Operations, Audit, Security, Administration y Configuration.
3. **Presentación:** componentes visuales, estados y accesibilidad.
4. **Estado de pantalla:** filtros, selección de instrumento y estado transitorio local.
5. **Datos:** clientes y contratos existentes; la UI no redefine reglas de dominio.
6. **Servidor:** APIs, Durable Objects, D1 y fuentes externas; mantiene la autoridad operacional.

## 3. Regla de autoridad

El navegador consume datos y solicita operaciones permitidas. No puede convertirse en autoridad del Scanner, mercado, elegibilidad financiera ni reconciliación.

## 4. Contrato de módulo

Cada módulo debe declarar propósito, datos de entrada, datos de salida, permisos, estados, errores, acciones permitidas y evidencia asociada.

Los módulos no comparten estado financiero mutable de forma implícita.

## 5. Contexto de mercado

El contexto se modela explícitamente como coin + mercado + lado + snapshot + timestamp + frescura.

Un cambio de contexto invalida los datos derivados del contexto anterior. BUY y SELL no comparten listas ni cálculos.

## 6. Separación de análisis y operación

Market Feed proporciona evidencia. Arbitrage Workbench consume evidencia y produce análisis o simulación. Operations Center representa operaciones cuando exista una capacidad operativa certificada.

La UI no debe crear una ruta implícita entre simulación y ejecución.

## 7. Scanner / Monitor

El Scanner permanece en Durable Object. La interfaz consulta estado persistido y representa última ejecución, próxima ejecución, resultado y error.

El refresco visual no programa alarmas ni ejecuta ciclos.

## 8. Migración incremental

### Fase 1 — shell

Introducir navegación y composición sin alterar contratos de datos.

### Fase 2 — módulos observacionales

Migrar Cuenta, Market Feed, Scanner y Audit.

### Fase 3 — análisis

Migrar Arbitrage Workbench como superficie de análisis y simulación.

### Fase 4 — operaciones y administración

Migrar Operations, Security, Administration y Configuration respetando RBAC y auditoría.

### Fase 5 — retirada

Eliminar progresivamente la presentación monolítica solo cuando exista equivalencia funcional, pruebas y evidencia.

## 9. Compatibilidad

Durante la transición no se deben duplicar autoridades. Un módulo nuevo y la interfaz anterior pueden coexistir visualmente, pero deben consumir la misma fuente server-side.

## 10. Pruebas

Cada módulo requiere pruebas de componentes, estados, accesibilidad, responsive, contratos de datos y regresión.

Los módulos financieros requieren además pruebas de precisión, contexto de instrumento y separación BUY/SELL.

## 11. Evidencia

Cada migración se rastrea mediante requisito → contrato → módulo → componente → prueba → evidencia → certificación.

Una pantalla visualmente completa no equivale a una capacidad certificada.

## 12. Criterios de salida

1. El shell tiene límites definidos.
2. Cada módulo tiene autoridad y dependencia explícitas.
3. La UI no controla procesos server-side.
4. Los datos financieros conservan contexto y precisión.
5. La migración puede ejecutarse por etapas reversibles.
6. Existen pruebas y evidencia por módulo.
7. La interfaz monolítica solo se retira después de demostrar equivalencia.
8. Ninguna fase habilita ejecución financiera por sí misma.

Esta arquitectura no autoriza cambios críticos del dominio financiero ni ejecución de órdenes.
