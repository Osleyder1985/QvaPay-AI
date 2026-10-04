# Diagrama de componentes

> **Estado documental:** componentes objetivo/propuestos. La implementación actual se determina exclusivamente por el código existente y la matriz de trazabilidad.

```mermaid
flowchart LR
    subgraph Interfaces
      HTTP[HTTP Controllers]
      WEB[Web Components]
    end

    subgraph Application
      Scan[Scan Market]
      Snapshot[Get Latest Snapshot]
      Config[Configure Scanner]
    end

    subgraph Domain
      Market[Market]
      Offer[Offer]
      Side[Offer Side]
    end

    subgraph Infrastructure
      QClient[QvaPay Client]
      QMapper[QvaPay Mapper]
      Repo[Market Snapshot Repository]
      Scheduler[Scanner Scheduler]
    end

    HTTP --> Scan
    HTTP --> Snapshot
    HTTP --> Config
    WEB --> HTTP
    Scan --> Market
    Scan --> Offer
    Scan --> QClient
    Scan --> Repo
    QClient --> QMapper
    Scheduler --> Scan
    Repo --> DB[(D1)]
```

## Regla de dependencias

Las dependencias deben apuntar hacia el dominio:

```
Interfaces → Application → Domain
Infrastructure → Application/Domain contracts
```

El dominio no debe importar APIs de Cloudflare, SDKs de QvaPay ni detalles de persistencia.