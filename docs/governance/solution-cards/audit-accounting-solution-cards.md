# Fichas de solución para auditoría y contabilidad con fundamento ISO

## Estado

**Solo etapa de diseño. Este documento no autoriza ninguna implementación en tiempo de ejecución.**

Este documento aplica la secuencia obligatoria de decisión establecida en el Issue #270:

**Hallazgo → evidencia objetiva → riesgo/impacto → requisito → criterio ISO aplicable → alternativas → solución seleccionada → por qué → para qué → impacto → pruebas → documentación → implementación → verificación → evidencia objetiva → certificación.**

Los requisitos cubiertos están definidos en los Issues #283, #284, #285 y #286. La línea base documental se propuso en el PR #288.

---

## 1. Ficha de solución: persistencia, integridad, conservación y acceso al registro de auditoría

### Problema / hallazgo

El sistema necesita una capacidad de Auditoría y Control de primer nivel. Los registros de aplicación y el estado operativo existentes no bastan para proporcionar un historial persistente, consultable, atribuible y conservado de acciones relevantes para la seguridad, la administración, la configuración, la identidad, la operación y las finanzas.

### Evidencia objetiva

La línea base de requisitos del Issue #283 exige expresamente registros de auditoría duraderos con actor, acción, objetivo, motivo, origen, estado anterior y posterior, resultado, identificadores de correlación, procedencia, clasificación y metadatos de conservación. También establece que los registros ordinarios de aplicación no satisfacen este requisito.

### Riesgo / impacto

Sin trazabilidad de auditoría controlada:

- las acciones podrían no atribuirse a un actor único;
- podría resultar imposible reconstruir las transiciones de estado;
- las investigaciones de seguridad podrían carecer de evidencia fiable;
- podrían pasar inadvertidas las alteraciones o eliminaciones no autorizadas;
- el acceso a la propia auditoría podría quedar sin registrar;
- no sería posible demostrar el cumplimiento de las obligaciones de conservación y preservación de evidencia.

### Requisitos afectados

- SYS-AUD-001..008
- SWR-AUD-001..003

### Criterios ISO aplicables

**ISO/IEC 27001:2022 e ISO/IEC 27002:2022**

El conjunto de controles pertinente incluye:

- **5.15 Control de acceso:** regula el acceso autorizado a la información y a los activos asociados.
- **5.18 Derechos de acceso:** regula la concesión, revisión, modificación y retirada de derechos de acceso.
- **5.33 Protección de registros:** resulta pertinente para proteger los registros contra pérdida, destrucción, falsificación, acceso no autorizado o divulgación.
- **8.15 Registro de eventos:** resulta pertinente para generar y gestionar registros de eventos.
- **8.16 Actividades de seguimiento:** resulta pertinente para supervisar sistemas y eventos.

ISO/IEC 27002:2022 proporciona orientación sobre controles para apoyar la implementación de los requisitos del sistema de gestión de seguridad de la información de ISO/IEC 27001.

**ISO/IEC 25010:2023**

El modelo de calidad del producto es aplicable a la especificación y evaluación de requisitos de software. Sus conceptos de calidad de seguridad incluyen propiedades como integridad, no repudio, responsabilidad y autenticidad, que respaldan directamente la necesidad de evidencia atribuible y resistente a manipulaciones.

**ISO 9001**

El marco de gestión de la calidad resulta pertinente para la información documentada controlada, la operación de procesos, el seguimiento, la medición y la evidencia de resultados. La orientación ISO relaciona la información documentada con los procesos controlados y la conservación de evidencia.

**ISO 19011:2026**

Es una norma de orientación para auditorías, no un control de seguridad del producto. Es pertinente para el modelo de evidencia porque la evidencia de auditoría debe ser relevante respecto de los criterios y verificable. La edición vigente indicada para este diseño es ISO 19011:2026; la edición de 2018 está retirada. La aplicabilidad debe confirmarse durante la revisión normativa correspondiente.

### Alternativas consideradas

**A. Usar únicamente los registros de aplicación**

Rechazada. Los registros sirven como telemetría operativa, pero por sí solos no proporcionan el ciclo de vida controlado de la evidencia, la auditoría de accesos, las reglas de conservación ni el modelo de transiciones de estado requeridos.

**B. Incrustar los registros de auditoría en cada tabla de negocio**

Rechazada como arquitectura principal. Duplica la lógica de auditoría, dificulta las consultas entre dominios y fomenta que el historial de negocio mutable se trate como evidencia.

**C. Crear un contexto delimitado de Auditoría y Control detrás de un puerto de aplicación**

Seleccionada para el diseño.

### Solución seleccionada

Diseñar una capacidad dedicada de Auditoría y Control con:

- un modelo de eventos de auditoría orientado a anexar registros;
- un puerto explícito de aplicación/dominio para registrar eventos;
- un adaptador de infraestructura para persistencia duradera;
- identidad inmutable del evento y marca temporal canónica;
- contexto del actor y de autenticación;
- identificadores de acción y objetivo;
- estado anterior y posterior cuando tenga sentido semántico;
- resultado y motivo de fallo o rechazo;
- identificadores de correlación, solicitud y operación;
- metadatos que no contengan secretos;
- metadatos de clasificación y conservación;
- evidencia de integridad y procedencia;
- consulta y exportación controladas por roles;
- registro auditable del propio acceso al historial de auditoría.

Los registros de auditoría no deben contener contraseñas, tokens de acceso, CVV, PIN ni datos sensibles innecesarios.

### ¿Por qué?

El sistema necesita evidencia atribuible, duradera y consultable de forma independiente, en lugar de telemetría meramente diagnóstica. Este límite arquitectónico también evita que cada capacidad de negocio invente un modelo de auditoría incompatible con los demás.

### ¿Para qué?

Para reconstruir y verificar acciones de usuarios, administrativas, operativas y financieras sin reescribir el historial de negocio.

### Impacto

- **Técnico:** incorpora puertos de auditoría, esquema, persistencia, indexación y API de consulta/exportación.
- **Funcional:** cada caso de uso sujeto a auditoría debe emitir un evento definido.
- **Seguridad:** refuerza el control de acceso, la responsabilidad y la integridad de la evidencia.
- **Operación:** requiere procedimientos de conservación, capacidad, revisión y preservación.
- **Rendimiento:** las escrituras de auditoría deben estar acotadas y no permitir metadatos ni cuerpos de solicitud ilimitados.

### Pruebas requeridas

- creación de eventos para cada operación clasificada como auditable;
- atribución del actor y contexto de rol;
- exactitud del estado anterior y posterior;
- propagación del identificador de correlación;
- registro de operaciones fallidas o rechazadas;
- registro de accesos a la auditoría;
- rechazo de consultas/exportaciones no autorizadas;
- detección de alteraciones;
- comportamiento de conservación y preservación;
- límites de tamaño de carga útil y metadatos;
- pruebas de secretos y minimización de datos;
- concurrencia y comportamiento frente a eventos duplicados;
- tratamiento de fallos cuando el almacén de auditoría no esté disponible.

### Documentación requerida

- catálogo de eventos de auditoría;
- política de clasificación y conservación;
- matriz de control de acceso;
- procedimiento de evidencia y exportación;
- política de capacidad y fallos del almacén de auditoría;
- documentación de esquema y migraciones;
- contrato de API;
- evidencia de pruebas;
- procedimiento de revisión operativa.

### Evidencia de verificación

Antes de alcanzar el estado **Verificado**, se requiere:

- evidencia de pruebas del repositorio;
- evidencia del esquema y las migraciones;
- verificación de seguridad;
- evidencia de CI;
- evidencia del entorno desplegado;
- registros representativos sin secretos;
- evidencia de control de acceso;
- evidencia de preservación e integridad.

### Puerta de certificación

No se puede certificar hasta que exista la cadena completa de evidencia y se satisfagan las condiciones de autorización de #270 y #186.

---

## 2. Ficha de solución: libro mayor contable y modelo de partida doble

### Problema / hallazgo

La capacidad Contable y Económica solicitada debe reconstruir el historial económico, saldos, ingresos/gastos, ganancias/pérdidas, operaciones de COMPRA/VENTA, transferencias, comisiones y correcciones. Una tabla mutable de transacciones es insuficiente cuando se necesita reproducir el estado económico histórico.

### Evidencia objetiva

El Issue #284 exige un libro mayor económico persistente que cubra las operaciones económicamente relevantes y requiere evaluar un modelo de partida doble/libro mayor general.

### Riesgo / impacto

Un diseño basado únicamente en transacciones puede permitir:

- movimientos económicos desequilibrados;
- dirección ambigua de activos o monedas;
- sobrescritura de valores históricos;
- saldos irreproducibles;
- cálculo incorrecto de ganancias y pérdidas;
- conciliación débil;
- correcciones sin control;
- imposibilidad de reproducir el cierre de un período.

### Requisitos afectados

- SYS-ACC-001..006
- SYS-ACC-010
- SYS-ACC-012
- SWR-ACC-001..002

### Criterios ISO aplicables

ISO/IEC 27001:2022 e ISO/IEC 27002:2022 son aplicables a la protección, el control de acceso, la integridad y la responsabilidad respecto de la información del libro mayor, pero **no definen reglas contables ni un plan de cuentas**. ISO/IEC 27002 proporciona controles y orientación de seguridad, no normas contables.

ISO/IEC 25010:2023 respalda la evaluación de integridad, responsabilidad, autenticidad y propiedades relacionadas de calidad del software que implemente el libro mayor.

ISO 9001 respalda la operación de procesos controlados, la información documentada, el seguimiento y la evidencia de resultados.

El modelo contable efectivo seguirá sujeto al marco contable aplicable que se identifique en el Issue #286.

### Alternativas consideradas

**A. Historial mutable de transacciones**

Rechazado. No ofrece una base suficientemente sólida para reproducir el historial contable.

**B. Diario inmutable de transacciones económicas con saldos derivados**

Parcialmente aceptable, pero insuficiente por sí solo cuando deben permanecer equilibradas varias cuentas o clases de activos.

**C. Libro mayor general de partida doble más procedencia inmutable de las transacciones económicas**

Seleccionado para evaluación de diseño y planificación de implementación, sujeto al marco contable que determine #286.

### Solución seleccionada

Diseñar un contexto delimitado Contable y Económico que incluya:

- procedencia inmutable de transacciones económicas;
- abstracción del plan de cuentas adecuada al marco contable elegido;
- asientos contables equilibrados;
- semántica explícita de débito/crédito cuando corresponda la partida doble;
- dimensiones de activo y moneda;
- identificadores de transacción y asiento;
- referencias de origen/proveedor;
- referencias de ofertas, órdenes y pagos;
- componentes de comisiones y costes;
- período contable;
- ciclo de vida del estado;
- identificadores de correlación e idempotencia;
- cálculo controlado de saldos y estados financieros.

Una operación de negocio puede generar tanto un evento de auditoría como asientos contables, pero esos registros deben permanecer diferenciados.

### ¿Por qué?

Porque el historial económico debe poder reproducirse y ser matemáticamente coherente, no limitarse a describir operaciones.

### ¿Para qué?

Para producir saldos, estados, ganancias/pérdidas y cierres de período a partir de un historial económico controlado.

### Impacto

- **Técnico:** añade el modelo de dominio del libro mayor, el modelo de cuentas, validación de asientos, persistencia y proyecciones de informes.
- **Funcional:** los flujos de compra, venta, transferencia, comisión, ingreso, gasto, ganancia/pérdida y corrección deben definir sus efectos económicos.
- **Financiero:** los asientos incorrectos pueden distorsionar materialmente los saldos y las ganancias/pérdidas.
- **Seguridad:** los privilegios para modificar el libro mayor o realizar ajustes requieren autorización estricta y trazabilidad de auditoría.

### Pruebas requeridas

- invariante de equilibrio de asientos;
- exactitud de activos y monedas;
- dirección correcta de compra/venta;
- tratamiento de comisiones;
- cálculo de ganancias/pérdidas;
- idempotencia;
- prevención de eventos duplicados;
- ciclo de vida fallido, pendiente o rechazado;
- comportamiento de reversión/corrección;
- cálculo derivado de saldos;
- reproducibilidad de estados;
- comportamiento en límites de período;
- concurrencia;
- conciliación con referencias externas.

### Documentación requerida

- glosario del dominio contable;
- decisión sobre el plan de cuentas;
- modelo de asientos;
- catálogo de eventos económicos;
- correspondencia con políticas contables;
- especificación de cálculo de saldos y ganancias/pérdidas;
- reglas de conciliación;
- procedimiento de cierre de período.

### Evidencia de verificación

La evidencia requerida incluye pruebas deterministas del libro mayor, recálculo independiente de períodos representativos, evidencia de migraciones, datos de muestra seguros para producción, evidencia de conciliación y trazabilidad desde la operación económica hasta los asientos y eventos de auditoría.

### Puerta de certificación

Bloqueada hasta que #286 identifique el marco contable aplicable y todos los requisitos contables se relacionen con fuentes autorizadas.

---

## 3. Ficha de solución: cierre de períodos, historial inmutable y correcciones controladas

### Problema / hallazgo

Los informes contables dejan de ser fiables si los períodos cerrados pueden modificarse directamente o si se sobrescriben transacciones históricas.

### Evidencia objetiva

SYS-ACC-007, SYS-ACC-008 y SYS-ACC-012 requieren cierre controlado, períodos cerrados inmutables, ajustes/reversiones e informes reproducibles.

### Riesgo / impacto

La modificación histórica sin control puede causar:

- estados financieros incoherentes;
- cierres que no pueden reproducirse;
- cambios de saldo sin explicación;
- pérdida de evidencia;
- divergencias de conciliación.

### Criterios ISO aplicables

Los controles de ISO/IEC 27002:2022 sobre registros, derechos de acceso y registro de eventos son pertinentes para proteger la información de períodos cerrados y controlar cambios privilegiados.

Los principios de ISO 9001 sobre información documentada y control de procesos respaldan procedimientos controlados y conservación de evidencia de resultados.

La definición efectiva de un cierre legal o contable sigue sujeta al Issue #286.

### Alternativas consideradas

**A. Permitir editar registros cerrados**

Rechazada.

**B. Eliminar y recrear las transacciones corregidas**

Rechazada como mecanismo ordinario porque destruye la procedencia histórica.

**C. Cierre inmutable con asientos controlados de ajuste/reversión**

Seleccionada.

### Solución seleccionada

Implementar el ciclo de vida del período:

**Abierto → En cierre → Conciliado → Cerrado**

Los períodos cerrados rechazan las modificaciones ordinarias. Las correcciones crean nuevos asientos controlados vinculados al asiento original y al motivo y autoridad de la corrección.

### ¿Por qué?

Para preservar un historial reproducible.

### ¿Para qué?

Para garantizar que un informe generado después del cierre pueda reconstruirse a partir de la misma evidencia subyacente.

### Pruebas requeridas

- precondiciones de cierre;
- puerta de conciliación;
- rechazo de modificaciones después del cierre;
- ajuste autorizado;
- vínculo con el asiento revertido;
- política de reapertura, si está permitida legalmente;
- reproducibilidad antes y después de generar informes;
- protección frente a cierres concurrentes.

### Documentación requerida

- lista de comprobación del cierre;
- matriz de autorizaciones;
- política de ajustes/reversiones;
- política de reapertura;
- definición del paquete de evidencia.

### Puerta de certificación

No certificar hasta que se establezcan el marco contable y los requisitos legales de conservación conforme a #286.

---

## 4. Ficha de solución: conciliación e informes reproducibles

### Problema / hallazgo

Los registros económicos internos deben compararse con QvaPay, bancos, comprobantes de pago y otras fuentes externas sin sobrescribir el historial interno.

### Evidencia objetiva

SYS-ACC-004, SYS-ACC-009 y SYS-ACC-012 requieren procedencia externa, conciliación e informes reproducibles.

### Criterios ISO aplicables

ISO/IEC 27002:2022 resulta aplicable a la protección de evidencia externa y al control de acceso a los datos de conciliación. ISO 9001 respalda los procesos supervisados, la información documentada y la evaluación basada en evidencia.

ISO 19011:2026 es pertinente como orientación de auditoría para evidencia verificable y evaluación estructurada, no como regla contable.

### Alternativas consideradas

**A. Sobrescribir los registros internos con el estado del proveedor**

Rechazada.

**B. Conciliar manualmente sin conservar evidencia persistente**

Rechazada.

**C. Conservar el historial interno del libro mayor y la evidencia externa, con registros explícitos de conciliación**

Seleccionada.

### Solución seleccionada

Crear un contexto delimitado de Conciliación e Informes que almacene:

- identidad de la ejecución de conciliación;
- origen y marca temporal del origen;
- referencia interna;
- referencia externa/del proveedor;
- valor esperado;
- valor observado;
- diferencia;
- clasificación;
- estado de resolución;
- actor que resuelve;
- evidencia de resolución;
- vínculo con el informe o cierre.

La conciliación puede identificar diferencias, pero no debe reescribir silenciosamente el libro mayor.

### ¿Por qué?

Porque la conciliación es un proceso de comparación, no un reemplazo de la verdad histórica.

### ¿Para qué?

Para detectar, clasificar, resolver y evidenciar diferencias económicas.

### Pruebas requeridas

- coincidencia exacta;
- discrepancia de importe;
- registro interno ausente;
- registro externo ausente;
- referencia externa duplicada;
- estado retrasado del proveedor;
- reintentos e idempotencia;
- autorización de resolución;
- reproducibilidad de informes.

---

## 5. Ficha de solución: instrumentos de pago y minimización de datos sensibles

### Problema / hallazgo

Los requisitos contables incluyen referencias a tarjetas bancarias o métodos de pago, pero almacenar credenciales completas de pago crearía una exposición innecesaria de seguridad y privacidad.

### Evidencia objetiva

SYS-AUD-008 y SYS-ACC-011 prohíben expresamente almacenar el PAN completo, CVV, PIN y secretos de autenticación únicamente con fines contables.

### Criterios ISO aplicables

ISO/IEC 27002:2022 proporciona controles de seguridad para el control de acceso, la clasificación de información, la protección de registros y el tratamiento de información relacionada con privacidad y seguridad.

ISO/IEC 27001:2022 establece los requisitos del sistema de gestión de seguridad de la información en cuyo marco se gestionan los riesgos aplicables.

ISO/IEC 25010:2023 respalda la evaluación de confidencialidad, integridad y responsabilidad como propiedades de calidad del producto.

### Alternativas consideradas

**A. Almacenar credenciales completas de pago**

Rechazada.

**B. Almacenar solo un identificador de referencia del proveedor y metadatos enmascarados**

Seleccionada.

**C. Almacenar credenciales completas cifradas en la aplicación**

Rechazada, salvo que se establezca un alcance de procesamiento de tarjetas separado y justificado desde el punto de vista legal y técnico.

### Solución seleccionada

Persistir solo la información mínima necesaria para contabilidad y conciliación, por ejemplo:

- tipo de método de pago;
- identificador de referencia/proveedor;
- identificador enmascarado;
- últimos cuatro dígitos solo cuando esté justificado;
- metadatos bancarios/de referencia necesarios para conciliar;
- marcas temporales y referencias de transacción.

Los secretos de autenticación y los códigos de seguridad de tarjetas deben permanecer fuera del dominio contable.

### ¿Por qué?

Para reducir la superficie de ataque y evitar que el sistema contable se convierta en un repositorio innecesario de credenciales.

### ¿Para qué?

Para conservar la trazabilidad contable sin retener secretos sensibles de pago.

### Pruebas requeridas

- análisis de secretos;
- minimización de respuestas de API;
- lista permitida de campos de base de datos;
- pruebas de autorización;
- eliminación de datos sensibles en exportaciones;
- eliminación de datos sensibles en registros y auditoría;
- pruebas negativas para impedir la persistencia de PAN, CVV, PIN o tokens.

---

## 6. Ficha de solución: aplicabilidad contable y regulatoria

### Problema / hallazgo

Las normas ISO pueden regir seguridad, calidad, ciclo de vida y auditabilidad, pero no establecen las reglas contables, el tratamiento fiscal ni las obligaciones legales de información de este sistema.

### Evidencia objetiva

El Issue #286 exige identificar la jurisdicción, el marco contable, los requisitos fiscales, las regulaciones financieras/de pago, la conservación, la privacidad y el tratamiento de activos digitales, monedas estables y moneda fiduciaria antes de certificar la contabilidad.

### Criterios ISO aplicables

ISO 9001 respalda la determinación del contexto de la organización, los requisitos pertinentes, los procesos controlados y la evaluación del desempeño, pero no sustituye la legislación contable o fiscal.

ISO/IEC 27001 e ISO/IEC 27002 respaldan los requisitos de riesgo y control de seguridad de la información, pero no son normas contables.

### Solución seleccionada

Crear una matriz de aplicabilidad regulatoria:

**requisito legal/contable → fuente autorizada → jurisdicción → requisito del sistema → control → implementación → prueba → evidencia → estado de certificación**

La matriz debe identificar, como mínimo:

- jurisdicción o jurisdicciones;
- entidad legal y modelo operativo;
- marco contable;
- tratamiento fiscal;
- obligaciones financieras y de pago;
- tratamiento de activos digitales, monedas estables y moneda fiduciaria;
- requisitos de conservación de registros;
- obligaciones de privacidad y protección de datos;
- obligaciones de información;
- requisitos de auditoría.

### ¿Por qué?

Porque la corrección del software no puede demostrar por sí sola la conformidad contable legal.

### ¿Para qué?

Para impedir la certificación de resultados contables contra un marco legal o contable incorrecto.

### Puerta de certificación

**Bloqueada.** Ningún informe contable debe marcarse como Certificado hasta resolver #286 mediante un marco autorizado y los requisitos aplicables.

---

## 7. Ficha de solución: arquitectura para auditoría, contabilidad y conciliación

### Problema / hallazgo

La evidencia de auditoría, el historial económico y la conciliación tienen propósitos diferentes y no deben convertirse en una única estructura de datos mutable.

### Evidencia objetiva

El Issue #285 establece tres contextos delimitados:

1. Auditoría y Control.
2. Contabilidad y Economía.
3. Conciliación e Informes.

### Criterios ISO aplicables

ISO/IEC 25010:2023 es pertinente para la calidad de la arquitectura mediante características utilizadas en la especificación y evaluación del software, incluidas la integridad, la responsabilidad y propiedades relacionadas con la mantenibilidad.

ISO/IEC 27002:2022 respalda el control de acceso, la segregación y la protección de activos de información.

ISO 9001 respalda los procesos controlados, las interfaces definidas, la información documentada y la medición.

### Alternativas consideradas

**A. Una tabla compartida de transacciones y auditoría**

Rechazada.

**B. Tablas separadas sin límites de dominio**

Rechazada por ofrecer una gobernanza arquitectónica insuficiente.

**C. Contextos delimitados separados con puertos explícitos y trazabilidad**

Seleccionada.

### Arquitectura objetivo seleccionada

```text
QvaPay-AI
├── Autenticación y autorización
├── Cuenta
├── Mercado
├── Escáner
├── Arbitraje
├── Administración
├── Auditoría y Control
├── Contabilidad y Economía
└── Conciliación e Informes
```

Se permite la correlación entre contextos, pero la propiedad de los datos debe seguir siendo explícita.

Una operación de VENTA, por ejemplo, puede generar:

- uno o más eventos de auditoría;
- uno o más asientos contables;
- uno o más registros de conciliación posteriormente.

Ninguno de esos registros sustituye a los demás.

### ¿Por qué?

Para evitar el acoplamiento entre la evidencia de seguridad, la verdad económica y el estado de comparación con fuentes externas.

### ¿Para qué?

Para proporcionar una arquitectura controlada que pueda evolucionar sin corromper la evidencia histórica.

### Pruebas requeridas

- comprobaciones de dependencias entre dominios;
- comprobaciones de límites entre puertos y adaptadores;
- ausencia de dependencias de Cloudflare, D1 o navegador en el dominio;
- ausencia de dependencias directas de infraestructura desde las reglas del dominio de aplicación;
- correlación entre contextos;
- aislamiento de fallos;
- compatibilidad de migraciones.

---

## 8. Decisión consolidada

La dirección de diseño seleccionada es:

- **Capacidad dedicada de Auditoría y Control** para evidencia operativa y de seguridad.
- **Capacidad Contable y Económica preparada para partida doble** para representar la realidad económica, sujeta al marco contable aplicable.
- **Capacidad dedicada de Conciliación e Informes** para comparar con evidencia externa.
- **Registros históricos inmutables con ajustes y reversiones controlados.**
- **Minimización estricta de datos sensibles.**
- **Correlación explícita entre contextos sin fusionar sus modelos de datos.**
- **Certificación contable bloqueada hasta establecer la jurisdicción y el marco contable.**

Estas decisiones son exclusivamente de diseño. No autorizan una implementación en tiempo de ejecución.

## 9. Puerta de autorización e implementación

Antes de comenzar la implementación, deben cumplirse todas las condiciones siguientes:

1. El PR #288 debe haber establecido la línea base de requisitos.
2. Estas fichas de solución deben revisarse frente al Issue #270.
3. Los criterios ISO aplicables deben aceptarse como correspondencias sustantivas.
4. El Issue #286 debe identificar la autoridad contable/regulatoria.
5. Deben crearse Issues y PR de implementación a partir de las fichas aprobadas.
6. Cada PR de implementación debe enlazar la ficha aplicable y los identificadores de requisitos.
7. Las pruebas y la evidencia objetiva deben definirse antes de fusionar código.
8. La verificación y la certificación deben mantenerse separadas de la implementación.

## 10. Regla de certificación

Una capacidad puede avanzar por los estados:

**Definido → Diseñado → Implementado → Probado → Verificado → Certificado**

Una ejecución correcta de CI, un despliegue o una demostración funcional no equivalen a certificación.

Solo una cadena completa de evidencia puede incorporarse a la Línea Base Funcional Certificada.

## 11. Matriz de aplicabilidad ISO

Las correspondencias siguientes son específicas de cada control o criterio y deben tratarse como restricciones de diseño, no como declaraciones genéricas de certificación:

| Capacidad | Alcance de requisitos | Referencia ISO | Aplicación |
|---|---|---|---|
| Auditoría y Control | SYS-AUD-001..008 | ISO/IEC 27002:2022 5.33, 8.15, 8.16 | Proteger registros, generar y gestionar registros de eventos y supervisar eventos pertinentes. |
| Acceso a auditoría | SYS-AUD-005..006 | ISO/IEC 27002:2022 5.15, 5.18 | Restringir y gobernar los derechos de acceso a la información de auditoría, incluido el registro de accesos a la propia auditoría. |
| Evidencia de auditoría | SYS-AUD-007 | Enfoque basado en evidencia de ISO 19011:2026 | Definir evidencia pertinente, verificable y conservada para auditoría; es orientación de auditoría, no un control del sistema de gestión de seguridad de la información. |
| Calidad de seguridad del software | SYS-AUD-001..008 | Modelo de calidad de seguridad de ISO/IEC 25010:2023 | Evaluar integridad, responsabilidad, autenticidad y propiedades relacionadas de calidad de seguridad. |
| Procesos controlados | SYS-AUD / SYS-ACC / SYS-COMP-ACC | ISO 9001:2015 7.5, 8, 9 | Controlar la información documentada, las operaciones y la evidencia de desempeño cuando corresponda al alcance del sistema de gestión de calidad. |
| Protección de datos contables | SYS-ACC-001..012 | ISO/IEC 27002:2022 5.33, 5.15, 5.18, 8.15 | Proteger los registros del libro mayor y restringir el acceso privilegiado y los cambios. |
| Calidad del software contable | SYS-ACC-001..012 | ISO/IEC 25010:2023 | Evaluar la integridad, autenticidad, responsabilidad y mantenibilidad de la implementación. |
| Evidencia de conciliación | SYS-ACC-004, 009, 012 | Enfoque basado en evidencia de ISO 19011:2026 | Estructurar la evidencia y los registros de evaluación; no define reglas contables. |

Estas referencias no establecen conformidad contable, fiscal ni de información legal. Esas obligaciones siguen sujetas al marco autorizado que se determine en #286/#294.

## 12. Criterios objetivos de aceptación por estado del ciclo de vida

### Definido

El requisito, el riesgo, la evidencia y la trazabilidad existen en el repositorio. No se permite declarar que hay una implementación.

### Diseñado

Una ficha de solución aprobada identifica el diseño seleccionado, su justificación, las alternativas, los criterios aplicables, los impactos, las pruebas y la evidencia. No se permite declarar una implementación en tiempo de ejecución.

### Implementado

El diseño aprobado existe en código, configuración o migraciones y tiene trazabilidad al requisito y a la ficha de solución. La implementación por sí sola no demuestra corrección ni certificación.

### Probado

Las pruebas automatizadas y manuales requeridas se ejecutan contra el alcance implementado y se conservan resultados que muestran el comportamiento esperado y las rutas negativas. El éxito de las pruebas por sí solo no equivale a verificación en producción.

### Verificado

La implementación, las pruebas, la documentación, la evidencia de CI y seguridad, la evidencia de migración y la evidencia del entorno desplegado son coherentes entre sí y pueden revisarse de forma independiente para el alcance declarado. La documentación contradictoria o la falta de evidencia de producción impide declarar el estado Verificado.

### Certificado

La verificación está completa; se han satisfecho las autorizaciones de gobernanza y cambio requeridas; se han resuelto los requisitos legales y contables aplicables; existe evidencia objetiva de producción; la trazabilidad está completa; y una decisión de certificación ha sido registrada por una autoridad autorizada. La certificación nunca se deduce únicamente de CI, del despliegue o de una demostración.

## 13. Prohibición de implementación hasta cerrar las puertas de control

Ningún Issue o PR de implementación derivado de estas fichas puede considerarse autorizado para Contabilidad y Economía hasta que #286/#294 resuelva la jurisdicción y la autoridad contable aplicables. La implementación de Auditoría y Control también permanece sujeta al Issue #270 y a los controles de autorización de cambios del proyecto. Crear un Issue para planificar no equivale a autorizar la implementación.
