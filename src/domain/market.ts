/**
 * @archivo src/domain/market.ts
 * @proposito Define la identidad de un mercado y las operaciones de ordenamiento de ofertas.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/domain dentro de la arquitectura de QvaPay-AI.
 */

import type { Offer, OfferSide } from "./offer.js";
import { compareDecimalStrings } from "./offer.js";

export interface Market {
  readonly coin: string;
  readonly offers: readonly Offer[];
}

/**
 * @proposito API pública createMarket: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function createMarket(coin: string, offers: readonly Offer[]): Market {
  const normalizedCoin = coin.trim();
  if (!normalizedCoin) {
    throw new Error("La moneda del mercado es obligatoria");
  }

  for (const offer of offers) {
    if (offer.market !== normalizedCoin) {
      throw new Error(
        "El mercado de la oferta no coincide con la identidad del mercado",
      );
    }
  }

  return {
    coin: normalizedCoin,
    offers: [...offers],
  };
}

/**
 * @proposito API pública offersBySide: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function offersBySide(
  market: Market,
  side: OfferSide,
): readonly Offer[] {
  return market.offers
    .filter((offer) => offer.side === side)
    .sort((left, right) => {
      const comparison = compareDecimalStrings(left.rate, right.rate);
      return side === "BUY" ? -comparison : comparison;
    });
}
