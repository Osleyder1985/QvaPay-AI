# Línea base de seguridad

## Principios

- mínimo privilegio;
- secretos exclusivamente server-side;
- validación de entrada;
- aislamiento del proveedor;
- autenticación de fronteras sensibles;
- no exposición de credenciales;
- fallo seguro;
- reintentos controlados.

## Secretos actuales

El Worker utiliza:

- `QVAPAY_APP_ID`;
- `QVAPAY_APP_SECRET`;
- `QVAPAY_USER_API_TOKEN` (API Token QvaPay con el mínimo alcance `read` requerido para `GET /user`);
- `SCANNER_BOOTSTRAP_TOKEN`;
- `P2P_ACTION_TOKEN`.

Ninguno debe almacenarse en archivos versionados, Issues, Pull Requests, logs ni navegador.

## Fronteras

### Scanner

`/internal/scanner/start` y `/internal/scanner/state` requieren Bearer token.

### Cuenta conectada

La identidad del propietario se obtiene exclusivamente mediante `GET /user` con el API Token QvaPay server-side. Los participantes de P2P nunca son fuente de identidad.

El endpoint público `GET /api/account` devuelve `403` mientras no exista una sesión de usuario autenticada independiente. No solicita ni acepta el token de infraestructura desde el navegador.

### Operaciones P2P
### Operaciones P2P

La ruta `POST /api/p2p/:uuid/apply` continúa bloqueada hasta completar la ejecución autenticada, idempotencia, reconciliación y verificación. El token de acción no sustituye la sesión, RBAC, CSRF/origin ni el registro persistente de la operación.

La tabla D1 `p2p_operations` reserva cada `offer_uuid` de forma única para compartir la barrera entre ejecución manual y Auto Apply. Un resultado `AMBIGUOUS` conserva la reserva y no permite un segundo POST automático. El resultado de aplicación y la disponibilidad del detalle se registran por separado.

### Dashboard

`GET /api/scanner/status` expone únicamente estado sanitizado y datos de mercado persistidos.

## Proveedor

La respuesta QvaPay se considera no confiable hasta pasar validación contractual. Los valores incompatibles o ausentes se representan como no disponibles.

## Logs

No registrar:

- app secret;
- user API token;
- bootstrap token;
- action token;
- firmas completas;
- cookies sensibles.

## Alineación

Esta línea base aplica principios de mínimo privilegio, separación de funciones, protección de credenciales y fallo seguro coherentes con ISO/IEC 27001/27002. No constituye certificación.
