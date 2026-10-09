# Pila tecnológica

## Estado actual

| Capa                 | Tecnología                             | Estado          |
| -------------------- | -------------------------------------- | --------------- |
| Lenguaje             | TypeScript                             | Implementado    |
| Runtime              | Cloudflare Workers                     | Implementado    |
| Scheduler            | Durable Objects + Alarms               | Implementado    |
| HTTP                 | Fetch API del Worker                   | Implementado    |
| UI                   | HTML/CSS/JavaScript servido por Worker | Implementado    |
| Proveedor            | QvaPay P2P API                         | Implementado    |
| Pruebas              | Vitest                                 | Implementado    |
| Calidad              | ESLint + Prettier + TypeScript         | Implementado    |
| CI/CD                | GitHub Actions                         | Implementado    |
| Persistencia actual  | Durable Object SQLite storage          | Implementado    |
| Base de datos futura | Cloudflare D1                          | No implementado |
| Webhook futuro       | QvaPay P2P webhook                     | No implementado |
| Stream futuro        | SSE                                    | No implementado |

## Decisión

No se debe describir React, Hono, D1 ni microservicios como tecnologías utilizadas actualmente porque no aparecen en la implementación vigente.

## Principio

La documentación tecnológica debe derivarse del repositorio real y actualizarse cuando cambie la implementación.
