# Frontera de ejecución Auto Apply

## Propósito y estado

`src/application/p2p-auto-apply-executor.ts` define una orquestación por puertos explícitos. No incluye adaptadores D1 ni un cliente QvaPay; por sí sola no habilita ejecución productiva. La estrategia ausente o deshabilitada termina sin cargar ofertas ni llamar al proveedor.

## Secuencia obligatoria

1. Cargar estrategia configurada; si falta o está deshabilitada, terminar sin efectos.
2. Obtener ofertas/snapshot elegibles y evaluar cada oferta con el evaluador puro.
3. Registrar la decisión; para candidatos elegibles, reservar mediante el almacén idempotente compartido con operaciones manuales.
4. Rechazar reservas existentes o estados distintos de `RESERVED`.
5. Persistir la decisión de elegibilidad antes de reclamar y antes de cualquier POST.
6. Reclamar condicionalmente la operación; solo el ganador puede llamar una vez a `applyOnce`.
7. Persistir `CONFIRMED`, `REJECTED` o `AMBIGUOUS`. Una excepción tras iniciar la solicitud se trata como ambigua y nunca se reintenta en esta orquestación.

## Contratos pendientes antes de producción

- El adaptador `reserve` debe usar la restricción única D1 de `offer_uuid` compartida por `MANUAL` y `AUTO_APPLY`.
- `claim` debe implementar una transición condicional `RESERVED → APPLYING`.
- `recordDecision` debe guardar estrategia, parámetros, snapshot, balance pertinente y correlación según el Issue #233, sin secretos.
- `applyOnce` debe ser un adaptador explícito, acotado por timeout y sin reintentos automáticos para operaciones ambiguas.
- La identidad y elegibilidad de cuenta y la frescura del balance deben provenir de fuentes verificadas del servidor, no de la UI.
- Deben añadirse pruebas de integración con D1 simulado y una prueba de carrera MANUAL/AUTO_APPLY antes de integrar en el Durable Object.

## Justificación normativa previa

- ISO/IEC 25010:2023: fiabilidad, seguridad y tolerancia a fallos.
- ISO/IEC/IEEE 29119-2:2021: diseño de pruebas para concurrencia, límites y fallos ambiguos.
- ISO/IEC/IEEE 12207:2017: trazabilidad requisito-implementación-prueba.

Estas referencias son criterios de diseño; no constituyen certificación.
