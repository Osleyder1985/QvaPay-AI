# Inventario de pantallas y capacidades de interfaz

## Propósito

Este documento registra el estado real de la interfaz existente de QvaPay-AI antes de iniciar una migración de experiencia de usuario. No define una implementación visual final ni autoriza ejecución financiera.

La referencia de código auditada es `src/infrastructure/cloudflare/public-app.ts` sobre el baseline actual.

## 1. Arquitectura de presentación observada

La interfaz pública actual está concentrada en un único módulo de infraestructura:

- HTML completo embebido como constante `HTML`.
- CSS global embebido en la misma constante.
- JavaScript de navegador embebido en la misma constante.
- Renderizado de mercado, cuenta, administración, auditoría y estado del scanner en el mismo documento.
- Acceso directo desde la presentación a rutas HTTP del Worker.
- No existe una capa de componentes de presentación independiente dentro de la estructura observada.

### Clasificación

**Estado:** legado/provisional.

**Riesgo:** el acoplamiento dificulta evolución independiente, pruebas de componentes, control sistemático de estados, accesibilidad y trazabilidad entre requisitos y componentes.

**Referencia relacionada:** #99 y baseline de experiencia definido en #329/#330.

## 2. Mapa funcional observado

| Área actual          | Evidencia observada                                                           | Estado                                |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| Dashboard            | Vista principal con métricas y estado del scanner                             | Implementada                          |
| Scanner/Monitor      | Estado, cuenta regresiva y refresco del snapshot                              | Implementada                          |
| Mercado P2P          | Tablas BUY/SELL y métricas                                                    | Implementada                          |
| Cuenta QvaPay        | Datos de identidad, integración, aplicación y balance                         | Implementada                          |
| Cambio de contraseña | Formulario autenticado                                                        | Implementada                          |
| Administración       | Listado, creación y activación/desactivación de usuarios                      | Implementada                          |
| Auditoría            | Último ciclo, próximo ciclo y estado del snapshot                             | Parcial                               |
| Operaciones          | Representación de Comprar/Vender                                              | Presentación; ejecución no disponible |
| Arbitraje            | No existe un Workbench independiente en la estructura observada               | Brecha                                |
| Configuración        | No existe una superficie dedicada completa en la estructura observada         | Brecha                                |
| Seguridad            | Se representa estado general, pero no existe un Security Center independiente | Brecha                                |

## 3. Capacidades y rutas observadas

La presentación consume directamente, entre otras, las siguientes rutas:

- `GET /api/scanner/status`
- `GET /api/session`
- `POST /api/account/sync`
- `POST /api/account/password`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `POST /api/admin/users/:id/enable`
- `POST /api/admin/users/:id/disable`

La pantalla también representa acciones de Comprar/Vender, pero los controles visibles están deshabilitados y muestran que la operación real no está disponible. La interfaz no debe interpretarse como evidencia de ejecución financiera habilitada.

## 4. Hallazgos de interacción

### 4.1 Actualización del scanner acoplada al navegador

El navegador ejecuta `setInterval(refresh, 1000)` para consultar el estado del scanner cada segundo.

Esto es una **cadencia de observación**, no debería convertirse en una cadencia de ejecución. El scanner debe continuar siendo server-side y el navegador debe consumir un snapshot persistido.

**Referencia:** #279.

### 4.2 Lectura de estado con efecto lateral

La superficie `GET /api/scanner/status` ha sido identificada en auditorías anteriores como una ruta que puede invocar `ensureScheduled()`.

Una lectura de dashboard no debe mutar la programación del proceso. La nueva arquitectura debe separar:

- consulta observacional;
- configuración;
- inicio explícito;
- reprogramación;
- ejecución del scanner.

**Referencia:** #217.

### 4.3 Estado operativo insuficientemente explícito

La interfaz actual reconstruye `running` a partir de marcas temporales:

- `lastStartedAt`;
- `lastCompletedAt`.

Esto no constituye un estado de ejecución persistente suficientemente fuerte para un centro operativo auditable.

**Referencias:** #250 y #273.

### 4.4 Auditoría de interfaz limitada al último ciclo

La sección de auditoría presenta principalmente el último inicio, último fin, próximo ciclo, intervalo, moneda y último error.

No constituye todavía un Operations/Audit Center con:

- identificador de operación;
- correlación;
- actor;
- resultado;
- transición de estado;
- evidencia;
- reconciliación;
- historial consultable.

## 5. Integridad de datos presentada

La capa pública ya conserva tasas como cadenas decimales en el contrato de mercado, pero la vista convierte `bestBuy` y `bestSell` mediante `Number()` para calcular spread y porcentaje.

Esto introduce una segunda representación numérica en la capa de presentación. Para datos financieros, la interfaz definitiva debe recibir y representar valores decimales controlados sin depender de IEEE-754 para cálculos monetarios.

**Referencia:** #319 y controles derivados de #255.

## 6. Separación de BUY y SELL

La interfaz actual separa visualmente BUY y SELL y limita la presentación a 20 ofertas por lado.

Esto es correcto como comportamiento de presentación, pero la interfaz definitiva debe conservar además la separación semántica por:

- moneda;
- mercado;
- lado;
- estado;
- snapshot/correlación;
- momento de observación.

La cantidad visible nunca debe interpretarse como límite del snapshot ni del escaneo.

## 7. Estados que la nueva interfaz debe soportar

Cada superficie debe definir explícitamente al menos:

- carga;
- vacío;
- disponible;
- datos antiguos;
- datos incompletos;
- error recuperable;
- error de integridad;
- sin autorización;
- capacidad no disponible;
- operación pendiente;
- operación confirmada;
- operación rechazada;
- operación ambigua;
- reconciliación pendiente.

No se debe representar como operativo un estado cuya evidencia no lo permita.

## 8. Matriz objetivo de pantallas

La migración debe converger hacia módulos independientes:

1. **Dashboard** — resumen ejecutivo y salud.
2. **Cuenta QvaPay** — identidad, integración, capacidades y evidencia.
3. **Market Feed** — mercado estrictamente separado por moneda/mercado/lado.
4. **Arbitrage Workbench** — análisis, elegibilidad, capital, margen, riesgo y evidencia.
5. **Scanner / Monitor** — ejecución server-side y frescura.
6. **Operations Center** — operaciones y reconciliación.
7. **Audit & Evidence** — trazabilidad y evidencia.
8. **Security Center** — sesiones, RBAC, capacidades y controles.
9. **Administration** — usuarios y administración.
10. **Configuration** — configuración gobernada y cambios.

## 9. Requisitos de componentes

La interfaz definitiva debe evitar una nueva monoestructura. Cada módulo debe descomponerse en componentes reutilizables con:

- contrato de datos explícito;
- estados explícitos;
- autorización/capacidad explícita;
- accesibilidad;
- comportamiento responsive;
- pruebas;
- trazabilidad al requisito correspondiente.

Los componentes de datos financieros deben evitar cálculos monetarios con `Number()`.

## 10. Trazabilidad de la migración

La migración deberá mantener:

**Pantalla → capacidad → rol → datos → API → estado → acción → riesgo → componente → requisito → prueba → evidencia.**

Un módulo no se considerará completo por tener una apariencia visual terminada. Debe existir evidencia funcional, de seguridad, accesibilidad y comportamiento en estados límite.

## 11. Criterios de salida del inventario

Este inventario se considera completo para la fase inicial cuando:

- todas las superficies actuales están clasificadas;
- las capacidades con efecto lateral están identificadas;
- las brechas respecto de la arquitectura objetivo están trazadas;
- los controles financieros no se habilitan por la migración visual;
- cada módulo objetivo tiene requisitos y estados explícitos antes de su implementación.

## Estado

**DEFINED / INVENTARIO INICIAL COMPLETADO**

La siguiente fase es diseño detallado de información, componentes y estados, seguida de implementación incremental con CI, pruebas y evidencia.
