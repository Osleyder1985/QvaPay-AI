# Quality Gate del repositorio

## Propósito

El repositorio utiliza GitHub Actions como quality gate mínimo para cambios integrados mediante pull request.

## Estado actual

Mientras el repositorio se encuentre en fase documental, el CI verifica:

- existencia de la documentación normativa requerida;
- estructura básica de los documentos Markdown;
- destinos locales de enlaces Markdown;
- ejecución limpia del workflow sobre pull requests y `main`.

## Evolución prevista

Cuando exista implementación ejecutable, el quality gate deberá ampliarse para incluir, como mínimo:

1. instalación reproducible de dependencias;
2. compilación TypeScript;
3. lint;
4. format check;
5. pruebas unitarias;
6. pruebas de integración;
7. pruebas de contrato QvaPay;
8. pruebas E2E cuando exista UI ejecutable;
9. validación de trazabilidad requisito → prueba → evidencia.

Un cambio no se considera listo para integración si el quality gate obligatorio falla.

## Relación con la estrategia de pruebas

Este CI implementa la primera capa automatizada de la estrategia definida en `docs/testing/testing-strategy.md`. No sustituye las pruebas de comportamiento; establece el mecanismo de enforcement para que las verificaciones posteriores puedan convertirse en gates obligatorios.

## Política

El CI debe permanecer determinista, reproducible y sin secretos. Las pruebas que requieran credenciales reales o una suscripción de QvaPay deberán utilizar mecanismos explícitos de entorno protegido y no bloquearán el baseline documental por ausencia de secretos.
