# Línea base operativa

## Ciclo actual

```text
Alarm
  ↓
Load configuration
  ↓
Start scanner runtime
  ↓
GET /p2p (BUY + SELL)
  ↓
Validate
  ↓
Map to Market / Offer
  ↓
Persist snapshot in Durable Object
  ↓
Complete execution
  ↓
Schedule next Alarm
```

## Estado de ejecución

El Durable Object conserva:

- `lastStartedAt`;
- `lastCompletedAt`;
- `lastError`;
- `nextAlarmAt`;
- snapshot de mercado.

## Estado del snapshot

- `UNAVAILABLE`: no existe snapshot;
- `EMPTY`: snapshot válido sin ofertas;
- `AVAILABLE`: snapshot con ofertas.

## Errores

Un fallo de QvaPay:

1. queda registrado como `lastError`;
2. no expone credenciales;
3. conserva el último snapshot válido;
4. programa el siguiente ciclo.

## Despliegue

Cloudflare Deploy se ejecuta después de un Quality Gate exitoso sobre `main`. El workflow verifica la aplicación pública y el runtime del scanner.

## Endpoints operativos

- `GET /api/scanner/status`: estado público sanitizado.
- `POST /internal/scanner/start`: bootstrap protegido.
- `GET /internal/scanner/state`: estado detallado protegido.

## Aplicación P2P

La rama de trabajo integra `POST /api/p2p/:uuid/apply` con el almacén D1 compartido. **No se considera habilitada en producción hasta que se fusionen los controles, se despliegue y se verifique el runtime.**

Condiciones previas server-side:

- sesión válida con rol `ADMINISTRATION` y validación CSRF/origin;
- consulta en tiempo real de cuenta con identidad y correlación de propietario verificadas, persistida como snapshot;
- cuenta habilitada para P2P, KYC, teléfono y Telegram verificados;
- oferta abierta presente en el snapshot fresco del mercado y detalle autoritativo de QvaPay;
- rechazo de ofertas propias y aplicación a ofertas VIP solo si la cuenta cumple la elegibilidad;
- reserva D1 única por UUID antes del POST remoto.

La confirmación de una aplicación exige que el detalle autoritativo posterior al POST coincida en UUID, estado `processing` e identidad de cuenta verificada. Un timeout, error de transporte, HTTP 5xx, detalle inaccesible o identidad/estado discordantes deja la operación `AMBIGUOUS` y bloqueada; no se repite automáticamente el POST. Solo una coincidencia completa permite persistir `CONFIRMED`.

La ruta no acepta credenciales desde el navegador. La credencial de cuenta se usa exclusivamente server-side para verificar identidad/detalle y las credenciales de aplicación para el POST oficial de QvaPay. No se habilita Auto Apply mediante esta ruta.

## Certificación

El estado del código no sustituye la evidencia de producción. La certificación requiere evidencia reproducible del deployment y de una ejecución real.

## Recuperación de aplicaciones P2P confirmadas

Una operación con estado de aplicación `CONFIRMED` y detalle `PENDING` o `FAILED` debe identificarse mediante la reserva idempotente y recuperar el detalle remoto antes de consultar el snapshot de cuenta o ejecutar validaciones destinadas a una aplicación nueva. La recuperación requiere la credencial de cuenta para consultar el detalle remoto, pero no debe depender de que `fetchAccount()` funcione ni de reevaluar la elegibilidad de una operación ya confirmada. El estado remoto puede haber pasado de `open` a `processing` después de que QvaPay confirmara la aplicación.

- La recuperación consulta el detalle y actualiza únicamente el estado de detalle persistido.
- La recuperación nunca vuelve a invocar el POST de aplicación.
- Una caída temporal de `fetchAccount()` no bloquea la recuperación de detalle de una operación ya confirmada.
- Para operaciones nuevas, un fallo de configuración o verificación de cuenta debe liberar de forma comprobada la reserva antes de responder.
- Si falla el registro de auditoría antes del POST, la aplicación se bloquea; si la liberación de la reserva no se confirma, se devuelve un error operativo explícito y se exige revisión.
- Las validaciones de snapshot fresco, oferta abierta y elegibilidad siguen siendo obligatorias para operaciones nuevas.
- Si la validación previa de una operación nueva falla, se intenta liberar la reserva `RESERVED`; si no puede liberarse, se devuelve un error operativo y la operación requiere revisión.

### Justificación normativa y verificación

- **ISO/IEC 25010:2023:** fiabilidad y capacidad de recuperación ante fallos parciales.
- **ISO/IEC/IEEE 29119-2:2021:** pruebas de regresión de estados y recuperación.
- **ISO/IEC/IEEE 12207:2017:** trazabilidad entre requisito, implementación, pruebas y documentación.

La prueba de regresión debe simular una aplicación ya confirmada, detalle fallido y oferta remota en `processing`, y demostrar que se recupera el detalle sin repetir la mutación financiera.
