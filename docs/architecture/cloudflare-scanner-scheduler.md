# Cloudflare Scanner Scheduler

## Propósito

Adaptar el puerto `ScannerScheduler` a Cloudflare Durable Objects y Alarms.

## Flujo actual

`Worker → Durable Object → Scanner Runtime → QvaPayP2PClient → Alarm`

El Worker crea o consulta el scheduler. El Durable Object ejecuta el ciclo mediante `alarm()`.

## Persistencia

El Durable Object conserva:

- `scanner-config`;
- moneda;
- intervalo;
- estado de ejecución;
- snapshot de mercado;
- próxima alarma.

La configuración se valida entre 5 y 300 segundos.

## Alarm

El scheduler mantiene una única alarma para el objeto. Después de cada ejecución solicita la siguiente programación.

El ciclo se basa en la finalización real de la ejecución para evitar publicar una siguiente ejecución ya vencida cuando la consulta al proveedor tarda más de lo esperado.

Ante un error se conserva el último snapshot válido, se registra `lastError` y se programa el siguiente ciclo.

## Secretos

El runtime utiliza:

- `QVAPAY_APP_ID`;
- `QVAPAY_APP_SECRET`;
- `SCANNER_BOOTSTRAP_TOKEN`;
- `P2P_ACTION_TOKEN` para aplicar ofertas.

Los valores son secrets de Cloudflare y no forman parte del repositorio.

## Endpoints

- `POST /internal/scanner/start`: inicialización protegida.
- `GET /internal/scanner/state`: estado operativo protegido.
- `GET /api/scanner/status`: estado público sanitizado.
- `POST /api/p2p/:uuid/apply`: aplicación P2P protegida por token.

## Estado

El scheduler está implementado y probado. La evidencia de producción se obtiene mediante el workflow de Cloudflare Deploy.
