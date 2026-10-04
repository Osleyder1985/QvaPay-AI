import type { Offer, OfferSide } from "./offer.js";
import { compareDecimalStrings } from "./offer.js";

export interface Market {
  readonly coin: string;
  readonly offers: readonly Offer[];
}

export function createMarket(coin: string, offers: readonly Offer[]): Market {
  const normalizedCoin = coin.trim();
  if (!normalizedCoin) {
    throw new Error("Market coin is required");
  }

  for (const offer of offers) {
    if (offer.market !== normalizedCoin) {
      throw new Error("Offer market does not match market identity");
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
    .sort((left, right) => compareDecimalStrings(left.rate, right.rate));
}
