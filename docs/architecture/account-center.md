# Account Center

## Propósito

El módulo **Cuenta** presenta la información de la cuenta propietaria asociada a las credenciales de la aplicación QvaPay.

## Fuentes de verdad

| Información | Fuente |
|---|---|
| Balance | `POST /v2/balance` |
| Aplicación | `POST /v2/info` |
| Identidad P2P observada | `GET /p2p?my=1` |
| Ofertas propias | `GET /p2p?my=1` |

La identidad se obtiene únicamente de una oferta perteneciente al conjunto `my=1`; no se infiere desde una contraparte pública.

## Seguridad

El endpoint `GET /api/account` requiere la clave de operación P2P mediante `x-p2p-action-token`. La interfaz solicita esa clave cuando el usuario abre Cuenta y la mantiene únicamente en memoria del navegador.

El `app-secret` nunca se entrega al cliente. Tampoco se devuelve el payload completo de QvaPay ni campos desconocidos potencialmente sensibles.

## Estados

- **verified**: balance, aplicación, identidad P2P y acceso a ofertas propias cumplen sus contratos.
- **degraded**: existe información válida, pero falta una dependencia crítica.
- **failed**: ninguna dependencia crítica permite validar la integración.

## Interfaz

La sección Cuenta incluye:

- balance QUSD;
- usuario y nombre;
- UUID;
- rating y número de valoraciones;
- KYC, VIP y Golden Check;
- teléfono y Telegram verificados;
- contadores P2P;
- número de ofertas propias;
- aplicación, UUID, estado, URL, callback y fechas;
- estado de integración;
- fecha de sincronización.

Los campos ausentes se muestran como no disponibles; nunca se inventan valores.

## Trazabilidad

- Requisito: Issue #95.
- Implementación: `src/infrastructure/qvapay/qvapay-account-client.ts` y `src/infrastructure/cloudflare/worker.ts`.
- UI: `src/infrastructure/cloudflare/public-app.ts`.
- Tests: `tests/infrastructure/qvapay-account-client.test.ts`.

## Regla de evolución

Cada nuevo campo de Cuenta debe identificar su fuente QvaPay, pasar por normalización, tener prueba cuando sea contractual y mantenerse fuera de cualquier secreto o payload upstream completo.
