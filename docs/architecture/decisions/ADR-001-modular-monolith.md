# ADR-001: Arquitectura de monolito modular

## Estado

Aceptado como línea base de la implementación actual.

## Contexto

QvaPay-AI necesita integrar un scanner, un proveedor externo, un runtime continuo y una interfaz web sin introducir complejidad operacional innecesaria.

## Decisión

Mantener un monolito modular con separación entre:

- Domain;
- Application;
- Infrastructure.

La implementación actual se despliega como un único Cloudflare Worker con un Durable Object.

## Consecuencias

- menor complejidad operacional;
- límites claros entre dominio y proveedor;
- pruebas deterministas;
- posibilidad de separar módulos en el futuro.

Microservicios y componentes externos permanentes no son necesarios para el estado actual.
