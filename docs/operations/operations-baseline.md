# Línea base operativa

## Ciclo

```
Idle
  ↓
Alarm Triggered
  ↓
Load Configuration
  ↓
Mark Execution Started
  ↓
Fetch QvaPay Market
  ↓
Validate Response
  ↓
Normalize Offers
  ↓
Persist Snapshot
  ↓
Mark Execution Completed
  ↓
Schedule Next Run
  ↓
Idle
```

## Estados

- IDLE;
- RUNNING;
- SUCCEEDED;
- FAILED.

## Persistencia de ejecución

El Durable Object mantiene un estado mínimo de ejecución independiente de la instancia en memoria:

- `lastStartedAt`;
- `lastCompletedAt`;
- `lastError`.

Este estado permite comprobar desde una interfaz HTTP autenticada que un ciclo del scanner realmente comenzó y terminó. La ausencia de `lastCompletedAt` junto con un `lastError` indica un ciclo fallido.

## Fallos

Ante un error de QvaPay:

1. registrar el error técnico sin secretos;
2. conservar el último snapshot válido;
3. marcar el intento como fallido;
4. persistir el error de ejecución;
5. programar el siguiente ciclo según política;
6. evitar duplicados lógicos.

## Observabilidad

La ejecución debe permitir observar inicio, fin, estado, error y timestamp. La verificación de producción debe utilizar el endpoint interno autenticado de estado y, cuando corresponda, los logs de Cloudflare.

## Despliegue

El despliegue deberá pasar por CI/CD y no depender de un navegador abierto.

## Recuperación

El diseño deberá ser idempotente para soportar reintentos y reinicios.

## Certificación

La existencia del estado persistente no constituye por sí misma evidencia de ejecución en producción. La certificación requiere evidencia objetiva obtenida después del despliegue real del Worker y del Durable Object.
