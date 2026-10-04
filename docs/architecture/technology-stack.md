# Technology Stack

## Estado

Selección tecnológica inicial propuesta. No constituye un requisito funcional.

| Capa | Tecnología propuesta | Justificación |
|---|---|---|
| Language | TypeScript | Tipado estático y coherencia |
| Web UI | React | Interfaz dinámica |
| Runtime | Cloudflare Workers | Ejecución server-side |
| Scheduler | Durable Objects + Alarms | Ciclo continuo del scanner |
| Database | Cloudflare D1 | Persistencia SQL gestionada |
| HTTP framework | Hono | API ligera para Workers |
| Tests | Vitest | Unitarias e integración |
| Quality | ESLint + Prettier + TypeScript | Calidad y consistencia |
| CI/CD | GitHub Actions | Validación automatizada |

## Condición para QvaPay

No se cerrará la tecnología de integración hasta validar endpoint, autenticación, esquema, paginación, límites de frecuencia, errores, disponibilidad y semántica de BUY/SELL de la API oficial.

## Tecnologías no adoptadas inicialmente

No se propone microservicios, Kubernetes, message broker externo ni polling desde el navegador como mecanismo principal.