# Data Model

## Entidades iniciales

### Market

Representa un mercado o par.

Atributos conceptuales: marketId, baseCurrency, quoteCurrency, displayName.

### Offer

Representa una oferta observada.

Atributos conceptuales: offerId, marketId, currency, side, rate, amount, availableAmount, sourceTimestamp, observedAt.

### OfferSide

Valores permitidos: BUY y SELL.

### MarketSnapshot

Representa el resultado de un escaneo.

Atributos conceptuales: scanId, startedAt, completedAt, status, offersCount, errorCode, offers.

## Reglas

1. BUY y SELL se conservan como lados independientes.
2. Una oferta pertenece a un mercado identificado.
3. La ordenación de presentación no modifica el dato original.
4. Cada snapshot conserva información temporal.
5. Los datos externos conservan la referencia necesaria para auditoría.

## TBD

El esquema físico de D1 se definirá después de validar el contrato real de QvaPay.