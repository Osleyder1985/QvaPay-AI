import type { Offer } from "../../domain/offer.js";

export interface MarketProvider {
  fetchOffers(coin: string): Promise<readonly Offer[]>;
}
