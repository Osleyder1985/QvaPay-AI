# Línea base operativa

## Ciclo

```
Idle
  ↓
Alarm Triggered
  ↓
Load Configuration
  ↓
Fetch QvaPay Market
  ↓
Validate Response
  ↓
Normalize Offers
  ↓
Persist Snapshot
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

## Fallos

Ante un error de QvaPay:

1. registrar el error técnico sin secretos;
2. conservar el último snapshot válido;
3. marcar el intento como fallido;
4. programar el siguiente ciclo según política;
5. evitar duplicados lógicos.

## Observabilidad

Registrar inicio, fin, duración, cantidad de ofertas, cantidades BUY/SELL, estado, código de error y timestamp.

## Despliegue

El despliegue deberá pasar por CI/CD y no depender de un navegador abierto.

## Recuperación

El diseño deberá ser idempotente para soportar reintentos y reinicios.