import { createMarket } from "../../domain/market.js";
import type { MarketProvider } from "../ports/market-provider.js";

export async function scanMarket(
  provider: MarketProvider,
  coin: string,
): Promise<ReturnType<typeof createMarket>> {
  const offers = await provider.fetchOffers();
  return createMarket(
    coin,
    offers.filter((offer) => offer.market === coin),
  );
}
