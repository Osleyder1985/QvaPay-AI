# Initial Software Requirements

## Propósito

Traducir los requisitos de sistema iniciales a responsabilidades de software sin inventar detalles de la API externa.

### SWR-FR-001 — Scan Market Use Case

El software deberá proporcionar un caso de uso que ejecute un escaneo del mercado y produzca un snapshot normalizado.

Trazabilidad: SYS-FR-001.

### SWR-FR-002 — Continuous Scanner Runtime

El software deberá proporcionar un runtime server-side capaz de ejecutar el caso de uso de escaneo sin depender de una sesión de usuario.

Trazabilidad: SYS-FR-002.

### SWR-FR-003 — SELL Book Processing

El software deberá clasificar, agrupar por mercado/moneda y ordenar ascendentemente por tasa las ofertas SELL.

Trazabilidad: SYS-FR-003.

### SWR-FR-004 — BUY Book Processing

El software deberá clasificar, agrupar por mercado/moneda y ordenar ascendentemente por tasa las ofertas BUY.

Trazabilidad: SYS-FR-004.

### SWR-IR-001 — External Provider Adapter

La integración con QvaPay deberá implementarse mediante una frontera de infraestructura que traduzca el contrato externo a modelos internos.

Trazabilidad: SYS-FR-001, SYS-QR-006.

### SWR-DR-001 — Market Snapshot Persistence

El software deberá persistir snapshots con referencia temporal y estado de procesamiento.

Trazabilidad: SYS-FR-002, SYS-QR-004, SYS-QR-005.

### SWR-IR-002 — Provider Request Policy

El adaptador deberá encapsular paginación, límites de frecuencia, timeouts y clasificación de errores del proveedor.

Trazabilidad: SYS-INT-003, SYS-INT-006, SYS-INT-007, SYS-INT-011.

### SWR-IR-003 — External Contract Validation

El adaptador deberá validar las respuestas externas antes de mapearlas a modelos internos.

Trazabilidad: SYS-INT-005, SYS-INT-012.

### SWR-DR-002 — Decimal Value Preservation

El software deberá representar cantidades y tasas con una estrategia numérica que preserve la precisión requerida por el contrato P2P.

Trazabilidad: SYS-INT-008.

### SWR-QR-001 — Controlled Retry

El software deberá aplicar una política de reintento limitada y con backoff para fallos transitorios y rate limiting.

Trazabilidad: SYS-INT-006, SYS-INT-007.

### SWR-SR-001 — Secret Isolation

El software no deberá exponer credenciales de proveedores externos al cliente web.

Trazabilidad: SYS-QR-006 y baseline de seguridad.

## Estado

Definidos como baseline inicial. Los detalles de API, esquema físico y límites cuantitativos permanecen TBD.

### SWR-IR-002 — Market Event Ingestion

El software deberá aceptar eventos del feed P2P mediante webhook y/o stream, validarlos y convertirlos a actualizaciones internas del estado de mercado.

Trazabilidad: SYS-QR-006, SYS-QR-008, SYS-QR-010.

### SWR-IR-003 — Market Reconciliation

El software deberá ejecutar reconciliaciones mediante `GET /p2p` para recuperar pérdidas de eventos y divergencias del estado interno.

Trazabilidad: SYS-QR-009.

### SWR-IR-004 — Provider Request Policy

La frontera QvaPay deberá encapsular paginación, límites, timeouts, clasificación de errores y backoff de las solicitudes de reconciliación.

Trazabilidad: SYS-QR-005.

### SWR-DR-002 — Decimal Value Preservation

Los valores económicos recibidos del proveedor deberán conservar precisión decimal suficiente para su uso posterior.

Trazabilidad: SYS-QR-006.
