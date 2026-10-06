# Modelo de amenazas

## Activos

- credenciales QvaPay;
- tokens de control;
- token de aplicación P2P;
- configuración del scanner;
- snapshot de mercado;
- integridad de BUY/SELL;
- disponibilidad del scanner.

## Amenazas y controles

| Amenaza | Impacto | Control |
|---|---|---|
| Exposición de credenciales | Alto | Cloudflare Secrets |
| Acceso al control del scanner | Alto | Bearer token |
| Aplicación P2P no autorizada | Alto | `P2P_ACTION_TOKEN` + credenciales server-side |
| Respuesta QvaPay inválida | Alto | Validación de contrato |
| BUY/SELL mezclados | Alto | Invariantes de dominio |
| Mercado equivocado | Alto | Identidad por `coin` |
| Rate limiting | Medio/Alto | Backoff acotado |
| Reintentos duplicados | Medio | límites de reintento y control de ejecución |
| Información sensible en logs | Alto | Sanitización |

## Riesgo operativo

La capacidad de aplicación P2P es una operación real y no debe confundirse con una simulación. Cualquier automatización posterior requiere controles adicionales, autorización explícita y verificación específica.

## Feed futuro

Si se implementa webhook, deberá añadirse validación criptográfica, control de replay y deduplicación.
