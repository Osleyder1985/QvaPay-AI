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

La implementación de la ruta `POST /api/p2p/:uuid/apply` se mantiene en una rama de trabajo hasta que los controles pasen y se verifique el despliegue. En producción no debe considerarse habilitada por la mera existencia del cliente de infraestructura.

Antes de invocar QvaPay, la ruta exige rol `ADMINISTRATION`, origen válido para la sesión, identidad de cuenta y correlación de propietario verificadas, elegibilidad P2P/KYC/teléfono/Telegram, oferta abierta y fresca, detalle autoritativo y rechazo de ofertas propias. El token de cuenta y los secretos de aplicación permanecen server-side.

D1 mantiene una reserva única por `offer_uuid` compartida por `MANUAL` y `AUTO_APPLY`. Una operación ambigua no libera la reserva ni permite un segundo POST automático. La aplicación confirmada y la recuperación del detalle se registran por separado; un fallo del detalle no revierte el éxito de apply.

El esquema de operaciones se inicializa bajo demanda y queda aislado del inicializador de autenticación para que un fallo del subsistema P2P no interrumpa el límite de sesión.

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
