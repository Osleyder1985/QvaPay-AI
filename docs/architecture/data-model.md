# Modelo de datos

## Market

Representa un mercado identificado por `coin`.

Atributos actuales:

- `coin`;
- `offers`.

El dominio rechaza una oferta cuyo mercado no coincida con la identidad del mercado.

## Offer

Representa una oferta observada.

Atributos actuales:

- `id`;
- `market`;
- `side`;
- `rate`;
- `amount`;
- `availableAmount`;
- `status`;
- `sourceTimestamp`;
- `observedAt`;
- `createdAt`;
- `creatorUsername`;
- `creatorVip`;
- `onlyVip`;
- `fiatAmount`.

## OfferSide

Valores:

- `BUY`;
- `SELL`.

## Estados

`open`, `revision`, `processing`, `paid`, `completed`, `cancelled`.

## Reglas

1. BUY y SELL son libros independientes.
2. Las ofertas se asocian a una única identidad de mercado.
3. Las tasas se comparan como decimales representados en texto.
4. `observedAt` representa el momento de observación de QvaPay-AI.
5. `createdAt` conserva el timestamp de creación proporcionado por QvaPay cuando existe.
6. El dashboard calcula métricas sin modificar el dato fuente.

## Persistencia actual

El snapshot vive en el almacenamiento del Durable Object.

D1 no forma parte todavía del modelo físico implementado.
