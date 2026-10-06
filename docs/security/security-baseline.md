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
- `QVAPAY_USER_API_TOKEN` (API token with the minimum `read` permission required by the authenticated profile endpoint);
- `SCANNER_BOOTSTRAP_TOKEN`;
- `P2P_ACTION_TOKEN`.

Ninguno debe almacenarse en archivos versionados.

## Fronteras

### Scanner

`/internal/scanner/start` y `/internal/scanner/state` requieren Bearer token.

### Cuenta conectada

La identidad del propietario se obtiene exclusivamente mediante `GET /user` con un API Token de QvaPay autenticado. Los participantes de P2P nunca son una fuente de identidad de cuenta.

### Aplicación P2P

`/api/p2p/:uuid/apply` requiere `x-p2p-action-token`.

### Dashboard

`GET /api/scanner/status` expone únicamente estado sanitizado y no secretos.

## Proveedor

La respuesta QvaPay se considera no confiable hasta pasar validación de contrato.

## Logs

No registrar:

- app secret;
- bootstrap token;
- action token;
- firmas completas;
- cookies sensibles.

## Alcance

La línea base debe ampliarse antes de introducir autenticación de usuarios, permisos administrativos, automatización financiera o estrategias de arbitraje.


## 2026-10-06 public dashboard security boundary

The public dashboard is read-only for state-changing P2P operations. Browser code must not request, store, prompt for, or transmit `P2P_ACTION_TOKEN`, `SCANNER_BOOTSTRAP_TOKEN`, QvaPay application credentials, or `QVAPAY_USER_API_TOKEN`.

Account identity and balance are protected data. The Account Center endpoint requires an authenticated application context (Cloudflare Access when enabled). If that boundary is absent, the endpoint returns `403` rather than exposing account data.

This boundary is aligned with ISO/IEC 27001/27002 principles for least privilege, separation of duties and protection of authentication information; it is not a claim of certification.
