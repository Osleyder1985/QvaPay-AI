# ⚡ QvaPay-AI

QvaPay-AI es una aplicación server-side para **observación, análisis y operación controlada del mercado P2P de QvaPay**. El sistema consulta el mercado real, valida y normaliza las ofertas, separa estrictamente los libros BUY/SELL por moneda, mantiene un snapshot en el Durable Object y presenta una interfaz web de producción.

## 🚀 Producción

**[Abrir QvaPay-AI en producción](https://qvapay-ai-runtime.osleyder-gonzalez1985.workers.dev)**

La aplicación se sirve directamente desde Cloudflare Workers.

### Estado actual de producción

- 🌐 Worker: `qvapay-ai-runtime`
- 🔗 URL pública: `https://qvapay-ai-runtime.osleyder-gonzalez1985.workers.dev`
- ☁️ Runtime: Cloudflare Workers + Durable Object + Alarm
- 🪙 Mercado configurado: `BANK_CUP`
- ⏱️ Intervalo predeterminado: 10 segundos
- 📡 Fuente: QvaPay P2P `GET /p2p`
- 👁️ Dashboard: lectura de mercado y acciones P2P protegidas
- 🔐 Credenciales: exclusivamente en secretos de Cloudflare

## 📊 Funcionalidad implementada

### Mercado P2P

- Consulta independiente de BUY y SELL.
- Aislamiento estricto por `coin`.
- Paginación completa.
- Validación del contrato externo.
- Preservación de cantidades y tasas como cadenas decimales.
- Cálculo de la tasa efectiva a partir de `receive / amount`.
- Identificación de usuario, fecha de creación, estado y restricciones VIP.
- Marca temporal propia de observación mediante `observedAt`.

### 📈 Dashboard

- Mejor BUY y mejor SELL.
- Spread y porcentaje de spread.
- Liquidez disponible.
- Cantidad de ofertas.
- Estado del snapshot: `UNAVAILABLE`, `EMPTY` o `AVAILABLE`.
- Estado operativo del scanner.
- Cuenta regresiva hasta el siguiente Alarm.
- Actualización periódica desde el estado persistido del servidor.
- Tablas BUY/SELL separadas.
- ⭐ Resaltado de la mejor oferta con heartbeat dorado.
- 🟢 Acción **Comprar** para ofertas SELL.
- 🔴 Acción **Vender** para ofertas BUY.
- 👑 Indicadores VIP.
- Animaciones de estado, hover, heartbeat y actividad del scanner.

### ⚙️ Scanner server-side 24/7

El navegador **no ejecuta el scanner**. El flujo operativo es:

`Cloudflare Worker → Durable Object → Alarm → Scanner Runtime → QvaPay P2P → snapshot`

El Durable Object conserva configuración y estado de ejecución para que una recarga o ausencia de usuarios no reinicie el ciclo.

### 🔐 Operaciones P2P

La aplicación dispone de una ruta server-side para aplicar a una oferta:

`POST /api/p2p/:uuid/apply`

La operación requiere el secreto `P2P_ACTION_TOKEN` y las credenciales `QVAPAY_APP_ID` / `QVAPAY_APP_SECRET`. Ninguna de estas credenciales debe aparecer en el navegador, repositorio, documentación ni logs.

> ⚠️ La interfaz actual permite una **acción real de aplicación P2P**. El módulo de análisis/arbitraje debe mantenerse separado y no debe ejecutar órdenes automáticamente sin un requisito explícito y una verificación específica.

## 🧱 Arquitectura

El repositorio sigue una separación modular:

```text
src/
├── domain/
├── application/
│   ├── ports/
│   └── use-cases/
└── infrastructure/
    ├── cloudflare/
    └── qvapay/
```

- **Domain:** `Market`, `Offer` y comparación decimal.
- **Application:** scanner runtime, caso de uso y puertos.
- **QvaPay Infrastructure:** contrato, DTO, mapper y cliente P2P.
- **Cloudflare Infrastructure:** Worker, Durable Object, Alarm y dashboard público.

Cloudflare D1, webhook P2P, stream SSE, ingestión event-driven completa y motor de arbitraje siguen siendo capacidades futuras; no se presentan como implementadas.

## 🧪 Quality Gate

Cada cambio debe pasar el workflow **Repository Quality Gate**.

Incluye:

- 📚 calidad documental;
- 🇪🇸 comprobación de convención lingüística;
- 🧩 type-check;
- 🔎 lint;
- ☁️ validación de bundle Cloudflare;
- ✨ Prettier;
- 🧪 pruebas automatizadas.

El workflow de despliegue de Cloudflare se activa después de un Quality Gate exitoso sobre `main` y despliega exactamente el commit verificado.

## ☁️ Verificación de producción

El despliegue comprueba:

1. HTTP 200 de la aplicación pública.
2. Respuesta válida de `GET /api/scanner/status`.
3. Elementos esenciales del dashboard.
4. Mapeo correcto de acciones BUY/SELL.
5. Heartbeat de la mejor oferta.
6. Bootstrap autenticado del scanner.
7. Ejecución real del scanner.
8. `lastStartedAt` y `lastCompletedAt`.
9. Ausencia de `lastError`.
10. Programación de `nextAlarmAt`.

Merge, CI verde y deployment exitoso son evidencia importante, pero **no equivalen automáticamente a Certified**.

## 📚 Documentación

La documentación explicativa está en español. Se conservan en inglés los nombres técnicos que deben permanecer estables: archivos, carpetas, identificadores, comandos, rutas API, nombres de clases, estados formales y títulos de Issues/Pull Requests.

Estructura:

- `docs/architecture/` — arquitectura y decisiones.
- `docs/integration/` — contratos e integración QvaPay.
- `docs/operations/` — operación y runtime.
- `docs/project/` — estructura del repositorio.
- `docs/quality/` — verificación y certificación.
- `docs/requirements/` — requisitos y trazabilidad.
- `docs/security/` — seguridad y amenazas.
- `docs/testing/` — estrategia y Quality Gate.

## 📐 Regla de trazabilidad

El proyecto utiliza la cadena:

**Requirement → Design → Implementation → Automated Tests → Runtime Verification → Production Verification → Evidence → Certification**

Estados formales:

`Defined → Designed → Implemented → Tested → Verified → Certified`

Además:

`Failed / Rejected` y `Blocked`.

Un elemento no se marca como certificado sin evidencia objetiva y reproducible.

## 🛠️ Desarrollo

```bash
npm install
npm run build
npm run lint
npm run format:check
npm run check:docs-language
npm test
npx wrangler deploy --dry-run
```

## 📌 Estado documental

La documentación debe describir el **estado real del código**, distinguir implementación actual de arquitectura futura y mantener la trazabilidad con Issues, Pull Requests, pruebas y evidencia de producción.

**Última sincronización documental:** 2026-10-06.
