# ADR-001: Modular Monolith Architecture

## Estado

Accepted as initial baseline.

## Contexto

QvaPay-AI necesita scanner 24/7, integración externa, persistencia e interfaz web. Los requisitos actuales no justifican múltiples servicios desplegados de forma independiente.

## Decisión

Adoptar un monolito modular con principios de arquitectura hexagonal/Clean Architecture.

Módulos conceptuales:

- Domain;
- Application;
- Infrastructure;
- Interfaces.

## Consecuencias positivas

- menor complejidad operacional;
- despliegue sencillo;
- separación clara de responsabilidades;
- facilidad para pruebas;
- posibilidad de extraer módulos posteriormente.

## Alternativas descartadas

Microservices: sobrearquitectura para esta fase.

Frontend-only scanner: incompatible con SYS-FR-002.

Monolito sin separación interna: dificulta evolución, pruebas y aislamiento de la integración externa.