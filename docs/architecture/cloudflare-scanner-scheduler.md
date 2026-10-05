# Cloudflare Scanner Scheduler

## Propósito

Este componente adapta el puerto de aplicación `ScannerScheduler` a Cloudflare Durable Objects y Alarms.

## Flujo

`Worker control boundary → Durable Object → ScannerRuntime → QvaPayP2PClient → CloudflareScannerScheduler → Alarm`

El Worker solamente inicializa o consulta el scheduler. La ejecución periódica ocurre dentro del Durable Object mediante `alarm()`, por lo que no depende de que exista un navegador conectado.

## Persistencia

La configuración mínima del scanner se guarda en el almacenamiento del Durable Object:

- `scanner-config`;
- moneda;
- intervalo en segundos.

Esto permite reconstruir la configuración después de una evicción o reinicio del Durable Object.

D1 todavía no forma parte de esta unidad. La persistencia de snapshots de mercado y del estado funcional del scanner queda para una unidad posterior.

## Alarm

Cada Durable Object puede tener un único Alarm activo. El scheduler solamente crea el siguiente Alarm cuando no existe uno.

Después de una ejecución exitosa, `ScannerRuntime` solicita el siguiente Alarm.

Si la consulta de mercado falla, el handler captura el error y programa el siguiente intento después del mismo intervalo. Esto evita depender exclusivamente de los reintentos automáticos limitados del servicio de Alarm.

## Configuración

Wrangler define:

- `QVAPAY_API_BASE_URL`;
- `SCANNER_COIN`;
- `SCANNER_INTERVAL_SECONDS`;
- binding `SCANNER_SCHEDULER`.

El intervalo debe ser entero entre 5 y 300 segundos.

El adaptador P2P requiere además dos secretos de infraestructura:

- `QVAPAY_APP_ID`;
- `QVAPAY_APP_SECRET`.

Estas credenciales se envían exclusivamente desde el Durable Object mediante los headers `app-id` y `app-secret`. Nunca se exponen al navegador, al repositorio, a la respuesta del scanner ni a los logs.

El endpoint de inicialización del Worker es deliberadamente interno:

`POST /internal/scanner/start`

y requiere `Authorization: Bearer <SCANNER_BOOTSTRAP_TOKEN>`.

El token de bootstrap y las credenciales de QvaPay deben configurarse como secretos de Cloudflare y nunca almacenarse en el repositorio.

## Límites

Esta unidad todavía no implementa:

- API pública del scanner;
- UI;
- snapshots D1;
- arbitrage engine;
- ejecución de órdenes;
- certificación de operación 24/7 en producción.

## Estado de evidencia

La implementación y las pruebas automatizadas no equivalen a verificación de producción. La operación 24/7 requiere posteriormente despliegue, activación del scheduler y evidencia runtime reproducible.

La evidencia actual demostró que Durable Object Alarm se activa y se reprograma, pero la ejecución de mercado no puede considerarse satisfactoria hasta que las credenciales de aplicación de QvaPay estén configuradas y una lectura P2P real complete sin error.
