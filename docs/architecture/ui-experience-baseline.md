# Baseline de experiencia e interfaz de QvaPay-AI

## Propósito

Este documento establece el baseline funcional, estructural y de experiencia para la futura interfaz definitiva de QvaPay-AI. No constituye certificación ISO ni autorización de ejecución financiera.

## Estado de la interfaz actual

La rama principal utiliza `src/infrastructure/cloudflare/public-app.ts` como frontera de presentación. El módulo contiene el documento HTML, estilos, navegación, renderizado de datos y comportamiento del navegador.

La auditoría clasifica esta interfaz como **provisional**.

El objetivo no es añadir más controles visuales sobre el mismo monolito, sino migrar progresivamente hacia una arquitectura de presentación separada y verificable.

## Principios de diseño

1. **Información antes que decoración.** Cada elemento visible debe responder a una necesidad operacional.
2. **Estado antes que acción.** La interfaz debe comunicar frescura, integridad, disponibilidad, permisos y riesgos antes de presentar acciones.
3. **El backend es la autoridad.** La interfaz nunca sustituye autenticación, autorización, validación financiera ni scheduling.
4. **Observación, análisis y ejecución son capacidades distintas.**
5. **Un mercado es una unidad aislada.** No se mezclan monedas, mercados ni lados.
6. **Los datos deben conservar procedencia y frescura.**
7. **Los estados ambiguos no se convierten en éxito.**
8. **Responsive desde el diseño**, no como adaptación posterior.
9. **Accesibilidad como requisito**, no como acabado.
10. **Trazabilidad completa:** requisito → diseño → componente → implementación → prueba → evidencia.

## Arquitectura de información objetivo

### Inicio

Resumen ejecutivo del sistema:

- estado general;
- cuenta conectada;
- integridad de datos;
- mercado seleccionado;
- mejor BUY/SELL;
- spread;
- frescura;
- scanner;
- alertas relevantes;
- accesos a módulos.

### Cuenta QvaPay

- identidad autenticada;
- correlación aplicación-cuenta;
- estado de integración;
- balance y procedencia;
- capacidades P2P;
- estado de verificación;
- última sincronización;
- errores y degradaciones.

### Market Feed

Cada mercado se presenta de forma independiente:

- moneda;
- mercado/pago;
- BUY;
- SELL;
- profundidad;
- disponibilidad;
- mejor precio;
- spread;
- filtros;
- ordenación;
- frescura;
- timestamp;
- integridad del snapshot.

### Arbitrage Workbench

Área de análisis sin ejecución financiera:

- oportunidad;
- mercado;
- capital;
- entrada;
- salida;
- margen;
- beneficio estimado;
- límites;
- elegibilidad;
- evidencia;
- riesgos;
- procedencia;
- estado del cálculo.

### Scanner / Monitor

Representación del proceso server-side:

- estado;
- mercado/moneda;
- intervalo;
- última ejecución;
- próxima ejecución;
- duración;
- resultado;
- error;
- frescura;
- historial disponible.

El navegador únicamente observa y configura capacidades expresamente autorizadas.

### Operations Center

Preparado para representar operaciones futuras sin inventar estados:

- operación;
- correlación;
- actor;
- fecha/hora;
- mercado;
- oferta;
- estado;
- resultado;
- reconciliación;
- evidencia;
- estado ambiguo.

### Audit & Evidence

- eventos;
- actores;
- resultados;
- evidencia;
- correlaciones;
- cambios de configuración;
- controles;
- estado de certificación.

### Administration

- usuarios;
- roles;
- capacidades;
- sesiones;
- integración;
- configuración no sensible;
- estado de controles.

### Security

- autenticación;
- RBAC;
- sesiones;
- credenciales;
- controles;
- eventos de seguridad;
- estado de integración.

### System Status

- Worker;
- Durable Objects;
- D1;
- proveedores;
- última evidencia;
- degradaciones;
- disponibilidad;
- versión desplegada.

## Modelo de estados

Todos los módulos deben contemplar explícitamente, cuando aplique:

- carga;
- vacío;
- disponible;
- degradado;
- obsoleto;
- error;
- no autorizado;
- no elegible;
- inconsistente;
- pendiente;
- ambiguo;
- confirmado.

No se permite representar un estado desconocido como éxito.

## Roles

### Administration

Puede visualizar las capacidades que el backend autorice para su rol.

### Auditor

Debe permanecer en modo de observación y evidencia. No debe recibir controles de ejecución financiera.

### Visitante / sesión no autenticada

Debe recibir únicamente información pública y controles explícitamente permitidos.

## Design System

El sistema visual deberá definir:

- tokens de color;
- tipografía;
- espaciado;
- grid;
- radios;
- elevación;
- iconografía;
- densidad;
- componentes;
- tablas;
- formularios;
- filtros;
- navegación;
- alertas;
- diálogos;
- estados;
- feedback;
- skeletons;
- paginación;
- accesibilidad;
- responsive.

Los colores semánticos deben representar significado operacional y no depender exclusivamente del color.

## Reglas para datos de mercado

- BUY y SELL nunca se mezclan.
- Las monedas y mercados nunca se agregan entre sí.
- La UI no recalcula ni corrige silenciosamente datos financieros recibidos.
- La frescura debe ser visible.
- Los datos incompletos o inconsistentes deben mostrarse como tales.
- Los límites de presentación no deben confundirse con límites de adquisición del scanner.
- La UI debe distinguir cantidad visible de cantidad disponible en el snapshot.

## Migración técnica

La migración debe ser incremental:

1. definir contratos de presentación;
2. extraer modelos de vista;
3. separar navegación;
4. separar componentes;
5. separar estilos;
6. separar comportamiento del navegador;
7. introducir pruebas de representación;
8. migrar módulo por módulo;
9. retirar progresivamente el HTML monolítico;
10. verificar producción.

No se realizará un reemplazo ciego de toda la interfaz en una sola modificación.

## Criterios de calidad

La interfaz se evaluará respecto de:

- adecuación funcional;
- usabilidad;
- mantenibilidad;
- accesibilidad;
- seguridad;
- capacidad de respuesta;
- trazabilidad;
- consistencia visual;
- integridad de datos;
- comportamiento ante fallos.

Como referencias se consideran ISO 9241, ISO/IEC 25010, ISO/IEC 27001/27002, ISO/IEC/IEEE 29148, ISO/IEC/IEEE 12207, ISO 19011 y WCAG 2.2, según su aplicabilidad.

Estas referencias no implican certificación automática.

## Criterio de salida

La interfaz definitiva no se considerará lista por apariencia.

Debe existir evidencia de:

**requisitos → decisiones de diseño → componentes → implementación → pruebas → CI → despliegue → validación de producción → evidencia.**
