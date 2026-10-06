# Diagrama de contexto

## Estado

Representa el sistema desplegado actualmente.

```mermaid
flowchart LR
    User[Usuario]
    QAI[QvaPay-AI]
    QVA[QvaPay P2P]
    GH[GitHub]
    CF[Cloudflare]

    User -->|Consulta mercado y estado| QAI
    QAI -->|GET /p2p| QVA
    QAI -->|CI/CD y control de cambios| GH
    QAI -->|Ejecución server-side| CF
```

## Frontera

QvaPay-AI consulta, valida, normaliza, clasifica y presenta ofertas P2P. También dispone de una frontera protegida para aplicar a una oferta.

El sistema no debe ejecutar estrategias automáticas de arbitraje sin requisitos y controles específicos.
