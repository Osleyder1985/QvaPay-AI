# Project Structure

## Objetivo

Definir una estructura de repositorio coherente con los límites arquitectónicos del sistema.

```
QvaPay-AI/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   ├── security/
│   ├── operations/
│   └── testing/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── interfaces/
│   └── shared/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── e2e/
├── migrations/
├── scripts/
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

## Reglas

- Los nombres de carpetas y archivos son English technical names.
- La documentación explicativa es española.
- Domain no depende de Infrastructure.
- Tests se organizan por nivel.
- La documentación arquitectónica no debe duplicarse en múltiples ubicaciones.
- Cada módulo relevante deberá tener documentación suficiente para comprender su responsabilidad y trazabilidad.
## Estructura ejecutable inicial

A partir de la implementación inicial, la estructura de código seguirá la separación arquitectónica documentada:

```text
src/
├── domain/
│   ├── offer.ts
│   └── market.ts
└── application/
    ├── ports/
    │   └── market-provider.ts
    └── use-cases/
        └── scan-market.ts

tests/
└── domain/
    ├── market.test.ts
    └── offer.test.ts
```

La infraestructura QvaPay, persistencia, interfaces HTTP y ejecución programada permanecen pendientes de implementación. No deben simularse como capacidades existentes.
