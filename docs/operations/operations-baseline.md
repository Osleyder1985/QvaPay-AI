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
- snapshot de cuenta con identidad y correlación de propietario verificadas;
- cuenta habilitada para P2P, KYC, teléfono y Telegram verificados;
- oferta abierta presente en el snapshot fresco del mercado y detalle autoritativo de QvaPay;
- rechazo de ofertas propias y aplicación a ofertas VIP solo si la cuenta cumple la elegibilidad;
- reserva D1 única por UUID antes del POST remoto.

Una aplicación confirmada y la recuperación del detalle son estados independientes. Un timeout, error de transporte o HTTP 5xx deja la operación ambigua y bloqueada; no se repite automáticamente el POST. Si el apply se confirma pero falla el detalle, se conserva el resultado confirmado y solo se puede reintentar la consulta de detalle.

La ruta no acepta credenciales desde el navegador. La credencial de cuenta se usa exclusivamente server-side para verificar identidad/detalle y las credenciales de aplicación para el POST oficial de QvaPay. No se habilita Auto Apply mediante esta ruta.

## Certificación

El estado del código no sustituye la evidencia de producción. La certificación requiere evidencia reproducible del deployment y de una ejecución real.
