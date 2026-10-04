# QvaPay P2P Market API Contract

## Fuente y fecha de verificación

Fuente primaria: documentación oficial de QvaPay API.

Fecha de verificación: 2026-10-04.

Base URL:

`https://api.qvapay.com`

## Endpoint de mercado

`GET /p2p`

La operación devuelve un listado paginado de ofertas P2P disponibles.

### Consulta mínima por lado y moneda

```text
GET /p2p?take=100&page=1&type=sell&coin=BANK_CUP
GET /p2p?take=100&page=1&type=buy&coin=BANK_CUP
```

El adaptador deberá generar estas consultas con valores configurados, no con una moneda fija codificada.

## Paginación

La documentación define:

- `page`: página, por defecto 1.
- `take`: resultados por página, por defecto 20 y máximo 100.

El scanner deberá continuar la paginación cuando el contrato y la configuración indiquen que existen más resultados que los recuperados en la primera página.

## Ordenamiento

QvaPay documenta:

- `orderBy=ratio`
- `orderBy=best_rate`
- `orderType=asc|desc`

`best_rate` requiere `type` y `coin`.

Para QvaPay-AI, la presentación seguirá siendo una responsabilidad interna: los datos deberán agruparse por mercado y lado, y ordenarse según las reglas de los requisitos del sistema.

## Modelo externo mínimo

```text
P2P Offer
├── uuid
├── type
├── coin
├── amount
├── receive
├── status
├── created_at
├── updated_at
├── offer_kind
├── available_amount
├── reserved_amount
├── order_min
└── order_max
```

Los decimales se reciben como strings y deben convertirse de forma explícita y segura a la representación numérica interna seleccionada.

## Identidad de mercado

`coin` debe conservarse sin pérdida. Una oferta de `BANK_CUP` no puede mezclarse con una oferta de otra moneda solamente porque ambas tengan valores numéricos comparables.

## Lado del mercado

`type=buy` y `type=sell` son semánticamente distintos y deben mantenerse separados hasta la capa de presentación.

## Errores y límites

La integración deberá manejar al menos:

- `400`: parámetros o acceso inválidos.
- `401`: autenticación inválida o ausente.
- `429`: límite de frecuencia excedido.

Los reintentos ante `429` deberán utilizar backoff exponencial y respetar la política de frecuencia de QvaPay.

La documentación actual indica que el listado público puede estar cacheado durante algunos segundos y que consultar más rápido que esa caché no necesariamente produce datos más frescos.

## Autenticación

QvaPay documenta dos mecanismos relevantes:

1. Bearer Token.
2. Credenciales de aplicación mediante `app-id` y `app-secret`.

Para el scanner server-side, la documentación de QvaPay recomienda credenciales de aplicación para integraciones autónomas/bots de arbitraje. La implementación deberá mantener estas credenciales fuera del navegador.

## Alcance de solo lectura

Este contrato documenta únicamente la lectura del mercado para el alcance inicial.

No se autoriza por este documento:

- crear ofertas;
- editar ofertas;
- aplicar a ofertas;
- marcar pagos;
- confirmar recepción;
- cancelar ofertas;
- ejecutar operaciones financieras.

## Feed de mercado

QvaPay también documenta un feed P2P por SSE en `/v2/p2p/stream`, autenticado con credenciales de aplicación, y un mecanismo de webhook.

Estos mecanismos quedan registrados como opciones de arquitectura para detectar cambios, pero no sustituyen automáticamente el requisito SYS-FR-001 de un intervalo de escaneo configurable. Su adopción requiere una decisión arquitectónica explícita y pruebas de compatibilidad con el runtime seleccionado.

## Pruebas de contrato pendientes

Antes de cerrar el contrato como Verified deberán comprobarse en entorno autorizado:

1. respuesta real de `GET /p2p`;
2. paginación;
3. filtros BUY/SELL;
4. filtros por `coin`;
5. tipos reales de todos los campos;
6. comportamiento ante `400`, `401` y `429`;
7. comportamiento real de caché y cabecera `X-Cache`;
8. compatibilidad con credenciales de aplicación;
9. límites efectivos de frecuencia.

## Referencias

- QvaPay API — Introducción.
- QvaPay API — Listar Ofertas P2P.
- QvaPay API — Operar con credenciales de app.
- QvaPay API — Feed del mercado (stream).
