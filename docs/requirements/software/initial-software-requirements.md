# Initial Software Requirements

## Propósito

Traducir los requisitos de sistema y el contrato QvaPay verificado a responsabilidades de software sin acoplar el dominio al proveedor externo.

### SWR-FR-001 — Scan Market Use Case

El software deberá proporcionar un caso de uso que ejecute un escaneo del mercado y produzca un snapshot normalizado.

Trazabilidad: SYS-FR-001, SYS-INT-001.

### SWR-FR-002 — Continuous Scanner Runtime

El software deberá proporcionar un runtime server-side capaz de ejecutar el caso de uso de escaneo sin depender de una sesión de usuario.

Trazabilidad: SYS-FR-002.

### SWR-FR-003 — SELL Book Processing

El software deberá clasificar, agrupar por mercado/moneda y ordenar ascendentemente por tasa las ofertas SELL.

Trazabilidad: SYS-FR-003, SYS-INT-002, SYS-INT-003.

### SWR-FR-004 — BUY Book Processing

El software deberá clasificar, agrupar por mercado/moneda y ordenar ascendentemente por tasa las ofertas BUY.

Trazabilidad: SYS-FR-004, SYS-INT-002, SYS-INT-003.

### SWR-IR-001 — External Provider Adapter

La integración con QvaPay deberá implementarse mediante una frontera de infraestructura que traduzca el contrato externo a modelos internos.

Trazabilidad: SYS-INT-001, SYS-INT-007, SYS-QR-006.

### SWR-IR-002 — QvaPay Market Query

El adaptador deberá construir consultas a `GET /p2p` con `type`, `coin`, `page` y `take` según la configuración del escaneo.

Trazabilidad: SYS-INT-001, SYS-INT-004.

### SWR-DR-001 — Market Snapshot Persistence

El software deberá persistir snapshots con referencia temporal y estado de procesamiento.

Trazabilidad: SYS-FR-002, SYS-QR-004, SYS-QR-005.

### SWR-DR-002 — External Decimal Representation

El adaptador deberá procesar explícitamente los campos decimales que QvaPay serializa como strings y convertirlos a la representación numérica interna definida por el dominio.

Trazabilidad: SYS-INT-007.

### SWR-SR-001 — Secret Isolation

El software no deberá exponer credenciales de proveedores externos al cliente web.

Trazabilidad: SYS-QR-006 y baseline de seguridad.

### SWR-SR-002 — Safe Retry Policy

Los reintentos ante errores recuperables del proveedor deberán estar limitados por política, usar backoff y evitar duplicar efectos.

Trazabilidad: SYS-INT-006, SYS-QR-005.

## Estado

Definidos como baseline inicial. El esquema físico, la implementación concreta del cliente HTTP y los límites cuantitativos propios del sistema permanecen sujetos a pruebas y decisiones posteriores.
