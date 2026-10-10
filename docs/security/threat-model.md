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

| Amenaza                       | Impacto    | Control                                       |
| ----------------------------- | ---------- | --------------------------------------------- |
| Exposición de credenciales    | Alto       | Cloudflare Secrets                            |
| Acceso al control del scanner | Alto       | Bearer token                                  |
| Aplicación P2P no autorizada  | Alto       | `P2P_ACTION_TOKEN` + credenciales server-side |
| Respuesta QvaPay inválida     | Alto       | Validación de contrato                        |
| BUY/SELL mezclados            | Alto       | Invariantes de dominio                        |
| Mercado equivocado            | Alto       | Identidad por `coin`                          |
| Rate limiting                 | Medio/Alto | Backoff acotado                               |
| Reintentos duplicados         | Medio      | límites de reintento y control de ejecución   |
| Información sensible en logs  | Alto       | Sanitización                                  |

## Integridad de operaciones P2P


| Amenaza                                                       | Impacto | Control requerido                                                                   |
| ------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Aplicación manual y Auto Apply concurrentes a la misma oferta | Crítico | Reserva D1 única por `offer_uuid` y reclamación condicional                         |
| Timeout tras enviar el POST                                   | Crítico | Estado `AMBIGUOUS`, sin reintento automático                                        |
| Aplicación aceptada y detalle no disponible                   | Crítico | Estado de aplicación separado del estado de detalle; reconciliación de solo lectura |
| Reinicio del Worker tras reservar una oferta                  | Alto    | Estado persistente D1; nunca confiar en memoria del proceso                         |
| Auditor intenta ejecutar una operación                        | Alto    | RBAC server-side exclusivo para Administration                                      |

El almacén persistente es la base de la protección, pero no significa que el flujo esté habilitado: el endpoint permanece en 501 hasta que las transiciones estén conectadas y verificadas end-to-end.

La capacidad de aplicación P2P es una operación real y no debe confundirse con una simulación. Cualquier automatización posterior requiere controles adicionales, autorización explícita y verificación específica.

## Feed futuro

Si se implementa webhook, deberá añadirse validación criptográfica, control de replay y deduplicación.
