# Requisitos de integración — QvaPay P2P

## SYS-INT-001 — Consulta del mercado P2P

El sistema deberá consultar el mercado P2P de QvaPay mediante `GET /p2p` sobre la URL base oficial de la API.

**Criterio de aceptación:** una prueba de contrato demuestra que el adaptador construye correctamente la solicitud y procesa una respuesta válida.

## SYS-INT-002 — Separación por tipo de oferta y mercado

El sistema deberá consultar y procesar de forma independiente `type=buy|sell` y `coin`.

**Criterio de aceptación:** una prueba demuestra que ofertas BUY y SELL, o de monedas/mercados diferentes, nunca terminan en el mismo libro lógico.

## SYS-INT-003 — Paginación

El sistema deberá procesar la paginación del endpoint P2P hasta obtener el conjunto completo correspondiente a la consulta.

**Criterio de aceptación:** una respuesta de varias páginas produce un snapshot completo sin duplicar ofertas.

## SYS-INT-004 — Autenticación de servidor

Las credenciales utilizadas para acceder al mercado deberán mantenerse exclusivamente en el entorno de servidor.

**Criterio de aceptación:** ningún bundle, respuesta HTTP pública ni configuración del navegador contiene `app-secret` o credenciales equivalentes.

## SYS-INT-005 — Validación del contrato externo

El sistema deberá validar la estructura de las respuestas de QvaPay antes de introducir sus datos en el dominio.

**Criterio de aceptación:** una respuesta con campos obligatorios ausentes, tipos incompatibles o valores inválidos se rechaza de forma segura.

## SYS-INT-006 — Rate limiting

El sistema deberá tratar `429 Too Many Requests` mediante backoff y política de reintento controlada.

**Criterio de aceptación:** una secuencia de `429` no genera un bucle de solicitudes sin límite y el siguiente intento respeta la política de espera.

## SYS-INT-007 — Errores de proveedor

El sistema deberá distinguir errores de validación, autenticación, rate limiting y fallos transitorios del proveedor.

**Criterio de aceptación:** cada categoría produce un estado operacional y una estrategia de reintento definida.

## SYS-INT-008 — Preservación de precisión decimal

El sistema deberá preservar de forma segura los valores decimales recibidos como strings por QvaPay.

**Criterio de aceptación:** pruebas con valores decimales representativos no presentan errores de redondeo derivados de conversiones binarias inapropiadas.

## SYS-INT-009 — Solo lectura inicial

La integración del escáner inicial no deberá crear, editar, cancelar, aplicar ni completar ofertas P2P.

**Criterio de aceptación:** el adaptador de mercado inicial solo expone operaciones de lectura necesarias para construir snapshots.

## SYS-INT-010 — Frescura de observación

El sistema deberá registrar el instante en que cada snapshot fue observado independientemente de `created_at` y `updated_at` proporcionados por QvaPay.

**Criterio de aceptación:** cada snapshot persistido contiene una marca temporal de observación generada por QvaPay-AI.

## SYS-INT-011 — Compatibilidad con caché del proveedor

El sistema no deberá asumir que aumentar indefinidamente la frecuencia de polling produce datos más frescos.

**Criterio de aceptación:** la configuración y documentación del monitor reflejan que la respuesta pública puede proceder de caché.

## SYS-INT-012 — Evolución segura del contrato

El adaptador deberá fallar de forma controlada cuando QvaPay introduzca cambios incompatibles en campos obligatorios o semántica crítica.

**Criterio de aceptación:** una respuesta incompatible no se convierte silenciosamente en datos de mercado aparentemente válidos.
