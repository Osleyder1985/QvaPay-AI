# Arquitectura de información de la interfaz

## Propósito

Definir la arquitectura funcional de la interfaz objetivo antes de implementar componentes visuales. Este documento traduce el inventario de pantallas en una estructura navegable y gobernada.

No autoriza ejecución financiera.

## Principios

1. La navegación debe reflejar capacidades de negocio, no la estructura interna del Worker.
2. Las superficies de lectura, análisis y ejecución deben permanecer diferenciadas.
3. Los datos financieros deben conservar su precisión y contexto.
4. El usuario debe conocer siempre moneda, mercado, lado, estado, frescura y origen del dato.
5. Las capacidades no autorizadas deben representarse como no disponibles, no como acciones parcialmente ejecutables.
6. El estado del sistema debe distinguirse del estado de una operación.
7. La interfaz no controla la ejecución del scanner server-side.

## Estructura principal

### 1. Inicio

Objetivo: ofrecer una visión ejecutiva de salud y actividad.

Debe mostrar:

- estado global del sistema;
- estado de la integración QvaPay;
- frescura del Market Feed;
- estado del scanner;
- próximo ciclo;
- última ejecución;
- errores activos;
- resumen de liquidez;
- oportunidades observadas sin convertirlas en órdenes;
- alertas de integridad.

No debe ejecutar acciones financieras.

### 2. Cuenta QvaPay

Subsecciones:

- Identidad;
- Aplicación;
- Balance;
- Capacidades P2P;
- Estado de integración;
- Correlación usuario-aplicación;
- Evidencia de sincronización;
- Ofertas propias.

La interfaz debe diferenciar claramente:

**identidad observada → aplicación autorizada → correlación → estado de integración → datos financieros.**

No debe mostrar una integración como verificada si la correlación de propietario no está validada.

### 3. Market Feed

Debe ser una superficie especializada de observación.

Filtros mínimos:

- moneda;
- mercado;
- lado BUY/SELL;
- estado;
- VIP;
- tasa;
- cantidad disponible;
- frescura.

Funciones:

- búsqueda;
- ordenamiento;
- profundidad;
- mejor BUY;
- mejor SELL;
- spread;
- liquidez;
- timestamp de observación;
- indicador de snapshot;
- detección de mercado cruzado;
- advertencia de snapshot incompleto.

Regla fundamental:

**Nunca mezclar monedas, mercados o lados dentro de una misma vista semántica.**

### 4. Arbitrage Workbench

Debe ser una superficie de análisis independiente del Market Feed.

Para cada oportunidad debe conservar:

- moneda;
- mercado;
- lado de entrada;
- lado de salida;
- oferta origen;
- oferta destino;
- capital requerido;
- cantidad;
- tasa de entrada;
- tasa de salida;
- margen;
- beneficio estimado;
- límites de orden;
- disponibilidad;
- elegibilidad;
- frescura;
- evidencia de mercado;
- riesgos;
- motivo de no elegibilidad.

La interfaz puede calcular y presentar escenarios, pero no debe convertir automáticamente un escenario en una operación.

### 5. Scanner / Monitor

Debe representar exclusivamente el proceso server-side.

Debe mostrar:

- estado persistente;
- run ID/correlación cuando exista en el contrato;
- inicio;
- finalización;
- duración;
- resultado;
- error;
- próximo ciclo;
- intervalo configurado;
- frescura;
- snapshot publicado;
- historial de ejecuciones.

La actualización de la pantalla es observacional.

Cerrar el navegador no debe detener ni duplicar el scanner.

### 6. Operations Center

Debe estar separado del Market Feed y del análisis.

Cada operación futura debe tener como mínimo:

- operation ID;
- correlation ID;
- actor;
- capacidad utilizada;
- oferta objetivo;
- moneda;
- mercado;
- lado;
- cantidad;
- estado;
- resultado;
- timestamp;
- evidencia;
- reconciliación.

Estados financieros relevantes:

- pendiente;
- enviada;
- confirmada;
- rechazada;
- ambigua;
- reconciliación pendiente;
- reconciliada.

Una operación ambigua nunca debe presentarse como fallida si existe posibilidad de ejecución remota.

### 7. Audit & Evidence

Debe permitir consultar evidencia sin inventarla.

Dimensiones:

- requisito;
- operación;
- ejecución del scanner;
- usuario;
- evento;
- timestamp;
- correlación;
- resultado;
- evidencia técnica;
- evidencia de producción;
- estado de certificación.

La auditoría histórica no debe construirse a partir de un único snapshot actual.

### 8. Security Center

Debe agrupar:

- usuario actual;
- rol;
- capacidades;
- sesión;
- expiración;
- cambios de contraseña;
- estado de integración;
- credenciales configuradas sin exponer secretos;
- eventos de seguridad;
- controles de acceso;
- restricciones de operaciones.

Nunca debe mostrar secretos, tokens ni material criptográfico.

### 9. Administration

Sólo para capacidades administrativas.

Debe contener:

- usuarios;
- roles;
- estado activo/inactivo;
- creación;
- activación/desactivación;
- cambio administrativo de contraseña;
- evidencia de auditoría.

Las capacidades deben depender del rol real y de la autorización server-side.

### 10. Configuration

Debe centralizar configuración gobernada:

- moneda configurada;
- intervalo del scanner;
- límites;
- capacidades;
- parámetros de Market Feed;
- políticas aplicables.

Cada cambio debe mostrar:

- valor anterior;
- valor nuevo;
- actor;
- timestamp;
- motivo;
- evidencia;
- resultado.

## Modelo de navegación

La navegación objetivo:

**Inicio**
→ **Cuenta QvaPay**
→ **Market Feed**
→ **Arbitrage Workbench**
→ **Scanner / Monitor**
→ **Operations Center**
→ **Audit & Evidence**
→ **Security Center**
→ **Administration**
→ **Configuration**

Los módulos no deben convertirse en una página única con subsecciones infinitas.

## Modelo de estados

Todos los módulos deben implementar una taxonomía coherente:

- Cargando;
- Disponible;
- Vacío;
- Datos antiguos;
- Datos incompletos;
- Integridad comprometida;
- Error recuperable;
- Error permanente;
- Sin autorización;
- Capacidad no disponible;
- Pendiente;
- Confirmado;
- Rechazado;
- Ambiguo;
- Reconciliación pendiente.

Los estados deben tener texto accesible además de color, iconografía o animación.

## Responsive

La arquitectura debe conservar la jerarquía funcional en:

- escritorio;
- portátil;
- tablet;
- móvil.

Las tablas financieras no deben resolverse simplemente ocultando columnas críticas. Deben proporcionar una representación alternativa que conserve contexto, precisión y acciones autorizadas.

## Accesibilidad

La implementación deberá considerar WCAG 2.2 como referencia de accesibilidad.

Requisitos mínimos de arquitectura:

- navegación por teclado;
- foco visible;
- semántica HTML;
- nombres accesibles;
- mensajes de error asociados a controles;
- no depender sólo del color;
- reducción de movimiento;
- contraste adecuado;
- lectura coherente de tablas;
- estados anunciables.

## Trazabilidad

Cada módulo deberá mantener:

**Módulo → capacidad → requisito → API/contrato → componente → estado → prueba → evidencia.**

## Criterios de salida

Esta arquitectura queda en estado:

**DESIGNED — arquitectura de información definida.**

No constituye certificación UX ni autoriza implementación financiera.

La siguiente fase debe definir el Design System y los contratos de componentes antes de migrar el runtime monolítico.
