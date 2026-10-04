import type { Offer } from "../../domain/offer.js";

export interface MarketProvider {
  fetchOffers(): Promise<readonly Offer[]>;
}
