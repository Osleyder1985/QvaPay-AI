# Estructura del proyecto

## Estructura real del repositorio

```text
QvaPay-AI/
├── .github/
│   └── workflows/
├── docs/
│   ├── architecture/
│   ├── integration/
│   ├── operations/
│   ├── project/
│   ├── quality/
│   ├── requirements/
│   ├── security/
│   └── testing/
├── scripts/
├── src/
│   ├── application/
│   │   ├── ports/
│   │   └── use-cases/
│   ├── domain/
│   └── infrastructure/
│       ├── cloudflare/
│       └── qvapay/
├── tests/
│   ├── application/
│   ├── domain/
│   └── infrastructure/
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── wrangler.toml
└── README.md
```

## Reglas arquitectónicas

- Los nombres de archivos, carpetas, ramas, commits, Issues y Pull Requests permanecen en inglés.
- La explicación documental se mantiene en español.
- `Domain` no depende de `Infrastructure`.
- `Application` depende de puertos y modelos del dominio.
- `Infrastructure` implementa las fronteras externas.
- Las pruebas se mantienen próximas a la unidad técnica que verifican.
- La documentación debe reflejar el código existente y etiquetar explícitamente las capacidades futuras.

## Infraestructura Cloudflare

La implementación actual contiene:

- Worker público;
- Durable Object;
- Alarm;
- almacenamiento SQLite del Durable Object;
- secrets para credenciales y tokens;
- dashboard HTML servido desde el Worker.

No existe actualmente `migrations/` ni configuración D1 en el repositorio.
