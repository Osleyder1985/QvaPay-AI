# Estrategia de Pruebas

## Objetivo

Verificar de forma progresiva y trazable dominio, aplicación, integración QvaPay, infraestructura Cloudflare y dashboard.

## Niveles actuales

### Unitarias

Cubren:

- comparación decimal;
- invariantes de `Market`;
- `Offer`;
- Scanner Runtime.

### Contrato

Cubren:

- validación de la respuesta QvaPay;
- paginación;
- estados;
- tipos;
- precisión representada como strings.

### Integración

Cubren:

- cliente QvaPay;
- scheduler;
- Durable Object;
- estado persistente;
- dashboard público.

### Producción

El workflow Cloudflare añade verificación HTTP y runtime real después del deployment.

## Matriz de evidencia

Las pruebas ejecutables se relacionan con requisitos mediante `docs/requirements/requirements-traceability-matrix.md`.

## Regla

CI verde demuestra que los checks automatizados ejecutados pasaron. No sustituye una verificación runtime cuando el requisito exige evidencia de producción.

## Dependencias externas

Las pruebas deterministas no deben depender de secretos reales. Las verificaciones que requieren QvaPay/Cloudflare utilizan los mecanismos protegidos del pipeline.
