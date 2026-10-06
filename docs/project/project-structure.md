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
│   ├── domain/\n│   │   ├── user/\n│   │   └── authorization/
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

## Separación funcional\n\nLa aplicación aplica una frontera de seguridad en el Worker: `authentication → session → user → role → authorization → module`. La interfaz no decide permisos; cada API valida la sesión y el rol en backend. `Administration` puede operar y administrar identidades; `Auditor` solo consulta. Las credenciales QvaPay permanecen exclusivamente en infraestructura server-side.\n\nLos módulos operativos existentes (scanner, mercado, cuenta y arbitrage) conservan sus contratos y lógica de negocio; la seguridad actúa como una capa de acceso, no como una modificación de sus reglas.\n\n## Infraestructura Cloudflare

La implementación actual contiene:

- Worker público;
- Durable Object;
- Alarm;
- almacenamiento SQLite del Durable Object;
- secrets para credenciales y tokens;
- dashboard HTML servido desde el Worker.

El repositorio utiliza D1 para identidades y auditoría de seguridad. Las migraciones se versionan en `migrations/` y el binding `DB` apunta a `qvapay-ai-scanner`. El Durable Object continúa siendo responsable del scheduler 24/7.\n\nLa identidad inicial se crea una sola vez cuando D1 está vacío, usando el secret server-side `ACCOUNT_AUTH_SECRET`; después, la autenticación normal usa verificadores PBKDF2 almacenados con saltos aleatorios. No se almacenan contraseñas en texto plano.
