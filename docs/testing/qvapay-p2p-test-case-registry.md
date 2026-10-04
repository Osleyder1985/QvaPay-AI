# Registro de casos de prueba QvaPay P2P

## Propósito

Este registro vincula los identificadores formales de la matriz de trazabilidad con pruebas ejecutables existentes. Un identificador no debe considerarse evidencia por sí mismo: la evidencia corresponde al resultado de la prueba indicada y a los criterios de aceptación que cubre.

| Test ID | Requisito | Prueba ejecutable | Cobertura |
|---|---|---|---|
| CT-QVA-001 | SYS-INT-001 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Consulta GET /p2p |
| CT-QVA-002 | SYS-INT-002 | `tests/infrastructure/qvapay-p2p-client.test.ts`, `tests/application/scan-market.test.ts` | BUY/SELL y coin independientes |
| CT-QVA-003 | SYS-INT-003 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Paginación completa |
| CT-QVA-004 | SYS-INT-005 | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Validación del contrato externo |
| CT-QVA-005 | SYS-INT-006 | `tests/infrastructure/qvapay-p2p-client.test.ts` | 429, Retry-After y límite de reintentos |
| CT-QVA-006 | SYS-INT-007 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Clasificación de 401, 4xx y errores del proveedor |
| CT-QVA-007 | SYS-INT-008 | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Preservación decimal como string |
| CT-QVA-008 | SYS-INT-009 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Integración exclusivamente GET |
| CT-QVA-009 | SYS-INT-010 | `tests/infrastructure/qvapay-p2p-client.test.ts` | Timestamp de observación |
| CT-QVA-011 | SYS-INT-012 | `tests/infrastructure/qvapay-p2p-contract.test.ts` | Evolución segura mediante validación estricta |

## Casos todavía no cubiertos

- CT-QVA-010 — SYS-INT-011: comportamiento frente a caché y programación de consultas.
- SEC-QVA-001 — SYS-INT-004: aislamiento de credenciales en servidor.

Estos identificadores permanecen planificados hasta disponer de pruebas y evidencia aplicables.
