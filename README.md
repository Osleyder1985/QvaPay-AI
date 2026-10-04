# QvaPay-AI

QvaPay-AI es el sistema orientado al análisis automatizado del mercado P2P de QvaPay.

## Estado del repositorio

Este repositorio está en fase inicial de definición de requisitos. La documentación funcional precede a la implementación.

## Requisitos

La documentación de requisitos se organiza por niveles:

- Business Requirements
- Stakeholder Requirements
- System Requirements
- Software Requirements
- Transition Requirements
- Requirements Traceability

La documentación explicativa se mantiene en español. Los nombres técnicos de archivos, carpetas, identificadores de requisitos, Issues y Pull Requests se mantienen en inglés.

## Principios

1. No se realizan cambios directamente sobre `main`.
2. Los cambios deben estar respaldados por un Issue.
3. Los cambios se implementan mediante una rama y un Pull Request.
4. Los requisitos deben tener identificadores estables.
5. Los requisitos deben poder trazarse hasta diseño, implementación y verificación.
6. Las capacidades de QvaPay que no hayan sido verificadas se marcarán como TBD y no se asumirán como hechos.
7. Ningún elemento se considerará terminado o certificado sin evidencia objetiva conforme a la política de verificación y certificación.

## Primer alcance funcional

El primer alcance documentado comprende el escaneo automático del mercado P2P, su ejecución continua 24/7 y la presentación separada de ofertas SELL y BUY por moneda y tasa ascendente.

## Referencia

- Issue #1: Establish initial P2P market scanner requirements documentation

## Verificación y certificación

La política transversal del proyecto está definida en [Política de verificación y certificación](docs/quality/verification-and-certification-policy.md). Su aplicación es obligatoria para requisitos, diseño, implementación, pruebas, integraciones, infraestructura, documentación y releases.
