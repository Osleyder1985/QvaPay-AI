# QvaPay P2P Market Integration Requirements

## Propósito

Formalizar los requisitos de integración derivados del contrato oficial de la API P2P de QvaPay.

## Requisitos

### SYS-INT-001 — Consulta del mercado P2P

El sistema deberá obtener las ofertas públicas del mercado P2P mediante la operación HTTP `GET /p2p` de QvaPay.

Trazabilidad: SYS-FR-001, SYS-FR-003, SYS-FR-004.

### SYS-INT-002 — Separación por tipo de oferta

El sistema deberá tratar `buy` y `sell` como lados independientes del mercado y no deberá mezclarlos durante la clasificación, ordenamiento o presentación.

Trazabilidad: SYS-FR-003, SYS-FR-004.

### SYS-INT-003 — Identificación del mercado

El sistema deberá conservar `coin` como parte de la identidad del mercado observado. Las tasas de mercados con monedas distintas no deberán compararse como si pertenecieran al mismo libro.

Trazabilidad: SYS-FR-003, SYS-FR-004, SYS-QR-003.

### SYS-INT-004 — Paginación

El sistema deberá soportar la paginación de la respuesta P2P mediante `page` y `take`, respetando los límites documentados por QvaPay.

Trazabilidad: SYS-FR-001, SYS-QR-006.

### SYS-INT-005 — Control de frecuencia

El sistema deberá respetar los límites de frecuencia y la caché documentados por QvaPay. Un intervalo de escaneo configurable no deberá provocar solicitudes innecesarias por debajo de la frescura efectiva del mercado.

Trazabilidad: SYS-FR-001, SYS-QR-002, SYS-QR-005.

### SYS-INT-006 — Tratamiento de 429

Ante un HTTP 429, el sistema deberá aplicar una estrategia de backoff y evitar reintentos inmediatos e ilimitados.

Trazabilidad: SYS-QR-005.

### SYS-INT-007 — Validación de respuesta externa

El sistema deberá validar la estructura y los tipos recibidos antes de convertir una respuesta QvaPay en modelos internos.

Trazabilidad: SYS-QR-006.

### SYS-INT-008 — Modo de observación inicial

La integración correspondiente al alcance inicial deberá limitarse a lectura del mercado. No deberá ejecutar operaciones que creen, editen, apliquen, paguen, liberen o cancelen ofertas.

Trazabilidad: alcance de Issue #1 e Issue #5.

## Estado

Definidos con base en la documentación oficial consultada el 2026-10-04. Los detalles no documentados por QvaPay permanecen TBD y deberán verificarse mediante pruebas de contrato o integración antes de implementarse.
