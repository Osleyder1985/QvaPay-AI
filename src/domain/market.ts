import type { Offer, OfferSide } from "./offer.js";
import { compareDecimalStrings } from "./offer.js";

export interface Market {
  readonly coin: string;
  readonly offers: readonly Offer[];
}

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
