# Requisitos iniciales de calidad

## SYS-QR-001 — Disponibilidad del scanner

El servicio de escaneo deberá operar independientemente de la presencia de usuarios conectados, de acuerdo con SYS-FR-002.

## SYS-QR-002 — Configurabilidad

El intervalo de escaneo deberá poder configurarse mediante una interfaz controlada y validarse antes de aplicarse.

## SYS-QR-003 — Integridad de clasificación

El sistema no deberá mezclar ofertas BUY y SELL ni mercados diferentes durante procesamiento o presentación.

## SYS-QR-004 — Trazabilidad temporal

Cada snapshot deberá conservar información temporal suficiente para determinar cuándo fue obtenido.

## SYS-QR-005 — Resiliencia ante proveedor

Un error temporal de QvaPay no deberá eliminar ni invalidar el último snapshot válido.

## SYS-QR-006 — Validación de datos externos

Las respuestas externas deberán validarse antes de entrar al dominio.

## SYS-QR-007 — Testabilidad

Las reglas de dominio deberán poder probarse sin depender de servicios externos.

## Estado

Definidos como requisitos iniciales. Los objetivos cuantitativos de disponibilidad, latencia, recuperación y retención quedan TBD.

## Requisitos adicionales de ingestión

### SYS-QR-008 — Idempotencia de eventos

La ingestión deberá tolerar entregas duplicadas sin duplicar ni corromper el estado de una oferta.

### SYS-QR-009 — Recuperación de divergencias

El sistema deberá disponer de reconciliación mediante `GET /p2p` para recuperar divergencias producidas por pérdida de eventos, desconexiones o errores temporales.

### SYS-QR-010 — Seguridad del feed

Las credenciales de aplicación y el secreto del feed deberán permanecer server-side. Los webhooks deberán validar autenticidad antes de procesar el contenido.

### Aclaración de SYS-QR-002

El intervalo configurable se considera inicialmente la **frecuencia de reconciliación**, no necesariamente la frecuencia primaria de detección de cambios, porque la ingestión puede ser event-driven.
