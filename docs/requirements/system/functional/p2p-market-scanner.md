# Escáner de mercado P2P — Requisitos funcionales del sistema

## Propósito

Definir el comportamiento funcional actual y objetivo del scanner.

## SYS-FR-001 — Configurable automatic market scanning

El sistema deberá ejecutar escaneos automáticos mediante un intervalo validado.

### Implementación actual

- `SCANNER_INTERVAL_SECONDS` configura el intervalo del Worker.
- El intervalo válido es 5–300 segundos.
- El Durable Object conserva la configuración.
- El Alarm programa el siguiente ciclo.

### Estado

**Implemented / Tested.**

## SYS-FR-002 — Continuous 24/7 scanner execution

El scanner deberá funcionar sin depender de usuarios conectados.

### Implementación actual

Durable Object + Alarm ejecuta el ciclo server-side.

### Estado

**Implemented / Tested.** La certificación de producción depende de evidencia del workflow Cloudflare.

## SYS-FR-003 — SELL offers listing

Las ofertas SELL se mantienen separadas y se ordenan por tasa ascendente.

### Implementación actual

El dashboard identifica la mejor SELL como la de menor tasa y la marca visualmente.

### Estado

**Tested.**

## SYS-FR-004 — BUY offers listing

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

## Límite de alcance

La aplicación HTTP de una oferta P2P permanece bloqueada (`501`) aunque el cliente de infraestructura contiene la operación técnica. Esto no autoriza creación de un motor de arbitraje ni ejecución automática de estrategias.

## Requisitos futuros

Webhook, SSE, reconciliación event-driven y arbitraje requieren requisitos específicos antes de considerarse implementados. D1 ya está implementado para identidad, auditoría y snapshots de Cuenta; su verificación de producción requiere evidencia operacional.
