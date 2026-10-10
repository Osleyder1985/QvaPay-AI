# Escáner de mercado P2P — Requisitos funcionales del sistema

## Propósito

Definir el comportamiento funcional actual y objetivo del scanner.

## SYS-FR-001 — Escaneo automático de mercado configurable

El sistema deberá ejecutar escaneos automáticos mediante un intervalo validado.

### Implementación actual

- `SCANNER_INTERVAL_SECONDS` configura el intervalo del Worker.
- El intervalo válido es 5–300 segundos.
- El objeto Durable Object conserva la configuración.
- La alarma programa el siguiente ciclo.

### Estado

**Implementado / Probado.**

## SYS-FR-002 — Ejecución continua del escáner 24/7

El escáner deberá funcionar sin depender de usuarios conectados.

### Implementación actual

Durable Object + Alarm ejecuta el ciclo en el servidor.

### Estado

**Implemented / Tested.** La certificación de producción depende de evidencia del flujo de trabajo de Cloudflare.

## SYS-FR-003 — Listado de ofertas SELL

Las ofertas SELL se mantienen separadas y se ordenan por tasa ascendente.

### Implementación actual

El panel identifica la mejor SELL como la de menor tasa y la marca visualmente.

### Estado

**Probado.**

## SYS-FR-004 — Listado de ofertas BUY

Las ofertas BUY se mantienen separadas y se ordenan por tasa descendente para determinar la mejor oferta.

### Implementación actual

El dashboard identifica la mejor BUY como la de mayor tasa.

### Estado

**Tested.**

## Identidad de mercado

Las ofertas solamente se aceptan cuando `offer.market === market.coin`. No se deben mezclar monedas.

## Datos visibles

El dashboard muestra:

- fecha de creación;
- usuario;
- QUSD;
- tasa;
- importe fiat;
- VIP;
- estado;
- acción.

## Acciones

- SELL → **Comprar** → botón verde.
- BUY → **Vender** → botón rojo.

La acción solicita confirmación y una clave de operación antes de llamar al endpoint server-side.

## Seguridad e idempotencia de operaciones

Antes de conectar las acciones visuales, el backend debe reservar la oferta de forma atómica en D1 y conservar estados separados para la aplicación y el detalle autoritativo. Manual y Auto Apply deben usar la misma clave única por oferta. Las operaciones ambiguas permanecen bloqueadas hasta reconciliarse; el navegador no puede liberar una reserva ni autorizar un reintento.

## Límite de alcance

La aplicación HTTP de una oferta P2P permanece bloqueada (`501`) aunque el cliente de infraestructura contiene la operación técnica. Esto no autoriza creación de un motor de arbitraje ni ejecución automática de estrategias.

## Requisitos futuros

Webhook, SSE, reconciliación event-driven y arbitraje requieren requisitos específicos antes de considerarse implementados. D1 ya está implementado para identidad, auditoría y snapshots de Cuenta; su verificación de producción requiere evidencia operacional.
