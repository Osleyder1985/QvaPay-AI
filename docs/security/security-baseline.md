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

## 2026-10-06 límite de seguridad del dashboard público

El dashboard público es de solo lectura para las operaciones P2P que cambian estado. El código del navegador no debe solicitar, almacenar, pedir mediante formularios ni transmitir secretos operacionales.

La identidad de la cuenta y el balance son datos protegidos. El navegador público nunca proporciona un token de infraestructura. El endpoint del Centro de Cuenta requiere un contexto de aplicación autenticado; si ese límite no existe, devuelve `403` en lugar de exponer datos de la cuenta.

Este límite sigue principios de ISO/IEC 27001/27002 sobre mínimo privilegio, separación de funciones y protección de información de autenticación; no constituye una declaración de certificación.
