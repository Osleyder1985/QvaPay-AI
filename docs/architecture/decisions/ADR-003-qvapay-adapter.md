# ADR-003: Frontera del adaptador QvaPay

## Estado

Aceptado e implementado.

## Decisión

La integración externa se encapsula en:

`QvaPayP2PClient → p2p-contract → p2p-mapper → Domain`

El cliente es responsable de:

- autenticación server-side;
- GET `/p2p`;
- paginación;
- timeout;
- rate limiting;
- backoff;
- clasificación de errores;
- validación del contrato.

El mapper convierte DTO externos en `Offer`.

## Aplicación de ofertas

El mismo cliente contiene `applyOffer()` para la operación P2P protegida por el Worker. Esta operación está separada de la lectura del mercado y requiere credenciales de servidor.

## Regla

El dominio no importa tipos ni detalles del contrato QvaPay.
