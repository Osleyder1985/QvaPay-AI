# Diagrama de contexto

```mermaid
flowchart LR
    User[Usuario]
    QAI[QvaPay-AI]
    QVA[QvaPay P2P Market]
    GH[GitHub]
    CF[Cloudflare Platform]

    User -->|Consulta configuración y mercado| QAI
    QAI -->|Obtiene ofertas P2P| QVA
    QAI -->|Repositorio, CI/CD y control de cambios| GH
    QAI -->|Ejecución y persistencia| CF
```

## Frontera del sistema

QvaPay-AI es responsable de ejecutar el escaneo, validar y normalizar datos, separar BUY/SELL, agrupar por mercado/moneda, ordenar por tasa, persistir snapshots y exponer información al frontend.

QvaPay-AI no modifica ofertas externas bajo los requisitos funcionales iniciales.