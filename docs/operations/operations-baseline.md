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

La ruta `POST /api/p2p/:uuid/apply` permanece bloqueada y devuelve HTTP `501` en la versión funcional actual. El cliente de infraestructura no equivale a una capacidad disponible para usuarios ni autoriza órdenes reales.

Antes de habilitarla deben integrarse la reserva idempotente D1 compartida, el manejo de resultados ambiguos, la reconciliación del detalle, RBAC, CSRF/origin, auditoría y pruebas de concurrencia/fallos. Un resultado ambiguo nunca debe disparar automáticamente un segundo POST.

## Aplicación P2P

`POST /api/p2p/:uuid/apply` permite una aplicación real a una oferta cuando se presenta `P2P_ACTION_TOKEN`. Esta operación requiere especial cuidado operacional y no equivale a arbitraje automático.

## Certificación

El estado del código no sustituye la evidencia de producción. La certificación requiere evidencia reproducible del deployment y de una ejecución real.
