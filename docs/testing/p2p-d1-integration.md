# Pruebas de integración de concurrencia P2P con D1

## Propósito

Verificar la reserva y la reclamación de operaciones P2P mediante el binding D1 de Cloudflare Workers, sin sustituir las consultas SQL por un mock de JavaScript.

## Ejecución

- Suite unitaria general: `npm test`.
- Suite de integración D1 local: `npm run test:d1`.

La suite dedicada usa `@cloudflare/vitest-plugin`, `wrangler.toml` y Miniflare. La base de datos se ejecuta localmente en el entorno de pruebas; no se usa una base D1 remota.

## Escenarios cubiertos

1. Dos reservas simultáneas de la misma oferta, una `MANUAL` y otra `AUTO_APPLY`: debe existir una sola operación debido a la restricción SQL `UNIQUE(offer_uuid)`.
2. Dos reclamaciones simultáneas de la misma reserva: solo una puede cambiar el estado de `RESERVED` a `APPLYING`.

Los identificadores de las ofertas son sintéticos y únicos por prueba. La suite no crea solicitudes HTTP a QvaPay ni envía operaciones financieras.

## Alcance y limitaciones

Estas pruebas ejercitan SQL real en D1 local de Miniflare; no son una prueba de concurrencia contra la base de datos D1 de producción. La integración del adaptador en el Durable Object, la estrategia Auto Apply persistida, la procedencia server-side de ofertas/balance/identidad y la revisión independiente siguen siendo requisitos separados antes de habilitar operaciones.
