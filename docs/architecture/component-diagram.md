# Diagrama de componentes

## Estado

Componentes alineados con la implementación actual.

```mermaid
flowchart LR
    Worker[Cloudflare Worker]
    Web[Public Web App]
    Status[Public Scanner Status]
    Apply[Protected P2P Apply]
    Control[Protected Scanner Control]
    DO[Durable Object]
    Alarm[Alarm]
    Runtime[Scanner Runtime]
    Client[QvaPay P2P Client]
    Contract[Contract Validation]
    Mapper[QvaPay Mapper]
    Domain[Market / Offer]
    QVA[QvaPay API]

    Worker --> Web
    Worker --> Status
    Worker --> Apply
    Worker --> Control
    Control --> DO
    Apply --> Client
    DO --> Alarm
    Alarm --> Runtime
    Runtime --> Client
    Client --> Contract
    Contract --> Mapper
    Mapper --> Domain
    Client --> QVA
```

## Regla de dependencias

```text
Infrastructure → Application → Domain
```

El dominio no depende de Cloudflare ni de QvaPay.
