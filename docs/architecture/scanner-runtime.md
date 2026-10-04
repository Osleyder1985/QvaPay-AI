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

## Cloudflare

La implementación futura podrá adaptar `ScannerScheduler` a Cloudflare Durable Object/Alarm. Esa integración todavía no forma parte de esta unidad y requiere verificación independiente de sus semánticas operativas.

## Estado

Esta unidad implementa la coordinación del runtime y sus pruebas unitarias. No demuestra todavía ejecución 24/7 en producción, persistencia D1, recuperación ante reinicios ni disponibilidad operacional.
