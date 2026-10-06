# ⚡ QvaPay-AI

QvaPay-AI es una aplicación server-side para **observación, análisis y operación controlada del mercado P2P de QvaPay**. El sistema consulta el mercado real, valida y normaliza las ofertas, separa estrictamente los libros BUY/SELL por moneda, mantiene un snapshot en el Durable Object y presenta una interfaz web de producción.

## 🚀 Producción

**[Abrir QvaPay-AI en producción](https://qvapay-ai-runtime.osleyder-gonzalez1985.workers.dev)**

- 🌐 Worker: `qvapay-ai-runtime`
- ☁️ Runtime: Cloudflare Workers + Durable Object + Alarm
- 🪙 Mercado configurado: `BANK_CUP`
- ⏱️ Intervalo predeterminado: 10 segundos
- 📡 Fuente: QvaPay P2P `GET /p2p`
- 👁️ Dashboard público: lectura de mercado
- 🔐 Credenciales: exclusivamente en secretos de Cloudflare

## 📊 Funcionalidad implementada

### Cuenta conectada

La sección **Cuenta** está preparada para consultar, de forma server-side, fuentes independientes de QvaPay:

- balance: `POST /v2/balance`;
- aplicación: `POST /v2/info`;
- identidad autenticada: `GET /user` con API Token de alcance mínimo `read`;
- ofertas propias: `GET /p2p?my=1`.

La identidad de cuenta nunca se deriva de un participante P2P. Mientras no exista una sesión de usuario autenticada independiente, `GET /api/account` devuelve `403` y el navegador no solicita secretos operacionales.

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

El dashboard central organiza la aplicación en **Inicio**, **Mercado P2P**, **Operaciones**, **Controles** y **Auditoría**.

- Resumen operativo del scanner server-side.
- Mejor BUY y mejor SELL.
- Spread y porcentaje de spread.
- Liquidez disponible.
- Cantidad de ofertas.
- Estado del snapshot: `UNAVAILABLE`, `EMPTY` o `AVAILABLE`.
- Cuenta regresiva hasta el siguiente Alarm.
- Tablas BUY/SELL separadas.
- Paneles visibles de seguridad, calidad, continuidad, exposición y trazabilidad.
- Referencias inspiradas en ISO 9001, ISO/IEC 27001 e ISO 22301, sin declarar certificación.
- ⭐ Resaltado de la mejor oferta.
- 🟢 **Comprar** y 🔴 **Vender** como representación visual del mercado; las operaciones que cambian estado permanecen bloqueadas en el dashboard público.
- 👑 Indicadores VIP.
- Animaciones de estado y actividad del scanner.

### ⚙️ Scanner server-side 24/7

El navegador **no ejecuta el scanner**:

`Cloudflare Worker → Durable Object → Alarm → Scanner Runtime → QvaPay P2P → snapshot`

El Durable Object conserva configuración y estado para que una recarga o ausencia de usuarios no reinicie el ciclo.

### 🔐 Operaciones P2P

La ruta `POST /api/p2p/:uuid/apply` existe como frontera server-side, pero el dashboard público no puede ejecutar operaciones reales mientras no exista una frontera de usuario/operación autenticada independiente. El navegador nunca recibe ni solicita `P2P_ACTION_TOKEN`, `QVAPAY_APP_SECRET` ni `QVAPAY_USER_API_TOKEN`.

## 🧱 Arquitectura

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

Cloudflare D1, webhook P2P, stream SSE, ingestión event-driven completa y motor de arbitraje siguen siendo capacidades futuras; no se presentan como implementadas.

## 🧪 Quality Gate

Cada cambio debe pasar **Repository Quality Gate**, incluyendo:

- 📚 calidad documental;
- 🇪🇸 comprobación lingüística;
- 🧩 type-check;
- 🔎 lint;
- ☁️ validación de bundle Cloudflare;
- ✨ Prettier;
- 🧪 pruebas automatizadas.

El despliegue de Cloudflare se activa después de un Quality Gate exitoso sobre `main` y despliega exactamente el commit verificado.

## ☁️ Verificación de producción

El despliegue comprueba:

1. HTTP 200 de la aplicación pública.
2. Respuesta válida de `GET /api/scanner/status`.
3. Snapshot `AVAILABLE` con BUY y SELL no vacíos.
4. `totalOffers > 0`, `snapshotAt`, `bestBuyRate` y `bestSellRate`.
5. Elementos esenciales del dashboard.
6. Mapeo correcto de acciones BUY/SELL.
7. Bootstrap autenticado del scanner.
8. Ejecución real del scanner.
9. `lastStartedAt` y `lastCompletedAt`.
10. Ausencia de `lastError`.
11. Programación de `nextAlarmAt`.

Merge, CI verde y deployment exitoso son evidencia importante, pero **no equivalen automáticamente a Certified**.

## 📚 Documentación

La documentación explicativa está en español. Se conservan en inglés los nombres técnicos estables: archivos, carpetas, identificadores, comandos, rutas API, nombres de clases, estados formales y títulos de Issues/Pull Requests.

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

`Requirement → Design → Implementation → Automated Tests → Runtime Verification → Production Verification → Evidence → Certification`

Estados formales:

`Defined → Designed → Implemented → Tested → Verified → Certified`

Además: `Failed / Rejected` y `Blocked`.

Un elemento no se marca como certificado sin evidencia objetiva y reproducible.

## 📌 Estado documental

La documentación debe describir el **estado real del código**, distinguir implementación actual de arquitectura futura y mantener la trazabilidad con Issues, Pull Requests, pruebas y evidencia de producción.

**Última sincronización documental:** 2026-10-06.
