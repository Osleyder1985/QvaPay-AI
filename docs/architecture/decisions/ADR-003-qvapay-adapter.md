# ADR-003: Frontera del adaptador QvaPay

## Estado

Aceptado como línea base inicial.

## Contexto

QvaPay es un sistema externo y su contrato no debe contaminar el dominio interno.

## Decisión

La integración se encapsulará detrás de un adaptador.

```
Application
    |
    v
QvaPayPort
    |
    v
QvaPayAdapter
    |
    v
QvaPay API
```

El adaptador será responsable de autenticación, llamadas HTTP, validación del contrato, mapeo de respuestas y clasificación de errores.

## Consecuencia

Los cambios del contrato externo quedan concentrados en Infrastructure siempre que la semántica de negocio permanezca estable.