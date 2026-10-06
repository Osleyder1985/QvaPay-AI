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

El endpoint público `GET /api/account` permanece bloqueado mientras no exista un contexto de usuario autenticado independiente del secreto de infraestructura. En ese estado devuelve `403`; la interfaz debe mostrar que la cuenta protegida requiere autenticación, no solicitar secretos operacionales al usuario.

La ruta `POST /api/p2p/:uuid/apply` también permanece bloqueada para el dashboard público hasta disponer de una frontera de operación autenticada independiente.

## Interfaz

Cuando la ruta protegida esté disponible para una sesión autenticada, Cuenta podrá mostrar balance, identidad autenticada, estado de la aplicación, metadatos P2P propios y diagnóstico de integración. Los campos ausentes se muestran como no disponibles.

## Trazabilidad

- Requisito: Issue #95 y hallazgos #97/#100.
- Implementación: `src/infrastructure/qvapay/qvapay-account-client.ts`, `src/infrastructure/qvapay/account-contract.ts` y `src/infrastructure/cloudflare/worker.ts`.
- UI: `src/infrastructure/cloudflare/public-app.ts`.
- Tests: `tests/infrastructure/qvapay-account-client.test.ts` y pruebas del contrato público.

## Regla de evolución

Cada nuevo campo de Cuenta debe identificar su fuente QvaPay, pasar por normalización contractual, registrar su estado de lectura y tener prueba cuando sea contractual. Nunca se debe sustituir una fuente por datos de mercado ni exponer payloads upstream completos.
