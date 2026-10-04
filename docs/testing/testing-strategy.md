# Estrategia de Pruebas

## Objetivo

Verificar que QvaPay-AI cumple sus requisitos funcionales, de calidad, integración, seguridad y operación mediante una estrategia progresiva y trazable.

## Niveles

- **Unitarias:** reglas de dominio y casos deterministas.
- **Integración:** persistencia D1, runtime del scanner y adaptadores.
- **Contrato:** compatibilidad con la API y feed P2P de QvaPay.
- **E2E:** configuración → ingestión/reconciliación → persistencia → API → UI.
- **Seguridad:** autenticación del webhook, secretos, validación de entrada, deduplicación y manejo seguro de errores.

## Quality gate de CI

Todo pull request deberá pasar el workflow de GitHub Actions definido en `.github/workflows/quality-gate.yml`.

En la fase documental, el gate comprueba la presencia e integridad estructural mínima de la documentación y los enlaces internos.

Cuando exista código ejecutable, el gate deberá incorporar:

- compilación;
- lint;
- format check;
- pruebas unitarias;
- pruebas de integración;
- pruebas de contrato;
- pruebas E2E aplicables;
- controles de seguridad automatizados.

## Criterio de integración

Un pull request no deberá integrarse si un check obligatorio falla o si existe una evidencia de trazabilidad requerida que no esté disponible.

## Evidencia

Cada prueba significativa deberá poder relacionarse con uno o más requisitos mediante la matriz de trazabilidad. Los resultados del CI constituyen evidencia de verificación automatizada; no sustituyen evidencia operativa de producción cuando esta sea requerida.

## Dependencias externas

Las pruebas que requieran QvaPay real, feed de pago o credenciales deberán estar separadas de las verificaciones deterministas del CI base. Los secretos nunca se almacenarán en el repositorio.
