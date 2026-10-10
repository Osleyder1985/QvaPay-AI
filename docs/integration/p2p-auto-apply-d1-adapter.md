# Adaptador D1 compartido para Auto Apply

## Propósito y estado

`src/infrastructure/cloudflare/p2p-auto-apply-d1-adapter.ts` conecta los puertos de ejecución con el almacén D1 de operaciones P2P existente. Es un incremento de infraestructura; todavía no se conecta al Durable Object ni activa ejecución automática.

## Controles implementados

- Reserva mediante `reserveP2POperation` con origen `AUTO_APPLY`; utiliza la restricción única de `offer_uuid` compartida con `MANUAL`.
- Reclamación mediante `claimP2POperation`, que exige la transición condicional `RESERVED → APPLYING`.
- Liberación limitada a reservas que sigan en `RESERVED`; nunca elimina una operación reclamada.
- Auditoría de la decisión en `security_audit_log` antes de reclamar y antes de invocar al proveedor.
- Persistencia de resultado mediante `recordP2PApplyOutcome`; si no se confirma la escritura, se propaga el error y no se intenta reenviar el POST.
- Ausencia de estrategia u ofertas inyectadas implica valores vacíos/deshabilitados; no se activa Auto Apply por defecto.
- Un timeout o error desconocido durante la aplicación se trata como `AMBIGUOUS`; un rechazo explícito 4xx se conserva como `REJECTED`.
- Una respuesta exitosa del POST solo se marca `CONFIRMED` cuando el proveedor inyectado consulta el detalle autoritativo y se cumplen simultáneamente `detail.uuid === offerUuid`, `detail.status === processing` y `detail.peerUuid === verifiedAccountUuid` obtenido de una fuente server-side verificada. Si falta cualquiera de los puertos, la consulta falla o la identidad no coincide, el resultado queda `AMBIGUOUS` y no se reenvía el POST.
- `createQvaPayAutoApplyProvider` conecta los puertos al cliente P2P y a `QvaPayAccountClient.fetchAccount()`. Solo devuelve UUID si `integrationStatus`, `identitySource=/user`, procedencia de identidad, identidad y correlación de propietario están verificadas; en cualquier otro caso devuelve `null`. Las pruebas unitarias cubren el camino válido y el fallo cerrado.

## Límites pendientes

1. No existe todavía un almacén persistido de estrategias Auto Apply ni una interfaz administrativa para configurarlas.
2. El proveedor de ofertas debe inyectar snapshots frescos y el contexto de cuenta/balance verificado en el servidor.
3. El Durable Object actual no dispone de D1 ni de token de usuario en su contrato de entorno; aún no se ha conectado este adaptador al ciclo del scanner. La fábrica del proveedor ya existe, pero no se invoca desde el runtime.
4. Falta una prueba de integración D1 que ejecute simultáneamente las rutas `MANUAL` y `AUTO_APPLY`, así como recuperación de un estado `APPLYING` tras fallo de persistencia posterior al POST.
5. La auditoría actual registra la decisión básica; antes de habilitar operaciones debe ampliarse con los parámetros exactos de estrategia y la procedencia/frescura de cada evidencia, conforme al Issue #233.

## Justificación normativa previa

- ISO/IEC 25010:2023: fiabilidad, seguridad y tolerancia a fallos.
- ISO/IEC/IEEE 29119-2:2021: pruebas de fallos, límites y concurrencia.
- ISO/IEC/IEEE 12207:2017: trazabilidad entre requisito, implementación, prueba y documentación.

Estas referencias son criterios de diseño y verificación, no una declaración de certificación.
