# Diagrama de contenedores

## Estado

Este diagrama representa la implementación vigente y separa explícitamente las capacidades futuras.

```mermaid
flowchart TB
    Browser[Navegador]
    Worker[Cloudflare Worker]
    Dashboard[Dashboard público]
    API[API pública y fronteras protegidas]
    DO[Durable Object]
    Runtime[Scanner Runtime]
    QAdapter[QvaPay Adapter]
    QVA[QvaPay P2P API]
    Storage[Durable Object SQLite Storage]

    Browser --> Dashboard
    Dashboard --> API
    API --> Worker
    Worker --> DO
    DO --> Runtime
    Runtime --> QAdapter
    QAdapter --> QVA
    DO --> Storage
```

## Componentes

| Componente | Responsabilidad |
|---|---|
| Dashboard público | Presentación y acciones protegidas |
| Worker | Ruteo HTTP y fronteras de seguridad |
| Durable Object | Estado, snapshot y programación |
| Scanner Runtime | Coordinación del escaneo |
| QvaPay Adapter | Contrato, autenticación, paginación y mapeo |
| SQLite Storage | Persistencia del Durable Object |

D1, webhook, SSE y Event Ingestion Boundary no forman parte del despliegue actual.
