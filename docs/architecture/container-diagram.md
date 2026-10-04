# Container Diagram

```mermaid
flowchart TB
    Browser[Web Browser]
    Web[Web Interface]
    API[HTTP API]
    App[Application Layer]
    Domain[Domain Layer]
    Scanner[Scanner Runtime]
    QAdapter[QvaPay Adapter]
    DBAdapter[Persistence Adapter]
    DO[Durable Object + Alarm]
    D1[(Cloudflare D1)]
    QvaPay[QvaPay P2P API]

    Browser --> Web
    Web --> API
    API --> App
    Scanner --> App
    DO --> Scanner
    App --> Domain
    App --> QAdapter
    App --> DBAdapter
    QAdapter --> QvaPay
    DBAdapter --> D1
```

| Componente | Responsabilidad |
|---|---|
| Web Interface | Presentación y configuración |
| HTTP API | Frontera de entrada/salida |
| Application | Casos de uso |
| Domain | Reglas del dominio |
| Scanner Runtime | Ejecución del escaneo |
| Durable Object | Coordinación y programación |
| QvaPay Adapter | Integración externa |
| Persistence Adapter | Acceso a persistencia |
| D1 | Almacenamiento |