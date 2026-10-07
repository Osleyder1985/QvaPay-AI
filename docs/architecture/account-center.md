# Centro de Cuenta

## Propósito

El módulo **Cuenta** presenta información separada y trazable de la cuenta propietaria asociada a las credenciales QvaPay configuradas en el servidor.

## Fuentes de verdad

| Información | Fuente |
|---|---|
| Balance | `POST /v2/balance` |
| Aplicación | `POST /v2/info` |
| Identidad autenticada | `GET /user` con API Token QvaPay de alcance mínimo `read` |
| Ofertas propias | `GET /p2p?my=1` |

La identidad de la cuenta **no** se obtiene de una oferta P2P ni de su participante. Los participantes de P2P son datos de mercado.

## Proveniencia y estados

Cada fuente se conserva con su estado HTTP, resultado de normalización y marca temporal de lectura. Un valor ausente, incompatible o no disponible no se convierte en cero ni se presenta como verificado.

Los estados de integración distinguen, según corresponda:

- **verified**: las dependencias requeridas entregaron datos compatibles;
- **degraded**: existe información válida pero una dependencia no está disponible;
- **failed**: no puede validarse la integración requerida.

## Seguridad

El token de API de usuario de QvaPay permanece exclusivamente en el Worker. El `app-secret`, `QVAPAY_USER_API_TOKEN`, `SCANNER_BOOTSTRAP_TOKEN` y `P2P_ACTION_TOKEN` nunca se entregan al navegador.

El endpoint `GET /api/account` requiere una sesión de usuario independiente. La sesión se crea mediante `POST /api/auth/login`, usando una credencial de autenticación configurada como secreto del Worker, y se conserva en una cookie `HttpOnly`, `Secure`, `SameSite=Strict` con firma HMAC y expiración. Sin sesión devuelve `403`. La credencial de autenticación nunca se conserva en almacenamiento del navegador ni se utiliza como credencial QvaPay.

La ruta `POST /api/p2p/:uuid/apply` también permanece bloqueada para el dashboard público hasta disponer de una frontera de operación autenticada independiente.

## Interfaz

Con una sesión autenticada, Cuenta puede mostrar balance, identidad autenticada, estado de la aplicación, metadatos P2P propios y diagnóstico de integración. La sesión de dashboard es independiente de `QVAPAY_USER_API_TOKEN`; este último continúa exclusivamente server-side y se utiliza solo para `GET /user`.

## Trazabilidad

- Requisitos: Issue #95, SYS-FR-006 / Issue #187 y hallazgos #97/#100.
- Implementación: `src/infrastructure/qvapay/qvapay-account-client.ts`, `src/infrastructure/qvapay/account-contract.ts`, `src/infrastructure/cloudflare/account-auth.ts` y `src/infrastructure/cloudflare/worker.ts`.
- UI: `src/infrastructure/cloudflare/public-app.ts`.
- Tests: `tests/infrastructure/qvapay-account-client.test.ts` y pruebas del contrato público.

## Requisito de completitud

El registro de Cuenta se rige por SYS-FR-006 / Issue #187. La implementación debe cubrir todos los campos admitidos por el contrato de las fuentes autorizadas, con proveniencia y estado por dato. Los campos que actualmente no tienen una fuente contractual identificada no se pueden presentar como verificados.

## Regla de evolución

Cada nuevo campo de Cuenta debe identificar su fuente QvaPay, pasar por normalización contractual, registrar su estado de lectura y tener prueba cuando sea contractual. Nunca se debe sustituir una fuente por datos de mercado ni exponer payloads upstream completos.
