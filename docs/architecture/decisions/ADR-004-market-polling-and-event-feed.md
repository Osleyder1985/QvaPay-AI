# ADR-004: Market Polling and Event Feed

## Estado

Accepted as initial baseline.

## Contexto

QvaPay documenta dos mecanismos para conocer cambios del mercado P2P:

- consulta del mercado mediante `GET /p2p`;
- feed de eventos mediante stream SSE o webhook.

El requisito SYS-FR-001 establece explícitamente que el escaneo debe ejecutarse utilizando un intervalo configurable por el usuario.

## Decisión

La primera implementación mantendrá el **polling server-side configurable** como mecanismo primario del scanner.

El feed de mercado se tratará como una capacidad complementaria futura para reducir latencia o reaccionar a cambios entre ciclos, pero no reemplazará el requisito de intervalo configurable sin una modificación formal de requisitos.

## Razones

1. Mantiene una correspondencia directa con SYS-FR-001.
2. Permite controlar explícitamente la frecuencia de escaneo.
3. Simplifica la primera implementación y las pruebas de contrato.
4. Evita convertir una suscripción externa en una dependencia obligatoria del MVP.
5. Permite incorporar posteriormente eventos como optimización sin romper el dominio.

## Restricciones

El polling deberá respetar:

- límites de frecuencia de QvaPay;
- comportamiento de caché;
- backoff ante `429`;
- límites operativos del runtime;
- política de reintentos.

El scanner no deberá interpretar una respuesta cacheada como evidencia de que no hubo cambios en el mercado; solamente representa el último estado entregado por QvaPay.

## Consecuencia

La arquitectura conserva:

```text
Durable Object Alarm
        ↓
ScanMarket
        ↓
QvaPay Adapter
        ↓
GET /p2p
        ↓
Snapshot
```

Una futura integración del feed podrá coexistir con este flujo mediante una estrategia explícita de reconciliación de eventos y snapshots.

## Trazabilidad

- SYS-FR-001
- SYS-FR-002
- SYS-INT-005
- SYS-QR-005
- Issue #5
