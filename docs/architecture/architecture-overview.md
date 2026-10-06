# Resumen de arquitectura

## Estado

**Implementación actual verificada:** Worker Cloudflare + Durable Object + Alarm + Scanner Runtime + adaptador QvaPay P2P + dashboard público.

## Flujo de mercado

```text
QvaPay P2P API
      │
      ▼
QvaPayP2PClient
      │
      ├── validación de contrato
      ├── paginación
      ├── backoff
      └── mapeo
      │
      ▼
Market / Offer
      │
      ▼
Scanner Runtime
      │
      ▼
Durable Object snapshot
      │
      ▼
GET /api/scanner/status
      │
      ▼
Dashboard web
```

## Ejecución continua

El ciclo no depende del navegador:

```text
Durable Object
      │
     Alarm
      ▼
Scanner Runtime
      ▼
GET /p2p
      ▼
Snapshot
      ▼
Programación del siguiente Alarm
```

La configuración del scanner usa `SCANNER_COIN` y `SCANNER_INTERVAL_SECONDS`. El intervalo válido es de 5 a 300 segundos.

## Mercado

El cliente realiza dos consultas independientes:

- `type=buy`;
- `type=sell`.

Ambas utilizan la misma `coin`. El sistema no mezcla monedas ni lados.

La tasa interna se calcula como:

`rate = receive / amount`

Para el dashboard:

- mejor BUY = mayor tasa;
- mejor SELL = menor tasa.

La fecha de creación no se utiliza para determinar la mejor oferta.

## Dashboard y organización operativa

El dashboard central está organizado por Inicio, Mercado P2P, Operaciones, Controles y Auditoría. La estructura está alineada con prácticas de calidad, seguridad, continuidad y trazabilidad inspiradas en ISO 9001, ISO/IEC 27001 e ISO 22301, sin declarar certificación.

La interfaz expone hasta diez ofertas por lado y muestra:

- fecha de creación;
- usuario;
- QUSD;
- tasa;
- importe fiat;
- VIP;
- estado;
- acción.

La mejor fila tiene heartbeat dorado.

## Operaciones P2P

La aplicación también expone una frontera server-side protegida para aplicar a una oferta. Requiere `P2P_ACTION_TOKEN` y las credenciales de aplicación de QvaPay.

Esta capacidad es distinta del análisis de mercado y no autoriza por sí sola automatización de arbitraje.

## Capacidades futuras

Los siguientes elementos permanecen fuera de la implementación actual:

- D1;
- webhook P2P;
- stream SSE;
- ingestión event-driven;
- reconciliación persistente;
- motor de arbitraje;
- ejecución automática de estrategias.
