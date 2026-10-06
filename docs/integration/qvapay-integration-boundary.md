# Frontera de integración con QvaPay

## Implementación actual

La frontera real está implementada mediante `QvaPayP2PClient`.

```text
QvaPay HTTP response
        ↓
p2p-contract
        ↓
p2p-mapper
        ↓
Offer
        ↓
Market
```

## Responsabilidades

El adaptador:

1. autentica con `app-id` y `app-secret`;
2. consulta `GET /p2p`;
3. solicita BUY y SELL por separado;
4. recorre la paginación;
5. valida el esquema;
6. calcula la tasa efectiva;
7. conserva timestamps y datos de usuario;
8. clasifica errores;
9. aplica backoff limitado.

## Operación P2P

`applyOffer(uuid)` utiliza una petición `POST /p2p/:uuid/apply` y permanece exclusivamente en infraestructura.

## Seguridad

Las credenciales nunca se envían al navegador. La ruta pública de aplicación exige `P2P_ACTION_TOKEN` antes de llegar al proveedor.

## Estado

La integración de lectura está implementada y probada. Webhook, SSE y reconciliación event-driven permanecen pendientes.
