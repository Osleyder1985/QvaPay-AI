# Centro de Cuenta — Requisito funcional

## SYS-FR-006 — Registro completo de la cuenta QvaPay conectada

El sistema deberá registrar de forma completa, trazable y segura los datos de la cuenta QvaPay conectada a QvaPay-AI que sean entregados por las fuentes de verdad autorizadas y formen parte del contrato de Cuenta.

**Estado:** Defined / Implementation pending.

Este requisito amplía `SYS-FR-005` y no modifica requisitos previamente certificados.

## Fuentes de verdad

| Área                        | Fuente                                                 | Uso                                                                                                |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Identidad propietaria       | `GET /user` con API Token QvaPay                       | Identidad de la cuenta conectada                                                                   |
| Relación usuario-aplicación | `GET /app/{uuid}` con el mismo Bearer Token de usuario | Demostrar que la aplicación configurada pertenece al usuario autenticado                           |
| Balance                     | `POST /v2/balance`                                     | Balance de la aplicación propietaria, en USD                                                       |
| Aplicación                  | `POST /v2/info`                                        | Identidad y estado de la aplicación QvaPay; su `uuid` debe coincidir con la aplicación configurada |
| Ofertas propias             | `GET /p2p?my=1`                                        | Datos operativos propios de P2P; nunca identidad                                                   |

## Correlación de propietario

QvaPay no devuelve un campo `ownerUuid` en el detalle de aplicación. La relación propietaria se demuestra mediante el contexto de autorización:

1. `GET /user` con el Bearer Token identifica al usuario autenticado.
2. `GET /app/{uuid}` con ese mismo Bearer Token debe devolver la aplicación configurada.
3. `POST /v2/info` con las credenciales de aplicación debe devolver el mismo `uuid` configurado.
4. `POST /v2/balance` representa el balance del propietario de esa aplicación.

La implementación deberá tratar como fallo de integridad cualquier `401`, `403`, `404`, payload incompatible o discrepancia del `uuid`. No podrá marcar la integración como `verified` cuando la relación propietario-aplicación no sea demostrable.

**Hallazgo:** #196.

## Inventario contractual actual

### Identidad QvaPay

El modelo admite los campos documentados por `GET /user` que son seguros para el contrato de Cuenta:

- `uuid`;
- `username`;
- `name`;
- `lastname`;
- `email`;
- `bio`;
- `balance`;
- `satoshis`;
- `phone`;
- `phone_verified`;
- `kyc`;
- `golden_check`;
- `golden_expire`;
- `p2p_enabled`;
- `savings_roundup`;
- `cover`;
- `image`;
- `twitter`;
- `telegram`;
- `average_rating`.

`rating_count`, `vip`, `telegram_verified`, `completedAsOwner` y `completedAsPeer` no se presentan como datos contractuales verificados cuando la fuente autorizada no los entrega. Se conservan como desconocidos/no disponibles cuando corresponda.

`two_factor_secret` nunca se persiste ni se expone. El modelo solo puede registrar un indicador booleano de que el proveedor devolvió metadata de 2FA, sin conservar el secreto.

`latest_transactions` queda fuera del modelo actual hasta completar su clasificación, minimización y retención conforme a #178.

### Balance

El modelo registra `balanceUsd` y su proveniencia, estado HTTP, estado de normalización, error y timestamp. La unidad es **USD**, conforme al contrato de `/v2/balance`; no se debe inferir QUSD desde P2P.

La ausencia o incompatibilidad del balance debe permanecer diferenciada de un balance cero.

### Aplicación conectada

El modelo contempla:

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

El modelo registra accesibilidad y total de ofertas propias. Un HTTP 200 con payload incompatible no se considera una fuente verificada.

Estos datos describen actividad/capacidad P2P y no la identidad propietaria.

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
- `two_factor_secret`;
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
- Hallazgos de implementación: #189, #194, #195, #196, #197, #199.
- Seguridad/proveniencia: #97, #124, #126.
- Privacidad: #178.
- Control de cambios: #186.
