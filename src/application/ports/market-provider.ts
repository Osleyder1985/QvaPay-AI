import type { Offer, OfferSide } from "../../domain/offer.js";

export interface MarketProvider {
  fetchOffers(coin: string, side: OfferSide): Promise<readonly Offer[]>;
}
