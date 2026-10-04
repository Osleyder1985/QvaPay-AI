# Requirements Traceability Matrix

## Propósito

Relacionar los requisitos funcionales iniciales con la arquitectura, componentes y estrategia de pruebas de QvaPay-AI.

## Flujo de trazabilidad

```
Requirement
    ↓
Business / Stakeholder Objective
    ↓
System Requirement
    ↓
Software Requirement
    ↓
Architecture / Design
    ↓
Implementation
    ↓
Test Case
    ↓
Verification Evidence
    ↓
Release
```

## Matriz

| Requirement ID | Requisito | Architecture / Component | Test | Estado |
|---|---|---|---|---|
| SYS-FR-001 | Escaneo automático del mercado P2P mediante intervalo configurable | Scanner Runtime, Durable Object, Alarm, Configure Scanner | TEST-SYS-FR-001 | Defined |
| SYS-FR-002 | Ejecución continua 24/7 sin usuarios conectados | Durable Object, Scanner Runtime, Operations | TEST-SYS-FR-002 | Defined |
| SYS-FR-003 | Ofertas SELL agrupadas por moneda y ordenadas por tasa ascendente | Domain Offer, Market, Application Scan Market, Web Interface | TEST-SYS-FR-003 | Defined |
| SYS-FR-004 | Ofertas BUY agrupadas por moneda y ordenadas por tasa ascendente | Domain Offer, Market, Application Scan Market, Web Interface | TEST-SYS-FR-004 | Defined |
| SYS-QR-001 | Disponibilidad independiente de usuarios | Durable Object, Scanner Runtime | TEST-SYS-QR-001 | Defined |
| SYS-QR-002 | Configuración validada del intervalo | Configure Scanner | TEST-SYS-QR-002 | Defined |
| SYS-QR-003 | Integridad de clasificación BUY/SELL y mercados | Domain Offer, Market | TEST-SYS-QR-003 | Defined |
| SYS-QR-004 | Trazabilidad temporal de snapshots | MarketSnapshot, D1 | TEST-SYS-QR-004 | Defined |
| SYS-QR-005 | Resiliencia ante errores de QvaPay | QvaPay Adapter, Operations | TEST-SYS-QR-005 | Defined |
| SYS-QR-006 | Validación de datos externos | QvaPay Adapter, QvaPay Mapper | TEST-SYS-QR-006 | Defined |
| SYS-QR-007 | Testabilidad del dominio | Domain layer | TEST-SYS-QR-007 | Defined |

## Estados

- **Defined**: requisito documentado.
- **Implemented**: requisito implementado.
- **Tested**: existe prueba ejecutada.
- **Verified**: existe evidencia de verificación.
- **TBD**: requiere definición adicional.

Un requisito no se considera completamente cerrado hasta disponer de implementación, prueba y evidencia cuando sean aplicables.

## Pendientes

- validar contrato real de la API de QvaPay;
- definir identificadores oficiales de mercados y monedas;
- establecer límites cuantitativos del intervalo;
- definir política formal de reintentos;
- definir retención de snapshots;
- convertir los casos de prueba conceptuales en artefactos ejecutables.