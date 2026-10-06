# Scanner Runtime

## Propósito

Coordinar una ejecución de `ScanMarket`, conservar el estado mínimo y solicitar al scheduler el siguiente ciclo.

## Responsabilidades

- validar la moneda;
- validar un intervalo entero de 5 a 300 segundos;
- impedir ejecuciones concurrentes;
- registrar inicio, finalización y error;
- ejecutar el caso de uso de escaneo;
- conservar el snapshot de mercado;
- programar el siguiente ciclo.

## Fronteras

El runtime depende únicamente de:

- `MarketProvider`;
- `ScannerScheduler`.

No contiene lógica específica de Cloudflare ni credenciales del proveedor.

## Estado expuesto

El runtime conserva:

- `lastStartedAt`;
- `lastCompletedAt`;
- `lastError`;
- `nextAlarmAt`;
- snapshot de mercado.

## Semántica del dashboard

`UNAVAILABLE` significa que todavía no existe snapshot.

`EMPTY` significa que existe un snapshot válido sin ofertas.

`AVAILABLE` significa que existe un snapshot con ofertas.

## Verificación

Las pruebas automatizadas cubren el runtime y el scheduler. La operación real en producción se verifica posteriormente mediante el pipeline Cloudflare.
