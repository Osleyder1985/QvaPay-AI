# Testing Strategy

## Objetivo

Verificar que QvaPay-AI satisface los requisitos y que los cambios no rompen contratos.

## Niveles

### Unit Tests

Reglas puras del dominio: separación BUY/SELL, agrupamiento, ordenación, validación de ofertas y configuración del intervalo.

### Integration Tests

Persistencia D1, scanner runtime e integración entre Application e Infrastructure.

### Contract Tests

Contrato externo de QvaPay: endpoint, autenticación, estructura, tipos, campos obligatorios y errores.

### End-to-End Tests

Flujo completo:

```
Configuración → Escaneo → Persistencia → API → UI
```

## Trazabilidad

| Requirement | Test |
|---|---|
| SYS-FR-001 | TEST-SYS-FR-001 |
| SYS-FR-002 | TEST-SYS-FR-002 |
| SYS-FR-003 | TEST-SYS-FR-003 |
| SYS-FR-004 | TEST-SYS-FR-004 |

Un Pull Request no deberá considerarse listo si falla compilación, lint, formato, pruebas, contratos obligatorios o trazabilidad.