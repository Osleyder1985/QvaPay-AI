# ADR-002: Server-Side Continuous Scanner

## Estado

Accepted as initial baseline.

## Contexto

SYS-FR-002 exige que el scanner opere 24/7 independientemente de la conexión de usuarios.

## Decisión

El ciclo de escaneo se ejecutará server-side mediante Cloudflare Workers y un Durable Object con Alarm. El frontend consultará el estado y configurará el scanner mediante la API.

## Consecuencias

- cerrar el navegador no detiene el scanner;
- el intervalo se gestiona centralmente;
- el estado del proceso puede coordinarse;
- se necesita idempotencia y recuperación ante fallos.

## Riesgos pendientes

Validar disponibilidad, semántica y límites de las alarmas en el entorno de producción.