# Centro de Cuenta — Requisito funcional

## SYS-FR-006 — Registro completo de la cuenta QvaPay conectada

El sistema deberá registrar de forma completa, trazable y segura los datos de la cuenta QvaPay conectada a QvaPay-AI que sean entregados por las fuentes de verdad autorizadas y formen parte del contrato de Cuenta.

**Estado:** Defined / Implementation pending.

Este requisito amplía `SYS-FR-005` y no modifica requisitos previamente certificados.

## Fuentes de verdad

| Área | Fuente | Uso |
|---|---|---|
| Identidad propietaria | `GET /user` con API Token QvaPay | Identidad de la cuenta conectada |
| Balance | `POST /v2/balance` | Balance disponible |
| Aplicación | `POST /v2/info` | Identidad y estado de la aplicación QvaPay |
| Ofertas propias | `GET /p2p?my=1` | Datos operativos propios de P2P; nunca identidad |

## Inventario contractual actual

### Identidad QvaPay

El modelo actual contempla:

- `uuid`;
- `username`;
- `name`;
- `lastname`;
- `image`;
- `ratingAvg`;
- `ratingCount`;
- `kyc`;
- `vip`;
- `goldenCheck`;
- `phoneVerified`;
- `telegramVerified`;
- `p2pEnabled`;
- `completedAsOwner`;
- `completedAsPeer`.

Los dos últimos campos existen en el contrato pero actualmente se normalizan como `null`; no se deben presentar como datos verificados hasta identificar una fuente QvaPay contractual que los entregue.

### Balance

El modelo actual registra `balanceUsd` y su proveniencia, estado HTTP, estado de normalización, error y timestamp.

La ausencia o incompatibilidad del balance debe permanecer diferenciada de un balance cero.

### Aplicación conectada

El modelo actual contempla:

- `uuid`;
- `name`;
- `url`;
- `description`;
- `callback`;
- `successUrl`;
- `cancelUrl`;
- `logo`;
- `appPhotoUrl`;
- `active`;
- `enabled`;
- `card`;
- `createdAt`;
- `updatedAt`.

### P2P propio

El modelo registra accesibilidad y total de ofertas propias. Estos datos describen actividad/capacidad P2P y no la identidad propietaria.

## Regla de completitud

“Completo” significa completo respecto del contrato QvaPay-AI aprobado para las fuentes autorizadas, no captura indiscriminada del payload upstream.

Cada campo deberá tener:

1. fuente QvaPay;
2. nombre normalizado;
3. tipo y regla de validación;
4. estado cuando esté ausente o sea incompatible;
5. marca temporal de obtención;
6. prueba contractual cuando corresponda.

## Seguridad y privacidad

No se deben registrar ni exponer:

- API tokens;
- app secrets;
- credenciales de autenticación;
- payloads upstream completos cuando incluyan secretos o datos fuera del alcance.

La clasificación, retención y eliminación de los datos de Cuenta queda vinculada a Issue #178.

## Criterio de certificación

`SYS-FR-006` no podrá pasar a **Verified** o **Certified** únicamente por existir el contrato. Requiere implementación, pruebas, documentación sincronizada y evidencia de producción autenticada.

## Trazabilidad

- Issue: #187.
- Contrato: `src/infrastructure/qvapay/account-contract.ts`.
- Cliente: `src/infrastructure/qvapay/qvapay-account-client.ts`.
- Arquitectura: `docs/architecture/account-center.md`.
- Pruebas: `tests/infrastructure/qvapay-account-client.test.ts`.
- Seguridad/proveniencia: #97, #124, #126.
- Privacidad: #178.
- Control de cambios: #186.
