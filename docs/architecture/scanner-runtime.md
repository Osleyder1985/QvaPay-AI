# Scanner Runtime

## Propósito

El Scanner Runtime coordina una ejecución de `ScanMarket`, mantiene el estado mínimo de ejecución y solicita al scheduler la siguiente ejecución.

## Responsabilidades

- validar la moneda configurada;
- validar un intervalo entero entre 5 y 300 segundos;
- impedir ejecuciones concurrentes del mismo runtime;
- registrar inicio, finalización y error de la última ejecución;
- calcular el siguiente instante de ejecución;
- delegar la programación al puerto `ScannerScheduler`.

## Fronteras

El runtime depende únicamente de:

- `MarketProvider` para obtener el mercado;
- `ScannerScheduler` para programar la siguiente ejecución.

No contiene dependencias de Cloudflare ni acceso directo a persistencia.

## Implementación Cloudflare

La implementación concreta de `ScannerScheduler` se encuentra en:

- `src/infrastructure/cloudflare/scanner-scheduler.ts`;
- `src/infrastructure/cloudflare/scanner-scheduler-do.ts`;
- `src/infrastructure/cloudflare/worker.ts`.

El Durable Object utiliza Cloudflare Alarm para despertar el proceso server-side y vuelve a programar el siguiente ciclo mediante el puerto de aplicación.

## Persistencia y recuperación

La configuración mínima de ejecución se almacena en el Durable Object. Esto permite reconstruir el scheduler después de evicción o reinicio.

El estado funcional y los snapshots de mercado todavía no tienen persistencia D1.

## Estado

El runtime y el scheduler Cloudflare tienen implementación y pruebas automatizadas.

Esto todavía no demuestra ejecución 24/7 en producción. La verificación operacional requiere despliegue, activación del scheduler y evidencia runtime reproducible.
